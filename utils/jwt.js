const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, "34932030wpoklqmjmkasa", {
    expiresIn: '8d'
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, "34932030wpoklqmjmkasa");
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};