import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redis from '../../lib/config/redisClient.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(403).json({ message: 'Failed to authenticate token' });

    // Check token blacklist (logout invalidation)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) return res.status(401).json({ message: 'Token has been revoked' });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.deletion?.isDeletionRequested || user.deletion?.isDeleted) {
      return res.status(403).json({
        message: 'Your account is scheduled for deletion or has been deleted. Access denied.'
      });
    }

    const defaultAccess = { canView: true, canEdit: false, canAdd: false, canDelete: false };

    req.user = {
      userId: user._id, // <-- use userId for consistency
      role: user.role,
      email: user.email,
      settings: {
        ...user.settings,
        accessControl: user.settings?.accessControl || defaultAccess
      }
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: `Unauthorized: ${  err.message}` });
  }
};

export default authMiddleware;
