const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createCategory = async (req, res) => {
  try {
    const { name,description } = req.body;
    const category = await prisma.category.create({ data: { name,description } });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getDashboardData = async (req, res) => {
  try {
    // Total users
    const totalUsers = await prisma.user.count();

    // Total instructors
    const totalInstructors = await prisma.user.count({
      where: { role: "INSTRUCTOR" },
    });

    // Total courses
    const totalCourses = await prisma.course.count();

    // Total enrollments
    const totalEnrollments = await prisma.enrollment.count();

    // Total revenue = sum of course prices where enrollment is paid
    const paidEnrollments = await prisma.enrollment.findMany({
      where: { ispay: true },
      include: { course: true },
    });

    const totalRevenue = paidEnrollments.reduce(
      (sum, enrollment) => sum + (enrollment.course.price || 0),
      0
    );

    // Recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: true, course: true },
    });

    // Course statistics: enrollments per course
    const coursesStats = await prisma.course.findMany({
      select: {
        title: true,
        enrollments: true,
      },
    });

    // Payment status breakdown
    const paymentStats = await prisma.payment.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    res.json({
      totalUsers,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      recentEnrollments,
      coursesStats,
      paymentStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ include: { courses: true } });
    res.json(categories);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ include: { courses: true } });
    res.json(categories);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { id }, include: { courses: true } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.update({ where: { id }, data: req.body });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
