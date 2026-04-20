const { auth, db } = require('../config/firebase');
const HttpError = require('../utils/httpError');

const verifyIdToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new HttpError(401, 'Authentication token is required.');
    }

    const decoded = await auth.verifyIdToken(token);
    const userSnap = await db.collection('users').doc(decoded.uid).get();

    if (!userSnap.exists) {
      throw new HttpError(403, 'User profile not found.');
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      claims: decoded,
      ...userSnap.data(),
    };

    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid or expired session.'));
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new HttpError(401, 'Authentication required.'));
  }

  if (!roles.includes(req.user.role)) {
    return next(new HttpError(403, 'You do not have permission to access this resource.'));
  }

  return next();
};

module.exports = {
  verifyIdToken,
  requireRole,
};

