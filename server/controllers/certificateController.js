const { db } = require('../config/firebase');
const HttpError = require('../utils/httpError');

const verifyCertificate = async (req, res) => {
  const certId = req.params.certId;
  const [donationSnap, deliverySnap] = await Promise.all([
    db.collection('donations').where('certificateId', '==', certId).limit(1).get(),
    db.collection('deliveries').where('certificateId', '==', certId).limit(1).get(),
  ]);

  if (!donationSnap.empty) {
    return res.json({
      valid: true,
      type: 'donation',
      record: donationSnap.docs[0].data(),
    });
  }

  if (!deliverySnap.empty) {
    return res.json({
      valid: true,
      type: 'delivery',
      record: deliverySnap.docs[0].data(),
    });
  }

  throw new HttpError(404, 'Certificate not found.');
};

module.exports = {
  verifyCertificate,
};

