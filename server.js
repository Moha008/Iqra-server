const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { StreamClient } = require('@stream-io/node-sdk');
const prisma = new PrismaClient();
const app = express();
const STREAM_API_KEY = 'v6tkkgrksz3p';
const STREAM_API_SECRET = 'ww2y2t26emcwcg6bewhxyhw8t97wqh8fytqnta7h5nftkt92ther43pmu752a2w4';
const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
app.use(express.json());
app.use(cors({
  origin: "*", // Restrict in production
  credentials: true
}));

/* ================= DEFAULT ADMIN SEED ================= */
async function createDefaultAdmin() {
  try {
    const adminusername = "admin@example.com";

    const adminExists = await prisma.user.findUnique({
      where: { username: adminusername }
    });

    if (adminExists) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: {
        username: adminusername,
        password: hashedPassword,
        role: "ADMIN",
        fullName: "System Administrator",
        bio: "Default admin account"
      }
    });

    console.log("🚀 Default admin created");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
}
/* ====================================================== */
// --- NEW STREAM TOKEN ROUTE ---
app.get('/stream/token', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // Generate token for the student/teacher
    // The token tells Stream: "This user is allowed to join the video"
    const token = streamClient.generateUserToken({ user_id: userId });

    res.json({ token, apiKey: STREAM_API_KEY });
  } catch (error) {
    console.error("Stream Token Error:", error);
    res.status(500).json({ error: "Failed to generate video token" });
  }
});
// Routes
const lessonProgressRoutes = require("./routes/lessonProgressRoutes.js");
app.use("/progress", lessonProgressRoutes);

app.use('/exams', require('./routes/examrouter.js'));
app.use('/users', require('./routes/userRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));
app.use('/courses', require('./routes/courseRoutes'));
app.use('/sections', require('./routes/sectionRoutes'));
app.use('/lessons', require('./routes/lessonRoutes'));
app.use('/enrollments', require('./routes/enrollmentRoutes'));
app.use('/payments', require('./routes/paymentRoutes'));
app.use('/quizzes', require('./routes/quizRoutes'));
app.use('/questions', require('./routes/questionRoutes'));
app.use('/reviews', require('./routes/reviewRoutes'));
app.use('/certificates', require('./routes/certificateRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
// routes/quiz.js or similar
app.post("/quizzes/submit", async (req, res) => {
  const { studentId, quizId, answers } = req.body; // answers: { questionId: "option" }

  try {
    // 1. Fetch the quiz with its correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // 2. Calculate the score
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.answer) {
        correctCount++;
      }
    });

    const finalScore = (correctCount / quiz.questions.length) * 100;

    // 3. Save to QuizResult model using Prisma
    const result = await prisma.quizResult.upsert({
      where: {
        studentId_quizId: { studentId, quizId },
      },
      update: { score: finalScore },
      create: {
        studentId,
        quizId,
        score: finalScore,
      },
    });

    res.json({ result, correctCount, total: quiz.questions.length });
  } catch (err) {
    console.log(err)
    // res.status(500).json({ error: "Failed to save quiz result" });
  }
});
/* ================= START SERVER ================= */
app.listen(5000, async () => {
  console.log('Server running on port 5000');
  await createDefaultAdmin();
});
