const express = require('express');
const router = express.Router();
const controller = require('../controllers/Examcontroller.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- EXAM REGISTRY ---
// Register a new exam
router.post('/register', controller.registerExam);

// Update exam settings (Title, Pass Mark)
router.put('/:id', controller.updateExam);

// Delete an entire exam (and questions/results)
router.delete('/:id', controller.deleteExam);


// --- QUESTION ARCHITECTURE ---
// Bulk add questions
router.post('/add-questions', controller.addQuestionsToExam);

// Update a specific question
router.put('/questions/:id', controller.updateQuestion);

// Delete a specific question
router.delete('/questions/:id', controller.deleteQuestion);


// --- SUBMISSION & PROCTORING ---
// Submit Exam with Video/Violation Data
router.post('/submit/create', controller.uploadFiles, controller.submitExam);


// --- DATA RETRIEVAL ---
// Get a specific exam with its questions
router.get('/get/id/:id', controller.getexam);

// Get results for a specific student for a specific exam
router.get('/result/:examId/:studentId', controller.getExamResult);

// Get all exams and their results for a specific Course ID
router.get('/result/:id', controller.ExamResults);

// Get all results across the entire system (Global Admin)
router.get('/results/all', async (req, res) => {
  try {
    const allResults = await prisma.examResult.findMany({
      include: { 
        student: true, 
        exam: {
          include: { course: true }
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(allResults);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch global results" });
  }
});

module.exports = router;