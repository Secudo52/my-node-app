const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

async function dbMiddleware(ctx, next) {
  ctx.db = await getDb();
  await next();
}

async function groupHeaderMiddleware(ctx, next) {
  ctx.set('X-Group', process.env.GROUP_NAME || 'BBMO-01-23');
  await next();
}

async function errorMiddleware(ctx, next) {
  try {
    await next();
  } catch (err) {
    const status = err.status || 500;
    const body = {
      error: err.message || 'Internal Server Error',
      status
    };
    if (err.details) {
      body.details = err.details;
    }
    ctx.status = status;
    ctx.body = body;
  }
}

async function loggerMiddleware(ctx, next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[HTTP] ${ctx.method} ${ctx.url} -> ${ctx.status} (${ms}ms)`);
}

const userBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'минимум 2 символа',
    'any.required': 'name обязателен'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'неверный формат',
    'any.required': 'email обязателен'
  }),
  group_name: Joi.string().pattern(/^(BBMO|ББМО)-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'формат ББМО-XX-XX',
    'any.required': 'group_name обязателен'
  }),
  age: Joi.number().integer().min(16).max(100).messages({
    'number.min': 'возраст от 16',
    'number.max': 'возраст до 100'
  }),
  course: Joi.number().integer().min(1).max(4),
  password: Joi.string().min(6),
  role: Joi.string().valid('user', 'admin', 'moderator')
});

function validateBody(schema) {
  return async (ctx, next) => {
    const { error, value } = schema.validate(ctx.request.body, { abortEarly: false });
    if (error) {
      const err = new Error('Validation failed');
      err.status = 400;
      err.details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message
      }));
      throw err;
    }
    ctx.request.body = value;
    await next();
  };
}

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).messages({
    'number.min': 'должно быть больше 0'
  }),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().valid('name', '-name', 'age', '-age', 'created_at', '-created_at'),
  group_name: Joi.string().pattern(/^(BBMO|ББМО)-\d{2}-\d{2}$/),
  course: Joi.number().integer().min(1).max(4),
  age_min: Joi.number().integer().min(0),
  age_max: Joi.number().integer().min(0),
  q: Joi.string().allow('')
});

function validateQuery(schema) {
  return async (ctx, next) => {
    const { error } = schema.validate(ctx.query, { abortEarly: false });
    if (error) {
      const err = new Error('Validation failed');
      err.status = 400;
      err.details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message
      }));
      throw err;
    }
    await next();
  };
}

async function authMiddleware(ctx, next) {
  const authHeader = ctx.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ctx.user = decoded;
    await next();
  } catch (e) {
    const err = new Error(e.name === 'TokenExpiredError' ? 'Token expired' : 'Unauthorized');
    err.status = 401;
    throw err;
  }
}

function requireRole(role) {
  return async (ctx, next) => {
    if (!ctx.user || ctx.user.role !== role) {
      const err = new Error(`Forbidden: ${role} role required`);
      err.status = 403;
      throw err;
    }
    await next();
  };
}

const rateMap = new Map();
async function rateLimitMiddleware(ctx, next) {
  const ip = ctx.ip || '127.0.0.1';
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, reset: now + 60000 };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + 60000;
  }
  entry.count += 1;
  rateMap.set(ip, entry);
  if (entry.count > 100) {
    const err = new Error('Too Many Requests');
    err.status = 429;
    throw err;
  }
  await next();
}

module.exports = {
  dbMiddleware,
  groupHeaderMiddleware,
  errorMiddleware,
  loggerMiddleware,
  validateBody,
  validateQuery,
  userBodySchema,
  querySchema,
  authMiddleware,
  requireRole,
  rateLimitMiddleware
};
