const express = require("express");
const router = express.Router();
const lessonProgressController = require("../controllers/lessonProgressController.js");

// 1️⃣ Mark lesson as completed
// POST /api/progress/complete
router.post("/complete", lessonProgressController.completeLesson);

// 2️⃣ Get lesson progress for a student in a course
// GET /api/progress/:studentId/:courseId
router.get("/:studentId/:courseId", lessonProgressController.getProgress);

module.exports = router;
