const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createQuiz = async (req, res) => {
  try {
    const { title, courseId } = req.body;
    const quiz = await prisma.quiz.create({ data: { title, courseId } });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({ include: { course: true, questions: true } });
    res.json(quizzes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { course: true, questions: true } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.update({ where: { id }, data: req.body });
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quiz.delete({ where: { id } });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
