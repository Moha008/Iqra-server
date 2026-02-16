const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: "dzf4uydtr",
  api_key: "778241141493963",
  api_secret: "ZySdUAZuE_jurObhDDp_xz9a5bg"
});

// Multer memory storage (no local disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });


// lessonController.js
exports.uploadFiles = upload.fields([
  { name: "videoUrl", maxCount: 1 }, // Must be "videoUrl"
  { name: "attachments", maxCount: 10 }
]);

exports.getLessons = async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({ include: { section: true } });
    res.json(lessons);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await prisma.lesson.findUnique({ where: { id }, include: { section: true } });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createlesson = async (req, res) => {
  try {
    const { title, description, content, sectionId, order } = req.body;
    let videoUrl = "";
    let attachmentData = [];

    if (req.files?.['videoUrl']?.[0]) {
      const result = await new Promise((res, rej) => {
        const s = cloudinary.uploader.upload_stream({ resource_type: "video", folder: "iqra/videos" }, (err, r) => err ? rej(err) : res(r));
        s.end(req.files['videoUrl'][0].buffer);
      });
      videoUrl = result.secure_url;
    }

    if (req.files?.['attachments']) {
      const promises = req.files['attachments'].map(file => new Promise((res, rej) => {
        const s = cloudinary.uploader.upload_stream({ resource_type: "raw", folder: "iqra/docs" }, (err, r) => err ? rej(err) : res({ name: file.originalname, url: r.secure_url }));
        s.end(file.buffer);
      }));
      attachmentData = await Promise.all(promises);
    }

    const lesson = await prisma.lesson.create({
      data: { title, description, content, sectionId, videoUrl, order: parseInt(order || 0),
        attachments: { create: attachmentData }
      }
    });
    res.status(201).json(lesson);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

// UPDATE (Text fields)
// ===================== UPDATE LESSON (WITH FILES) =====================
exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, order } = req.body;
    
    let updateData = {
      title,
      description,
      content,
      order: order ? parseInt(order) : undefined,
    };

    // 1. Handle Video Update (If a new file is provided)
    if (req.files?.['videoUrl']?.[0]) {
      const videoBuffer = req.files['videoUrl'][0].buffer;
      const videoResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "video", folder: "iqra/videos" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(videoBuffer);
      });
      updateData.videoUrl = videoResult;
    }

    // 2. Handle New Attachments (If new files are provided)
    let newAttachments = [];
    if (req.files?.['attachments']) {
      const uploadPromises = req.files['attachments'].map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "iqra/docs" },
            (error, result) => {
              if (error) return reject(error);
              resolve({
                name: file.originalname,
                url: result.secure_url,
              });
            }
          );
          stream.end(file.buffer);
        });
      });
      newAttachments = await Promise.all(uploadPromises);
    }

    // 3. Execute Update in Prisma
    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...updateData,
        attachments: {
          create: newAttachments // This adds new ones without deleting old ones
        }
      },
      include: { attachments: true }
    });

    res.json(updatedLesson);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// DELETE
exports.deleteLesson = async (req, res) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.json({ message: "Lesson deleted" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};
exports.completeLesson = async (req, res) => {
  try {
    const { studentId, courseId, lessonId } = req.body;

    if (!studentId || !courseId || !lessonId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 1. Save lesson completion if not already saved
    await prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      create: { studentId, lessonId, completed: true },
      update: { completed: true }
    });

    // 2. Fetch total lessons in this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: { lessons: true }
        }
      }
    });

    const totalLessons = course.sections.flatMap(s => s.lessons).length;

    // 3. Count completed lessons for this student
    const completedCount = await prisma.lessonProgress.count({
      where: { studentId, completed: true }
    });

    // 4. Calculate progress percentage
    const progressPercent =
      totalLessons === 0
        ? 0
        : Math.min(100, Math.round((completedCount / totalLessons) * 100));

    // 5. Update enrollment progress
    const updatedEnrollment = await prisma.enrollment.updateMany({
      where: { studentId, courseId },
      data: { progress: progressPercent }
    });

    return res.json({
      message: "Lesson completed",
      progress: progressPercent
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
