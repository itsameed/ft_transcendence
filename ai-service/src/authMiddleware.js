// src/authMiddleware.js
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'مطلوب تسجيل الدخول (لا يوجد توكن).' });
  }

  const token = authHeader.split(' ')[1];
  const mockAuthEnabled = process.env.MOCK_AUTH === 'true';

  if (mockAuthEnabled) {
    const numericId = Number(token);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(401).json({
        error: 'وضع MOCK_AUTH مفعّل: أرسل رقم مستخدم صحيح (مثلاً 1 أو 2) بدل توكن JWT.',
      });
    }

    req.user = { id: numericId };
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    let userId;
    if (payload.id) {
      userId = payload.id;
    } else if (payload.sub) {
      userId = payload.sub;
    } else if (payload.userId) {
      userId = payload.userId;
    } else {
      userId = null;
    }

    req.user = { id: userId };

    if (!req.user.id) {
      return res.status(401).json({ error: 'توكن غير صالح: لا يحتوي على معرف مستخدم.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'توكن غير صالح أو منتهي الصلاحية.' });
  }
}

module.exports = authenticateJWT;
