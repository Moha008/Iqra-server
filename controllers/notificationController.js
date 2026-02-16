const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createNotification = async (req, res) => {
  try {
    const { userId, message, read } = req.body;
    const notification = await prisma.notification.create({ data: { userId, message, read } });
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({ include: { user: true } });
    res.json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id }, include: { user: true } });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({ where: { id }, data: req.body });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({ where: { id } });
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
