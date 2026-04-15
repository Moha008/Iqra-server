const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Cloudinary Config
cloudinary.config({
  cloud_name: "dzf4uydtr",
  api_key: "778241141493963",
  api_secret: "ZySdUAZuE_jurObhDDp_xz9a5bg"
});

const storage = multer.memoryStorage();
exports.uploadFiles = multer({ storage }).fields([
  { name: "video", maxCount: 1 },
]);

// --- EXAM CORE CRUD ---

exports.registerExam = async (req, res) => {
  try {
    const { title, courseId, passMark } = req.body;
    const newExam = await prisma.exam.create({
      data: {
        title,
        courseId,
        passMark: parseInt(passMark) || 80
      }
    });
    res.status(201).json(newExam);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, passMark } = req.body;
    const updated = await prisma.exam.update({
      where: { id },
      data: {
        title,
        passMark: parseInt(passMark)
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Failed to update exam registry" });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    // Transactional delete to ensure data integrity
    await prisma.$transaction([
      prisma.examQuestion.deleteMany({ where: { examId: id } }),
      prisma.examResult.deleteMany({ where: { examId: id } }),
      prisma.exam.delete({ where: { id } })
    ]);
    res.json({ message: "Exam and all associated data purged successfully" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete exam" });
  }
};

// --- QUESTION ARCHITECTURE CRUD ---

exports.addQuestionsToExam = async (req, res) => {
  try {
    const { examId, questions } = req.body; 
    const createdQuestions = await prisma.examQuestion.createMany({
      data: questions.map(q => ({
        examId: examId,
        type: q.type,
        text: q.text,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: parseInt(q.points) || 5
      }))
    });
    res.status(201).json({ message: "Injection successful", count: createdQuestions.count });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, type, options, correctAnswer, points } = req.body;
    const updated = await prisma.examQuestion.update({
      where: { id },
      data: {
        text,
        type,
        options,
        correctAnswer,
        points: parseInt(points)
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Failed to update question content" });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.examQuestion.delete({ where: { id } });
    res.json({ message: "Question removed from registry" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete question" });
  }
};

// --- PROCTORED SUBMISSION & ANALYSIS ---

exports.submitExam = async (req, res) => {
  try {
    const { examId, studentId, answers, violations } = req.body;

    let videoUrl = "";
    if (req.files && req.files['video'] && req.files['video'][0]) {
      const result = await new Promise((resolve, reject) => {
        const s = cloudinary.uploader.upload_stream(
          { resource_type: "video", folder: "iqra/videos" },
          (err, r) => err ? reject(err) : resolve(r)
        );
        s.end(req.files['video'][0].buffer);
      });
      videoUrl = result.secure_url;
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true }
    });

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
    let earnedPoints = 0;
    let totalPossiblePoints = 0;

    exam.questions.forEach((question) => {
      totalPossiblePoints += question.points;
      const studentAnswer = parsedAnswers[question.id];
      if (studentAnswer && 
          studentAnswer.toString().trim().toLowerCase() === 
          question.correctAnswer.toString().trim().toLowerCase()) {
        earnedPoints += question.points;
      }
    });

    const finalPercentage = totalPossiblePoints > 0 ? (earnedPoints / totalPossiblePoints) * 100 : 0;
    const isPassed = finalPercentage >= exam.passMark;

    const savedResult = await prisma.examResult.create({
      data: {
        examId,
        studentId,
        score: finalPercentage,
        video: videoUrl || null,
        passed: isPassed,
        violations: parseInt(violations) || 0,
      }
    });

    res.status(200).json({
      message: isPassed ? "Pass criteria met." : "Pass criteria not met.",
      score: finalPercentage,
      passed: isPassed,
      resultId: savedResult.id
    });
  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ error: "Internal server error during analysis" });
  }
};

// --- DATA RETRIEVAL ---

exports.getexam = async (req, res) => {
  try {
    const { id } = req.params;
    const fnd = await prisma.exam.findFirst({
      where: { id },
      include: {
        questions: true,
        ExamResult: true
      }
    });
    res.json(fnd);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getExamResult = async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const result = await prisma.examResult.findFirst({
      where: { examId, studentId },
      orderBy: { createdAt: 'desc' }
    });
    if (!result) return res.status(404).json({ error: "No recorded results found" });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.ExamResults = async (req, res) => {
  try {
    const { id } = req.params;
    const fn = await prisma.course.findFirst({
      where: { id },
      include: {
        Exam: {
          include: {
            ExamResult: {
              include: { student: true }
            }
          }
        }
      }
    });
    res.json(fn);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};