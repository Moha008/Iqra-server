const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE Profile
exports.createProfile = async (req, res) => {
  try {
    const { userId, fullName, bio, avatarUrl } = req.body;
    const profile = await prisma.profile.create({ data: { userId, fullName, bio, avatarUrl } });
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ All Profiles
exports.getProfiles = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({ include: { user: true } });
    res.json(profiles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ Single Profile
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.findUnique({ where: { id }, include: { user: true } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE Profile
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.update({ where: { id }, data: req.body });
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE Profile
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.profile.delete({ where: { id } });
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
