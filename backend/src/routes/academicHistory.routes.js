// FILE: backend/src/routes/academicHistory.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/academicHistory.controller');
const validators = require('../validators/academicHistory.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', authorize('academic-history.view'), controller.findAll);
router.get('/student/:studentId', authorize('academic-history.view'), controller.getByStudent);
router.get('/:id', authorize('academic-history.view'), controller.findById);
router.post('/', authorize('academic-history.create'), validators.create, validate, controller.create);
router.put('/:id', authorize('academic-history.edit'), validators.update, validate, controller.update);
router.delete('/:id', authorize('academic-history.delete'), validators.softDelete, validate, controller.softDelete);

module.exports = router;