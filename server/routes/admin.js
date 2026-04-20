const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { createNgo, listNgos, updateNgo, getStats } = require('../controllers/adminController');

const router = express.Router();

router.post('/create-ngo', asyncHandler(createNgo));
router.get('/ngos', asyncHandler(listNgos));
router.put('/ngo/:id', asyncHandler(updateNgo));
router.get('/stats', asyncHandler(getStats));

module.exports = router;

