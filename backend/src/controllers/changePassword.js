const bcrypt = require('bcrypt');
const User = require('../models/Schemas/User');

const MIN_LENGTH = 8;

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_LENGTH) {
      return res.status(400).json({ message: `New password must be at least ${MIN_LENGTH} characters.` });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.password) {
      return res.status(400).json({ message: 'This account signs in with Google and has no password to change.' });
    }
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current one.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password updated.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = changePassword;
module.exports.MIN_LENGTH = MIN_LENGTH;
