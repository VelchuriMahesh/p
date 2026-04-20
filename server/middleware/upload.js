const multer = require('multer');
const HttpError = require('../utils/httpError');

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new HttpError(400, 'Only JPG, PNG, and WebP images up to 5MB are allowed.'));
      return;
    }

    cb(null, true);
  },
});

module.exports = upload;

