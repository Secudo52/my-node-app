const Router = require('@koa/router');
const studentCtrl = require('../controllers/studentController');
const groupCtrl = require('../controllers/groupController');
const systemCtrl = require('../controllers/systemController');

const router = new Router({ prefix: '/api' });

router.get('/students/stats', studentCtrl.stats);
router.post('/students/batch', studentCtrl.batchCreate);
router.get('/students', studentCtrl.list);
router.get('/students/:id', studentCtrl.getOne);
router.post('/students', studentCtrl.create);
router.put('/students/:id', studentCtrl.update);
router.delete('/students/:id', studentCtrl.remove);

router.get('/groups', groupCtrl.listGroups);
router.post('/groups', groupCtrl.createGroup);
router.get('/groups/:id/students', groupCtrl.groupStudents);

router.get('/cache/stats', systemCtrl.cacheStats);
router.get('/metrics', systemCtrl.dbMetrics);
router.get('/logs', systemCtrl.dbLogs);

module.exports = router;
