const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { verifyCertificate } = require('../controllers/certificateController');

const router = express.Router();

router.get('/verify/:certId', asyncHandler(verifyCertificate));

module.exports = router;
