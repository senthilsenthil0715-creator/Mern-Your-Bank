require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_only_secret_change_me';

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/seedAdmin');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', bank: 'Your Bank' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bank', require('./routes/bank'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/card', require('./routes/card'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message);
  let status = err.status || 500;
  if (err.name === 'CastError' || err.name === 'ValidationError') status = 400;
  if (err.code === 11000) status = 409;
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => ensureAdmin())
  .then(() => app.listen(PORT, () => console.log(`Your Bank API running on port ${PORT}`)))
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
