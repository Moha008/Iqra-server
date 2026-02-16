const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /progress/complete
exports.completeLesson = async (req, res) => {
  try {
    const { studentId, lessonId } = req.body;

    if (!studentId || !lessonId) {
      return res.status(400).json({ error: "Missing studentId or lessonId" });
    }

    // 1️⃣ Check lesson exists and get courseId
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true } // assuming section relation exists
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const courseId = lesson.section.courseId;

    // 2️⃣ Mark lesson as completed (upsert to avoid duplicates)
    await prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId, lessonId } // make sure @@unique exists
      },
      create: { studentId, lessonId, completed: true },
      update: { completed: true }
    });

    // 3️⃣ Get total lessons in course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: { lessons: true }
        }
      }
    });

    const totalLessons = course.sections.flatMap(s => s.lessons).length;

    // 4️⃣ Count completed lessons for this student in this course
    const completedCount = await prisma.lessonProgress.count({
      where: {
        studentId,
        lessonId: { in: course.sections.flatMap(s => s.lessons.map(l => l.id)) },
        completed: true
      }
    });

    // 5️⃣ Calculate progress percentage
    const progressPercent =
      totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

    // 6️⃣ Update enrollment progress
    await prisma.enrollment.updateMany({
      where: { studentId, courseId },
      data: { progress: progressPercent }
    });

    return res.json({
      message: "Lesson completed",
      progress: progressPercent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET /progress/:studentId/:courseId
// Optional: return all lesson progress for a student in a course
exports.getProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Get all lessons in course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: { include: { lessons: true } }
      }
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    const lessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));

    const progress = await prisma.lessonProgress.findMany({
      where: { studentId, lessonId: { in: lessonIds } },
      include: { lesson: true }
    });

    res.json({ progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
