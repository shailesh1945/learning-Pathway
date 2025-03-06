const jwt = require('jsonwebtoken');
const User = require('../models/User');

const loginUser = async (req, res) => {
  try {
    console.log('Login attempt:', {
      email: req.body.email,
      timestamp: new Date().toISOString()
    });

    const { email, password } = req.body;

    // Find user with all fields
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found', { email });
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('User found:', {
      userId: user._id,
      role: user.role,
      name: user.name || 'Name not set',
      email: user.email
    });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Login failed: Invalid password', { email });
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Update lastActive without validation
    await User.findByIdAndUpdate(user._id, { lastActive: new Date() }, { 
      validateBeforeSave: false,
      new: true 
    });

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h'
      }
    );

    console.log('JWT token created:', {
      userId: user._id,
      tokenLength: token.length,
      expiresIn: '24h'
    });

    // Send response (excluding password)
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name || '',
        email: user.email,
        role: user.role,
        lastActive: new Date()
      },
      token
    });

    console.log('Login successful:', {
      userId: user._id,
      name: user.name || '',
      role: user.role,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false,
      message: 'Error logging in',
      error: error.message 
    });
  }
};

module.exports = {
  loginUser
}; 