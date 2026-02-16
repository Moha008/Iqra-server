const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createQuestion = async (req, res) => {
  try {
    const { question, options, answer, quizId } = req.body;
    const q = await prisma.question.create({ data: { question, options, answer, quizId } });
    res.status(201).json(q);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const questions = await prisma.question.findMany({ include: { quiz: true } });
    res.json(questions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await prisma.question.findUnique({ where: { id }, include: { quiz: true } });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await prisma.question.update({ where: { id }, data: req.body });
    res.json(q);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
