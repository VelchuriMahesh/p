const { db, Timestamp } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const createNotification = async ({ recipientUid, title, body, type }) => {
  const notifId = uuidv4();

  await db.collection('notifications').doc(notifId).set({
    notifId,
    recipientUid,
    title,
    body,
    type,
    read: false,
    createdAt: Timestamp.now(),
  });

  return notifId;
};

module.exports = {
  createNotification,
};

