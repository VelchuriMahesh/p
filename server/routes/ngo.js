const express = require('express');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const {
  getMyNgoProfile,
  updateProfile,
  uploadQrCode,
  createNeed,
  updateNeed,
  deleteNeed,
  createPost,
  deletePost,
  getNgoDonations,
  verifyDonation,
  rejectDonation,
  getNgoDeliveries,
  verifyDelivery,
  rejectDelivery,
} = require('../controllers/ngoController');

const router = express.Router();

router.get('/me', asyncHandler(getMyNgoProfile));
router.put(
  '/profile',
  upload.fields([
    { name: 'qrCode', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
  ]),
  asyncHandler(updateProfile)
);
router.post('/qr', upload.single('file'), asyncHandler(uploadQrCode));
router.post('/needs', asyncHandler(createNeed));
router.put('/needs/:id', asyncHandler(updateNeed));
router.delete('/needs/:id', asyncHandler(deleteNeed));
router.post('/posts', upload.single('file'), asyncHandler(createPost));
router.delete('/posts/:id', asyncHandler(deletePost));
router.get('/donations', asyncHandler(getNgoDonations));
router.put('/donations/:id/verify', asyncHandler(verifyDonation));
router.put('/donations/:id/reject', asyncHandler(rejectDonation));
router.get('/deliveries', asyncHandler(getNgoDeliveries));
router.put('/deliveries/:id/verify', asyncHandler(verifyDelivery));
router.put('/deliveries/:id/reject', asyncHandler(rejectDelivery));

module.exports = router;

