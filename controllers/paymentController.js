const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createPayment = async (req, res) => {
  try {
    const { enrollmentId, amount, status, paidAt, userId, courseId } = req.body;
    const payment = await prisma.payment.create({
      data: { enrollmentId, amount, status, paidAt, userId, courseId }
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({ include: { enrollment: true, User: true, Course: true } });
    res.json(payments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id }, include: { enrollment: true, User: true, Course: true } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.update({ where: { id }, data: req.body });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.payment.delete({ where: { id } });
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
