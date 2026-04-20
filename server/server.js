const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { generalLimiter, donationLimiter } = require('./middleware/rateLimit');
const { verifyIdToken, requireRole } = require('./middleware/auth');
const adminRoutes = require('./routes/admin');
const ngoRoutes = require('./routes/ngo');
const donationRoutes = require('./routes/donation');
const deliveryRoutes = require('./routes/delivery');
const certificateRoutes = require('./routes/certificate');
const HttpError = require('./utils/httpError');
const { ensureSuperAdmin } = require('./utils/seedSuperAdmin');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new HttpError(403, 'Origin is not allowed by CORS.'));
    },
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'celebrate-with-purpose-api' });
});

app.use('/api/certificate', certificateRoutes);
app.use('/api/admin', verifyIdToken, requireRole('super_admin'), adminRoutes);
app.use('/api/ngo', verifyIdToken, requireRole('ngo_admin'), ngoRoutes);
app.use('/api/donation', verifyIdToken, requireRole('donor'), donationLimiter, donationRoutes);
app.use('/api/delivery', verifyIdToken, requireRole('donor'), deliveryRoutes);

app.use((req, res, next) => {
  next(new HttpError(404, 'Route not found.'));
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong.';

  res.status(statusCode).json({ message });
});

ensureSuperAdmin()
  .then(() => {
    app.listen(port, () => {
      console.log(`Celebrate With Purpose API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to seed super admin:', error);
    process.exit(1);
  });
