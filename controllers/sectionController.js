const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createSection = async (req, res) => {
  try {
    const { title, order, courseId } = req.body;
    const section = await prisma.section.create({ data: { title, order, courseId } });
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSections = async (req, res) => {
  try {
    const sections = await prisma.section.findMany({ include: { lessons: true, course: true } });
    res.json(sections);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await prisma.course.findUnique({ where: { id }, include: { sections: {
      include:{
        lessons:{
          include:{
            attachments:true
          }
        }
      }
    }} });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await prisma.section.update({ where: { id }, data: req.body });
    res.json(section);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.section.delete({ where: { id } });
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
