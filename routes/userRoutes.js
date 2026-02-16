const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.post('/', userController.createUser);
router.get('/',isAuthenticated, userController.getUsers);
router.get('/course/get/:id',isAuthenticated, userController.getuserlearning);
router.get('/get/user/:id',isAuthenticated, userController.getUser);
router.put('/:id',isAuthenticated, userController.updateUser);
router.delete('/:id',isAuthenticated,isAdmin, userController.deleteUser);
router.post("/login", userController.loginUser);

module.exports = router;
