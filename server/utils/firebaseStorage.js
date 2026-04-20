const path = require('path');
const { bucket } = require('../config/firebase');

const uploadBuffer = async ({ buffer, destination, mimetype, metadata = {} }) => {
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
      metadata,
    },
    resumable: false,
    public: false,
  });

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-01-2500',
  });

  return {
    path: destination,
    url,
    filename: path.basename(destination),
  };
};

module.exports = {
  uploadBuffer,
};

