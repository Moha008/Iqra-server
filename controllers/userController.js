const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { username, fullName, password, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        password: hashedPassword,
        role
      }
    });

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      'shksjhask38239210p_@@_#)WUOJKDDSDMSS', // secret key
      { expiresIn: '1y' }
    );

    return res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message || 'Something went wrong'
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ error: "username not found" });
    }

    // Compare password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Generate JWT (FIXED)
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      'shksjhask38239210p_@@_#)WUOJKDDSDMSS', // Secret key
      { expiresIn: "1y" }
    );

    return res.json({
      message: "Login successful",
      user,
      token
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// READ All Users
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { profile: true } });
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ Single User
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, include: {courses:{
      include:{
        reviews:true,
        enrollments:{
          include:{
            student:true
          },
          
        }
      }
    }} });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({ where: { id }, data: req.body });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getuserlearning=async(req,res)=>{
  try {
    const {id}=req.params
    const fn=await prisma.user.findFirst({
      where:{
        id
      },
      include:{
        enrollments:{
          include:{
            course:{
              include:{
                sections:{
                  include:{
                    lessons:true
                  }
                }
              }
            }
          }
        }
      }
    })
    res.json(fn)
  } catch (error) {
    
  }
}