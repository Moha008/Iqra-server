const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createReview = async (req, res) => {
  try {
    const { rating, comment, studentId, courseId } = req.body;
    const review = await prisma.review.create({ data: { rating, comment, studentId, courseId } });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({ include: { student: true, course: true } });
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id }, include: { student: true, course: true } });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.update({ where: { id }, data: req.body });
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
