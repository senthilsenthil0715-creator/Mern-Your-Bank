const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authorized, please log in' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    if (user.status === 'suspended')
      return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
};
