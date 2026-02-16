const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/', enrollmentController.createEnrollment);
router.get('/',isAuthenticated,enrollmentController.getEnrollments);
router.get('/check/:studentId/:id', enrollmentController.checkEnrollment);
router.get('/:id', enrollmentController.getEnrollment);
router.put('/:id',isAuthenticated, enrollmentController.updateEnrollment);
router.delete('/:id',isAuthenticated, enrollmentController.deleteEnrollment);

module.exports = router;
