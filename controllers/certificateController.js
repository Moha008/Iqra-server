const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createCertificate = async (req, res) => {
  try {
    const { studentId, courseId, issuedAt } = req.body;
    const cert = await prisma.certificate.create({ data: { studentId, courseId, issuedAt } });
    res.status(201).json(cert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCertificates = async (req, res) => {
  try {
    const certs = await prisma.certificate.findMany({ include: { student: true, course: true } });
    res.json(certs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await prisma.certificate.findUnique({ where: { id }, include: { student: true, course: true } });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json(cert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await prisma.certificate.update({ where: { id }, data: req.body });
    res.json(cert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.certificate.delete({ where: { id } });
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
