const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// POST /enrollments
exports.createEnrollment = async (req, res) => {
  try {
    const { studentId,phone, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: "Missing studentId or courseId" });
    }

    // Check if enrolled already
    const existing = await prisma.enrollment.findFirst({
      where: { studentId, courseId }
    });

    if (existing) {
      return res.status(200).json({ enrolled: true, message: "Already enrolled" });
    }

    // Create new enrollment
    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId,phone, }
    });

    return res.status(201).json({ enrolled: true, enrollment });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
// GET /enrollments/check/:studentId/:courseId
exports.checkEnrollment = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const existing = await prisma.enrollment.findFirst({
      where: { studentId, courseId },
      // Selecting specific fields is cleaner, but including everything works too
    });

    if (!existing) {
      return res.json({ enrolled: false, ispay: false });
    }

    res.json({ 
      enrolled: true, 
      ispay: existing.ispay // Include the payment status here
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getEnrollments = async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({ include: { student: true, course: true, payment: true } });
    res.json(enrollments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await prisma.enrollment.findUnique({ where: { id }, include: { student: true, course: true, payment: true } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    res.json(enrollment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await prisma.enrollment.update({ where: { id }, data: req.body });
    res.json(enrollment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.enrollment.delete({ where: { id } });
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
