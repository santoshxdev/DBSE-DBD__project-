const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAuditAction } = require('../services/auditService');

/**
 * Generate JWT Signed Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'rfid_library_super_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @desc    Authenticate User & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, error: 'Your account has been deactivated' });
    }

    const token = generateToken(user._id);

    await logAuditAction({
      userId: user._id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.userId,
      description: `User ${user.name} (${user.role}) logged in successfully`
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new user (Admin/Librarian)
 * @route   POST /api/auth/register
 * @access  Protected (Admin only) or initial setup
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const count = await User.countDocuments();
    const userId = `USR-${1000 + count + 1}`;

    const user = await User.create({
      userId,
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: role || 'LIBRARIAN',
      phone
    });

    const token = generateToken(user._id);

    await logAuditAction({
      userId: req.user ? req.user._id : user._id,
      action: 'USER_REGISTER',
      entityType: 'USER',
      entityId: user.userId,
      description: `Registered new user ${user.name} with role ${user.role}`
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe };
