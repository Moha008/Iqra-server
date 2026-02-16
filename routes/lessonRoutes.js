const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

router.post(
  '/',
  lessonController.uploadFiles, // multer memory storage
  lessonController.createlesson
);

// router.post('/', lessonController.createLesson);
router.get('/', lessonController.getLessons);
router.get('/:id', lessonController.getLesson);
router.put('/:id', lessonController.uploadFiles, lessonController.updateLesson);
router.delete('/:id', lessonController.deleteLesson);

module.exports = router;
