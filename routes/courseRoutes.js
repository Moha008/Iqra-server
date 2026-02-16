const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const {  isAdmin, isAuthenticated } = require('../middleware/auth');

// Course Management
router.post(
  '/', 
  
  courseController.uploadFiles, 
  courseController.createCourse
);

// Attendance Heartbeat (Students ping this while in live class)
router.post('/attendance/heartbeat',isAuthenticated,  courseController.markAttendance);

router.get('/teacher/:id',isAuthenticated,  courseController.getCoursesTeacher);
router.get('/attendence/:id',isAuthenticated,  courseController.getCourseAttendance);
router.get('/', courseController.getallCourses);
router.get('/all',isAuthenticated, courseController.getCourses);
router.get('/:id', courseController.getCourse);

router.put('/:id', isAuthenticated, courseController.uploadFiles, courseController.updateCourse);
router.put('/edit/:id',isAuthenticated,  courseController.editCourse);

router.delete('/:id',isAuthenticated, courseController.deleteCourse);

module.exports = router;