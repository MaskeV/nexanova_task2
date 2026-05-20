const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map();

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// @desc    Request password reset
// @route   POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // For security, always return success even if user doesn't exist
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset code'
      });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store with expiry (10 minutes)
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    resetTokens.set(normalizedEmail, {
      code: resetCode,
      expiry: expiry,
      attempts: 0,
      userId: user._id
    });

    // Send email with reset code
    try {
      await sendResetEmail(normalizedEmail, resetCode, user.name || user.username);
      
      // Log for development (remove in production)
      console.log(`✅ Password reset code sent to ${normalizedEmail}: ${resetCode}`);
      
      res.status(200).json({
        success: true,
        message: 'Password reset code has been sent to your email',
        // For development only - remove in production
        ...(process.env.NODE_ENV === 'development' && { resetCode: resetCode })
      });
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // Remove the token if email fails
      resetTokens.delete(normalizedEmail);
      
      // Check if it's a configuration error
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️ Email credentials not configured. For development, showing code:');
        console.log(`Reset code for ${normalizedEmail}: ${resetCode}`);
        
        return res.status(200).json({
          success: true,
          message: 'Password reset code generated (email not configured)',
          resetCode: resetCode, // Return code for development
          note: 'Email service not configured. Use the code above.'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Function to send reset email
const sendResetEmail = async (email, resetCode, userName) => {
  // Skip email sending if no credentials configured (for development)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️ Email credentials not configured. Skipping email send.');
    console.log(`📧 Would send to ${email}: Reset code: ${resetCode}`);
    return;
  }

  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Trainer Management System'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Code - Trainer Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
          .code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #4CAF50; 
            text-align: center; 
            letter-spacing: 5px;
            margin: 20px 0;
            padding: 15px;
            background-color: #e8f5e9;
            border-radius: 5px;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
          }
          .warning { 
            background-color: #fff3cd; 
            border: 1px solid #ffeaa7; 
            color: #856404; 
            padding: 10px; 
            border-radius: 4px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName || 'User'},</h2>
            <p>You have requested to reset your password for the Trainer Management System.</p>
            <p>Please use the following 6-digit verification code:</p>
            
            <div class="code">${resetCode}</div>
            
            <div class="warning">
              <strong>Important:</strong>
              <ul>
                <li>This code will expire in 10 minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p>Enter this code on the password reset page to create a new password.</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Trainer Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Trainer Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Verify reset code
// @route   POST /auth/verify-reset-code
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tokenData = resetTokens.get(normalizedEmail);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'No reset code found. Please request a new one.'
      });
    }

    // Check if expired
    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (tokenData.attempts >= 3) {
      resetTokens.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify code
    if (tokenData.code !== code.trim()) {
      tokenData.attempts++;
      resetTokens.set(normalizedEmail, tokenData);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code',
        attemptsLeft: 3 - tokenData.attempts
      });
    }

    // Code verified successfully
    res.status(200).json({
      success: true,
      message: 'Code verified successfully'
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// @desc    Reset password with code
// @route   POST /auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tokenData = resetTokens.get(normalizedEmail);

    if (!tokenData || tokenData.code !== code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired'
      });
    }

    // Find user and update password
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Clear the reset token
    resetTokens.delete(normalizedEmail);

    // Send confirmation email
    try {
      await sendConfirmationEmail(normalizedEmail, user.name || user.username);
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError);
      // Don't fail the reset if confirmation email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// Function to send confirmation email
const sendConfirmationEmail = async (email, userName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email credentials not configured. Skipping confirmation email.');
    return;
  }

  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Trainer Management System'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Successful - Trainer Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
          .success-icon { 
            color: #4CAF50; 
            font-size: 48px; 
            text-align: center;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          <div class="content">
            <div class="success-icon">✓</div>
            <h2>Hello ${userName || 'User'},</h2>
            <p>Your password has been successfully reset.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>For security reasons, we recommend:</p>
            <ul>
              <li>Using a strong, unique password</li>
              <li>Enabling two-factor authentication if available</li>
              <li>Not sharing your password with anyone</li>
            </ul>
            <p>You can now log in to your account with your new password.</p>
            <p>Best regards,<br>The Trainer Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Trainer Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  forgotPassword,
  verifyResetCode,
  resetPassword
};