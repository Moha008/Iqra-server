const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');

router.post('/', sectionController.createSection);
router.get('/', sectionController.getSections);
router.get('/course/:id', sectionController.getSection);
router.put('/:id', sectionController.updateSection);
router.delete('/:id', sectionController.deleteSection);

module.exports = router;
