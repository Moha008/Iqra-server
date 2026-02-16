const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: "dzf4uydtr",
  api_key: "778241141493963",
  api_secret: "ZySdUAZuE_jurObhDDp_xz9a5bg"
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper for Cloudinary Uploads
const uploadToCloudinary = (buffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// ===================== CREATE COURSE =====================
exports.createCourse = async (req, res) => {
  try {
    const { 
      title, description, price, status, categoryId, id,
      type, startDate, endDate,instructorId, dailyStart, dailyEnd, daysOfWeek 
    } = req.body;

    let imagePreviewUrl = "";
    let videoIntroUrl = "";

    if (req.files['imagePreview']) {
      imagePreviewUrl = await uploadToCloudinary(req.files['imagePreview'][0].buffer, "courses/images");
    }

    if (req.files['videoIntro']) {
      videoIntroUrl = await uploadToCloudinary(req.files['videoIntro'][0].buffer, "courses/videos", "video");
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        status,
        categoryId,
        instructorId,
        ImagePreview: imagePreviewUrl,
        VideoIntro: videoIntroUrl,
        // New Live Fields
        type: type || "NON_LIVE",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dailyStart,
        dailyEnd,
        daysOfWeek: daysOfWeek ? (Array.isArray(daysOfWeek) ? daysOfWeek : JSON.parse(daysOfWeek)) : [],
      }
    });

    // Auto-generate sessions if Live
    if (course.type === "LIVE" && course.startDate && course.endDate) {
      await generateLiveSessions(course);
    }

    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// ===================== ATTENDANCE HEARTBEAT =====================
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    const attendance = await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      update: { minutesWatched: { increment: 1 } },
      create: { sessionId, studentId, minutesWatched: 1 }
    });

    // Mark as present if they cross a threshold (e.g., 5 mins)
    if (attendance.minutesWatched >= 5 && !attendance.isPresent) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { isPresent: true }
      });
    }

    res.json({ success: true, minutes: attendance.minutesWatched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===================== GET COURSE (Updated) =====================
exports.getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ 
      where: { id }, 
      include: { 
        category: true, 
        instructor: true, 
        sessions: { orderBy: { startTime: 'asc' } },
        sections: { include: { lessons: { include: { LessonProgress: true, attachments: true } } } },
        Exam: { include: { ExamResult: true, questions: true } },
        quizzes: { include: { questions: true, QuizResult: true } },
        enrollments:{
          include:{
            student:true
          }
        }
      } 
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Helper: Session Generator
async function generateLiveSessions(course) {
  const sessions = [];
  let current = new Date(course.startDate);
  const end = new Date(course.endDate);

  while (current <= end) {
    const dayName = current.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
    if (course.daysOfWeek.includes(dayName)) {
      const start = new Date(current);
      const [sh, sm] = course.dailyStart.split(':');
      start.setHours(parseInt(sh), parseInt(sm));

      const stop = new Date(current);
      const [eh, em] = course.dailyEnd.split(':');
      stop.setHours(parseInt(eh), parseInt(em));

      sessions.push({
        courseId: course.id,
        date: new Date(current),
        startTime: start,
        endTime: stop
      });
    }
    current.setDate(current.getDate() + 1);
  }
  await prisma.session.createMany({ data: sessions });
}

exports.uploadFiles = upload.fields([
  { name: "imagePreview", maxCount: 1 },
  { name: "videoIntro", maxCount: 1 }
]);

exports.getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({ include: { category: true, instructor: true,enrollments:true, } });
    res.json(courses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getallCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany();
    res.json(courses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCoursesTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const fn = await prisma.user.findFirst({
      where: { id },
      include: {
        courses: { include: { category: true,enrollments:{include:{student:true}}, sessions: true, sections: { include: { lessons: true } } } }
      }
    });
    return res.json(fn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Course not found" });

    const { title, description, price, status, categoryId, type, daysOfWeek } = req.body;

    let ImagePreview = existing.ImagePreview;
    let VideoIntro = existing.VideoIntro;

    if (req.files['imagePreview']) {
      ImagePreview = await uploadToCloudinary(req.files['imagePreview'][0].buffer, "courses/images");
    }

    if (req.files['videoIntro']) {
      VideoIntro = await uploadToCloudinary(req.files['videoIntro'][0].buffer, "courses/videos", "video");
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description || existing.description,
        price: price ? parseFloat(price) : existing.price,
        status: status || existing.status,
        categoryId: categoryId || existing.categoryId,
        type: type || existing.type,
        daysOfWeek: daysOfWeek ? (Array.isArray(daysOfWeek) ? daysOfWeek : JSON.parse(daysOfWeek)) : existing.daysOfWeek,
        ImagePreview,
        VideoIntro,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.editCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.update({ where: { id }, data: req.body });
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    const attendance = await prisma.attendance.create({
      data:{
        isPresent:true,
        studentId,
        sessionId
      }
    });



    res.json("successfully created");
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};
exports.getCourseAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: {
        id: id, // remove Number() if id is a string/UUID
      },
      include: {
        enrollments: {
          include: {
            student: true,
          },
        },
        sessions: {
          include: {
            attendance: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');

// cloudinary.config({
//   cloud_name: "dibtvin9t",
//   api_key: "317431124573912",
//   api_secret: "mB-VSvzmi1R0rT1g_hs5dTJGW9I"
// });

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Helper for Cloudinary Uploads
// const uploadToCloudinary = (buffer, folder, resourceType = "auto") => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { folder, resource_type: resourceType },
//       (err, result) => {
//         if (err) return reject(err);
//         resolve(result.secure_url);
//       }
//     );
//     stream.end(buffer);
//   });
// };

// // ===================== CREATE COURSE =====================
// exports.createCourse = async (req, res) => {
//   try {
//     const { 
//       title, description, price, status, categoryId, id,
//       type, startDate, endDate, dailyStart, dailyEnd, daysOfWeek 
//     } = req.body;

//     let imagePreviewUrl = "";
//     let videoIntroUrl = "";

//     if (req.files['imagePreview']) {
//       imagePreviewUrl = await uploadToCloudinary(req.files['imagePreview'][0].buffer, "courses/images");
//     }

//     if (req.files['videoIntro']) {
//       videoIntroUrl = await uploadToCloudinary(req.files['videoIntro'][0].buffer, "courses/videos", "video");
//     }

//     const course = await prisma.course.create({
//       data: {
//         title,
//         description,
//         price: parseFloat(price),
//         status,
//         categoryId,
//         instructorId: id,
//         ImagePreview: imagePreviewUrl,
//         VideoIntro: videoIntroUrl,
//         // New Live Fields
//         type: type || "NON_LIVE",
//         startDate: startDate ? new Date(startDate) : null,
//         endDate: endDate ? new Date(endDate) : null,
//         dailyStart,
//         dailyEnd,
//         daysOfWeek: daysOfWeek ? (Array.isArray(daysOfWeek) ? daysOfWeek : JSON.parse(daysOfWeek)) : [],
//       }
//     });

//     // Auto-generate sessions if Live
//     if (course.type === "LIVE" && course.startDate && course.endDate) {
//       await generateLiveSessions(course);
//     }

//     res.status(201).json(course);
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ error: error.message });
//   }
// };

// // ===================== ATTENDANCE HEARTBEAT =====================


// // ===================== GET COURSE (Updated) =====================
// exports.getCourse = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const course = await prisma.course.findUnique({ 
//       where: { id }, 
//       include: { 
//         category: true, 
//         instructor: true, 
//         sessions: { orderBy: { startTime: 'asc' } },
//         sections: { include: { lessons: { include: { LessonProgress: true, attachments: true } } } },
//         Exam: { include: { ExamResult: true, questions: true } },
//         quizzes: { include: { questions: true, QuizResult: true } },
//         enrollments:{
//           include:{
//             student:true
//           }
//         }
//       } 
//     });
//     if (!course) return res.status(404).json({ error: 'Course not found' });
//     res.json(course);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Helper: Session Generator
// async function generateLiveSessions(course) {
//   const sessions = [];
//   let current = new Date(course.startDate);
//   const end = new Date(course.endDate);

//   while (current <= end) {
//     const dayName = current.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
//     if (course.daysOfWeek.includes(dayName)) {
//       const start = new Date(current);
//       const [sh, sm] = course.dailyStart.split(':');
//       start.setHours(parseInt(sh), parseInt(sm));

//       const stop = new Date(current);
//       const [eh, em] = course.dailyEnd.split(':');
//       stop.setHours(parseInt(eh), parseInt(em));

//       sessions.push({
//         courseId: course.id,
//         date: new Date(current),
//         startTime: start,
//         endTime: stop
//       });
//     }
//     current.setDate(current.getDate() + 1);
//   }
//   await prisma.session.createMany({ data: sessions });
// }

// exports.uploadFiles = upload.fields([
//   { name: "imagePreview", maxCount: 1 },
//   { name: "videoIntro", maxCount: 1 }
// ]);

// exports.getCourses = async (req, res) => {
//   try {
//     const courses = await prisma.course.findMany({ include: { category: true, instructor: true } });
//     res.json(courses);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// exports.getCoursesTeacher = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const fn = await prisma.user.findFirst({
//       where: { id },
//       include: {
//         courses: { include: { category: true,enrollments:{include:{student:true}}, sessions: true, sections: { include: { lessons: true } } } }
//       }
//     });
//     return res.json(fn);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// exports.linkactivationdeactive = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const existing = await prisma.course.findUnique({ where: { id } });
//     if (!existing) return res.status(404).json({ error: "Course not found" });

//     const {Link, isActivelink} = req.body;

//     const updated = await prisma.course.update({
//       where: { id },
//       data: {
//         isActivelink:!isActivelink,
//         Link
//       },
//     });

//     res.json(updated);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };
// exports.updateCourse = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const existing = await prisma.course.findUnique({ where: { id } });
//     if (!existing) return res.status(404).json({ error: "Course not found" });

//     const { title, description,Link, price, status, categoryId, type, daysOfWeek } = req.body;

//     let ImagePreview = existing.ImagePreview;
//     let VideoIntro = existing.VideoIntro;

//     if (req.files['imagePreview']) {
//       ImagePreview = await uploadToCloudinary(req.files['imagePreview'][0].buffer, "courses/images");
//     }

//     if (req.files['videoIntro']) {
//       VideoIntro = await uploadToCloudinary(req.files['videoIntro'][0].buffer, "courses/videos", "video");
//     }

//     const updated = await prisma.course.update({
//       where: { id },
//       data: {
//         title: title || existing.title,
//         description: description || existing.description,
//         price: price ? parseFloat(price) : existing.price,
//         status: status || existing.status,
//         categoryId: categoryId || existing.categoryId,
//         type: type || existing.type,
//         daysOfWeek: daysOfWeek ? (Array.isArray(daysOfWeek) ? daysOfWeek : JSON.parse(daysOfWeek)) : existing.daysOfWeek,
//         ImagePreview,
//         VideoIntro,
//         Link
//       },
//     });

//     res.json(updated);
//   } catch (error) {
//     // res.status(400).json({ error: error.message });
//     console.log(error)
//   }
// };

// exports.editCourse = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {title}=req.body;
//     const course = await prisma.course.update({ where: { id }, data: {
//       title
//     } });
//     res.json(course);
//   } catch (error) {
//   console.log(error)
//   }
// };

// exports.deleteCourse = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await prisma.course.delete({ where: { id } });
//     res.json({ message: 'Course deleted successfully' });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };