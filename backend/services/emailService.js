const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, name, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'TrafficAlert - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #007bff; margin: 0;">TrafficAlert</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to TrafficAlert!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hi ${name},
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for joining TrafficAlert! To complete your registration, please verify your email address using the code below:
            </p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h3 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h3>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              This verification code will expire in 10 minutes. If you didn't create an account with TrafficAlert, please ignore this email.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Best regards,<br>
              The TrafficAlert Team
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'TrafficAlert - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #007bff; margin: 0;">TrafficAlert</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hi ${name},
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              We received a request to reset your password for your TrafficAlert account. Use the verification code below to reset your password:
            </p>
            
            <div style="background-color: #fff3cd; border: 2px dashed #ffc107; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h3 style="color: #856404; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h3>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              This verification code will expire in 10 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Best regards,<br>
              The TrafficAlert Team
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to TrafficAlert!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #007bff; margin: 0;">TrafficAlert</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to the Community!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hi ${name},
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Your email has been verified successfully! Welcome to TrafficAlert, the community-driven traffic reporting platform.
            </p>
            
            <div style="background-color: #d4edda; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #155724; margin-top: 0;">What you can do now:</h3>
              <ul style="color: #155724; margin: 0; padding-left: 20px;">
                <li>Report traffic incidents in your area</li>
                <li>View real-time traffic reports from other users</li>
                <li>Get route suggestions with traffic information</li>
                <li>Help verify reports from the community</li>
                <li>Customize your profile and preferences</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for joining our community and helping make roads safer for everyone!
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Best regards,<br>
              The TrafficAlert Team
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testEmailConfig
};
