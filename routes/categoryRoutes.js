const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.post('/', isAuthenticated, isAdmin, categoryController.createCategory);
router.get('/',categoryController.getCategories);
router.get('/get/one/:id', categoryController.getCategory);
router.put('/:id', isAuthenticated, isAdmin, categoryController.updateCategory);
router.delete('/:id', isAuthenticated, isAdmin, categoryController.deleteCategory);
router.get("/dashboard", isAuthenticated, isAdmin, categoryController.getDashboardData);

module.exports = router;
