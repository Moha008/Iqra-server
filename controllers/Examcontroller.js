const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Cloudinary Config (Keep this secure in .env later!)
cloudinary.config({
  cloud_name: "dzf4uydtr",
  api_key: "778241141493963",
  api_secret: "ZySdUAZuE_jurObhDDp_xz9a5bg"
});

const storage = multer.memoryStorage();
exports.uploadFiles = multer({ storage }).fields([
  { name: "video", maxCount: 1 }, // Changed from videoUrl to video to match frontend
]);

exports.submitExam = async (req, res) => {
  try {
    // IMPORTANT: If using FormData, req.body is only populated AFTER multer runs
    const { examId, studentId, answers, violations } = req.body;

    if (!examId) {
      return res.status(400).json({ error: "Missing examId. Ensure multipart/form-data is set correctly." });
    }

    // 1. Handle Video Upload
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

    // 2. Fetch the exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true }
    });

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // 3. Parse answers (FormData sends objects as JSON strings)
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;

    let earnedPoints = 0;
    let totalPossiblePoints = 0;

    // 4. Calculate Score
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

    // 5. Save Result
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
      message: isPassed ? "Congratulations! You passed." : "You did not reach the passing mark.",
      score: finalPercentage,
      passed: isPassed,
      resultId: savedResult.id
    });

  } catch (error) {
    console.error("DETAILED ERROR:", error);
    res.status(500).json({ error: "Internal server error during submission" });
  }
};
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
    console.log(error)
    res.status(400).json({ error: error.message });
  }
};

exports.addQuestionsToExam = async (req, res) => {
  try {
    const { examId, questions } = req.body; // questions is an array

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

    res.status(201).json({ message: "Questions added successfully", count: createdQuestions.count });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getExamResult = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const result = await prisma.examResult.findFirst({
      where: {
        examId: examId,
        studentId: studentId
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent attempt
      }
    });

    if (!result) return res.status(404).json({ error: "Result not found" });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getexam=async(req,res)=>{
  try {
    const {id}=req.params;
    const fnd=await prisma.exam.findFirst({
      where:{
        id
      },
      include:{
        questions:true,
        ExamResult:true
      }
    })
    res.json(fnd)
  } catch (error) {
    
  }
}
exports.ExamResults=async(req,res)=>{
  try {
    const {id}=req.params;
    const fn=await prisma.course.findFirst({
      where:{
        id:id
      },
      include:{
        Exam:{
          include:{
            ExamResult:{
              include:{
                student:true
              }
            }
          }
        }
      }
    })
    res.json(fn)
  } catch (error) {
    
  }
}