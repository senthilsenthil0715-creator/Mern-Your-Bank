require('dotenv').config();
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/seedAdmin');

connectDB()
  .then(ensureAdmin)
  .then(() => {
    console.log('Seed complete');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
