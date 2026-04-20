const express = require('express');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const { submitDelivery, getMyDeliveries, getDeliveryCertificate } = require('../controllers/deliveryController');

const router = express.Router();

router.post('/', upload.single('proofImage'), asyncHandler(submitDelivery));
router.get('/my', asyncHandler(getMyDeliveries));
router.get('/:id/certificate', asyncHandler(getDeliveryCertificate));

module.exports = router;

