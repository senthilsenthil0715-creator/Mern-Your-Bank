const router = require('express').Router();
const User = require('../models/User');
const protect = require('../middleware/auth');
const { asyncHandler, genCard } = require('../utils/bank');

router.use(protect);

router.get('/', (req, res) => res.json({ card: req.user.card }));

router.post(
  '/freeze',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.card.frozen = !user.card.frozen;
    await user.save();
    res.json({ message: user.card.frozen ? 'Card frozen' : 'Card unfrozen', card: user.card });
  })
);

router.post(
  '/replace',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.card = genCard();
    await user.save();
    res.json({ message: 'New card issued', card: user.card });
  })
);

module.exports = router;
