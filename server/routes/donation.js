const express = require('express');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const { submitDonation, getMyDonations, getDonationCertificate } = require('../controllers/donationController');

const router = express.Router();

router.post('/', upload.single('screenshot'), asyncHandler(submitDonation));
router.get('/my', asyncHandler(getMyDonations));
router.get('/:id/certificate', asyncHandler(getDonationCertificate));

module.exports = router;

