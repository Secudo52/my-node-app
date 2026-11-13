const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const JWT_REFRESH = process.env.JWT_REFRESH_SECRET || 'refresh_key';

function log(action, detail) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${ts}] [SERVICE] ${action}: ${detail}`);
}

class UserService {
  static async register(data) {
    log('Sozdanie polzovatelya', data.email);
    const existing = await User.findByEmail(data.email);
    if (existing) {
      log('Email uzhe sushchestvuet', data.email);
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const doc = {
      ...data,
      password: hashedPassword,
      role: data.role || 'user'
    };
    const created = await User.create(doc);
    log('Email otpravlen', data.email);

    const accessToken = jwt.sign({ userId: created._id, email: created.email, role: created.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: created._id, email: created.email, role: created.role }, JWT_REFRESH, { expiresIn: '7d' });

    const safeUser = { ...created };
    delete safeUser.password;
    return { user: safeUser, accessToken, refreshToken };
  }

  static async login(email, password) {
    log('Proverka unikalnosti email', email);
    const user = await User.findByEmail(email);
    if (!user || !user.password) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }
    const accessToken = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_REFRESH, { expiresIn: '7d' });
    return { accessToken, refreshToken, expiresIn: 900 };
  }

  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH);
      const accessToken = jwt.sign({ userId: decoded.userId, email: decoded.email, role: decoded.role }, JWT_SECRET, { expiresIn: '15m' });
      return { accessToken };
    } catch (e) {
      const err = new Error('Invalid refresh token');
      err.status = 401;
      throw err;
    }
  }

  static async list(query) {
    return User.findAll(query);
  }

  static async getById(id) {
    const u = await User.findById(id);
    if (!u) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return u;
  }

  static async create(data) {
    log('Proverka unikalnosti email', data.email);
    const existing = await User.findByEmail(data.email);
    if (existing) {
      log('Email uzhe sushchestvuet', data.email);
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }
    log('Sozdanie polzovatelya', data.email);
    const created = await User.create(data);
    log('Email otpravlen', data.email);
    return created;
  }

  static async update(id, data) {
    const existing = await User.findById(id);
    if (!existing) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return User.update(id, data);
  }

  static async delete(id) {
    const ok = await User.delete(id);
    if (!ok) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
  }

  static async search(q) {
    return User.search(q);
  }

  static async stats() {
    return User.getStats();
  }

  static async exportCsv() {
    const res = await User.findAll({ limit: 1000 });
    const lines = ['id,name,email,group_name,age,course'];
    res.data.forEach((u) => lines.push(`${u._id},${u.name},${u.email},${u.group_name},${u.age},${u.course}`));
    return lines.join('\n');
  }
}

module.exports = UserService;
