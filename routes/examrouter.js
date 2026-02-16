const express = require('express');
const router = express.Router();
const controller = require('../controllers/Examcontroller.js');


router.post('/register', controller.registerExam);

// Step 2: Push Questions
router.post('/add-questions', controller.addQuestionsToExam);
// Submit Exam with Proctoring Data
router.post('/submit/create', controller.uploadFiles, controller.submitExam);
router.get('/result/:examId/:studentId', controller.getExamResult);
router.get('/result/:id', controller.ExamResults);
router.get('/get/id/:id', controller.getexam);
router.get('/results/all', async (req, res) => {
  const allResults = await prisma.examResult.findMany({
    include: { student: true, exam: true }
  });
  res.json(allResults);
});

module.exports = router;