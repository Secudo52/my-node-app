const Router = require('@koa/router');
const UserController = require('../controllers/userController');
const AuthController = require('../controllers/authController');
const {
  validateBody,
  validateQuery,
  userBodySchema,
  querySchema,
  authMiddleware,
  requireRole
} = require('../middleware');

const router = new Router({ prefix: '/api' });

router.post('/auth/register', validateBody(userBodySchema), AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refresh);
router.post('/auth/logout', AuthController.logout);

router.get('/users/stats', UserController.stats);
router.get('/users/export', UserController.exportCsv);
router.get('/users/search', UserController.search);
router.get('/users', validateQuery(querySchema), UserController.list);
router.get('/users/:id', UserController.getOne);

router.post('/users', validateBody(userBodySchema), UserController.create);
router.put('/users/:id', authMiddleware, UserController.update);
router.delete('/users/:id', authMiddleware, UserController.remove);

router.get('/admin/users', authMiddleware, requireRole('admin'), UserController.listAdminUsers);

module.exports = router;
