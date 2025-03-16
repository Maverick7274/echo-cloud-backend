// emailService.js
// Service for sending different types of emails such as verification, password reset, and two-factor authentication for both users and admins.
// Ensure environment variables are properly set for SMTP configuration and API version

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a nodemailer transporter using environment SMTP configuration
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST, // SMTP server host, e.g., "smtp.gmail.com"
	port: Number(process.env.SMTP_PORT), // SMTP port, e.g., 587 for TLS or 465 for SSL
	secure: false, // Use TLS (false for port 587, true for port 465)
	auth: {
		user: process.env.SMTP_USER, // SMTP username
		pass: process.env.SMTP_PASS, // SMTP password
	},
});

/**
 * Sends a verification email to a user.
 * Route: GET /api/v{API_VERSION}/user/verify-email?token={token}
 * @param {string} to - Recipient's email address.
 * @param {string} token - Unique verification token.
 * @returns {Promise} - Resolves when the email is sent.
 */
export const sendUserVerificationEmail = async (to, token) => {
	const verificationLink = `http://localhost:3000/en/verify-email?token=${token}`;
	const mailOptions = {
		from: `"No Reply" <${process.env.SMTP_USER}>`,
		to,
		subject: "Verify Your Email Address - Dayadevraha",
		text: `Please verify your email by clicking the following link: ${verificationLink}`,
		html: `<html>
  <head>
  <style type="text/css">
    .email-container { width: 100%; background: #f5f5f5; padding: 20px; font-family: Arial, sans-serif; }
    .email-content { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #007BFF; padding: 15px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .body-text { color: #333333; line-height: 1.5; }
    .button { display: inline-block; margin-top: 20px; padding: 12px 20px; background: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999999; }
  </style>
  </head>
  <body>
  <div class="email-container">
    <div class="email-content">
    <div class="header">
      <h2>Verify Your Email</h2>
    </div>
    <div class="body-text">
      <p>Hello,</p>
      <p>Thank you for registering with Dayadevraha! Please verify your email address by clicking the button below:</p>
      <p style="text-align:center;"><a href="${verificationLink}" class="button">Verify Email</a></p>
      <p>If the button doesn’t work, copy and paste the following link into your browser: ${verificationLink}</p>
      <p>If you did not sign up, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Dayadevraha. All rights reserved.</p>
    </div>
    </div>
  </div>
  </body>
</html>`,
	};
	return transporter.sendMail(mailOptions);
};

/**
 * Sends a verification email to an admin.
 * Route: GET /api/v{API_VERSION}/admin/verify-email?token={token}
 * @param {string} to - Recipient admin's email address.
 * @param {string} token - Unique verification token.
 * @returns {Promise} - Resolves when the email is sent.
 */
export const sendAdminVerificationEmail = async (to, token) => {
	const verificationLink = `http://localhost:3000/en/admin/verify-email?token=${token}`;
	const mailOptions = {
		from: `"No Reply" <${process.env.SMTP_USER}>`,
		to,
		subject: "Verify Your Admin Email Address - Dayadevraha",
		text: `Please verify your admin email by clicking the following link: ${verificationLink}`,
		html: `<html>
  <head>
  <style type="text/css">
    .email-container { width: 100%; background: #f5f5f5; padding: 20px; font-family: Arial, sans-serif; }
    .email-content { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #007BFF; padding: 15px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .body-text { color: #333333; line-height: 1.5; }
    .button { display: inline-block; margin-top: 20px; padding: 12px 20px; background: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999999; }
  </style>
  </head>
  <body>
  <div class="email-container">
    <div class="email-content">
    <div class="header">
      <h2>Verify Your Admin Email</h2>
    </div>
    <div class="body-text">
      <p>Hello,</p>
      <p>Thank you for registering as an admin at Dayadevraha! Please verify your admin email address by clicking the button below:</p>
      <p style="text-align:center;"><a href="${verificationLink}" class="button">Verify Admin Email</a></p>
      <p>If the button doesn’t work, copy and paste the following link into your browser: ${verificationLink}</p>
      <p>If you did not sign up, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Dayadevraha. All rights reserved.</p>
    </div>
    </div>
  </div>
  </body>
</html>`,
	};
	return transporter.sendMail(mailOptions);
};

/**
 * Sends a password reset email to a user.
 * Route: GET /api/v{API_VERSION}/user/reset-password?token={token}
 * @param {string} to - Recipient's email address.
 * @param {string} token - Unique password reset token.
 * @returns {Promise} - Resolves when the email is sent.
 */
export const sendUserResetPasswordEmail = async (to, token) => {
	const resetLink = `http://localhost:3000/en/forgot-password/reset-password?token=${token}`;
	const mailOptions = {
		from: `"No Reply" <${process.env.SMTP_USER}>`,
		to,
		subject: "Reset Your Password - Dayadevraha",
		text: `You requested a password reset. Click the following link to reset your password: ${resetLink}`,
		html: `<html>
  <head>
  <style type="text/css">
    .email-container { width: 100%; background: #f5f5f5; padding: 20px; font-family: Arial, sans-serif; }
    .email-content { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #dc3545; padding: 15px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .body-text { color: #333333; line-height: 1.5; }
    .button { display: inline-block; margin-top: 20px; padding: 12px 20px; background: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999999; }
  </style>
  </head>
  <body>
  <div class="email-container">
    <div class="email-content">
    <div class="header">
      <h2>Reset Your Password</h2>
    </div>
    <div class="body-text">
      <p>Hello,</p>
      <p>You requested a password reset for your Dayadevraha account. Click the button below to reset your password:</p>
      <p style="text-align:center;"><a href="${resetLink}" class="button">Reset Password</a></p>
      <p>If the button doesn’t work, please copy and paste the following link into your browser: ${resetLink}</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Dayadevraha. All rights reserved.</p>
    </div>
    </div>
  </div>
  </body>
</html>`,
	};
	return transporter.sendMail(mailOptions);
};

/**
 * Sends a password reset email to an admin.
 * Route: GET /api/v{API_VERSION}/admin/reset-password?token={token}
 * @param {string} to - Admin's email address.
 * @param {string} token - Unique password reset token.
 * @returns {Promise} - Resolves when the email is sent.
 */
export const sendAdminResetPasswordEmail = async (to, token) => {
	const resetLink = `http://localhost:3000/en/admin/forgot-password/reset-password?token=${token}`;
	const mailOptions = {
		from: `"No Reply" <${process.env.SMTP_USER}>`,
		to,
		subject: "Reset Your Admin Password - Dayadevraha",
		text: `You requested a password reset for your Dayadevraha admin account. Click the following link to reset your password: ${resetLink}`,
		html: `<html>
  <head>
  <style type="text/css">
    .email-container { width: 100%; background: #f5f5f5; padding: 20px; font-family: Arial, sans-serif; }
    .email-content { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #dc3545; padding: 15px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .body-text { color: #333333; line-height: 1.5; }
    .button { display: inline-block; margin-top: 20px; padding: 12px 20px; background: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999999; }
  </style>
  </head>
  <body>
  <div class="email-container">
    <div class="email-content">
    <div class="header">
      <h2>Reset Your Admin Password</h2>
    </div>
    <div class="body-text">
      <p>Hello,</p>
      <p>You requested a password reset for your Dayadevraha admin account. Click the button below to reset your password:</p>
      <p style="text-align:center;"><a href="${resetLink}" class="button">Reset Admin Password</a></p>
      <p>If the button doesn’t work, please copy and paste the following link into your browser: ${resetLink}</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Dayadevraha. All rights reserved.</p>
    </div>
    </div>
  </div>
  </body>
</html>`,
	};
	return transporter.sendMail(mailOptions);
};

/**
 * Sends a two-factor authentication OTP email to a user.
 * This OTP is valid for 5 minutes.
 * @param {string} to - Recipient's email address.
 * @param {string} otp - One-time password code.
 * @returns {Promise} - Resolves when the email is sent.
 */
export const sendUserTwoFactorOTPEmail = async (to, otp) => {
	const mailOptions = {
		from: `"No Reply" <${process.env.SMTP_USER}>`,
		to,
		subject: "Your Two-Factor Authentication Code - Dayadevraha",
		text: `Your OTP code is: ${otp}`,
		html: `<html>
  <head>
  <style type="text/css">
    .email-container { width: 100%; background: #f5f5f5; padding: 20px; font-family: Arial, sans-serif; }
    .email-content { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #6f42c1; padding: 15px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .body-text { color: #333333; line-height: 1.5; text-align: center; }
    .otp-code { font-size: 24px; font-weight: bold; color: #dc3545; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999999; }
  </style>
  </head>
  <body>
  <div class="email-container">
    <div class="email-content">
    <div class="header">
      <h2>Your OTP Code</h2>
    </div>
    <div class="body-text">
      <p>Hello,</p>
      <p>Your one-time password (OTP) for two-factor authentication is:</p>
      <p class="otp-code">${otp}</p>
      <p>This code is valid for 5 minutes.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Dayadevraha. All rights reserved.</p>
    </div>
    </div>
  </div>
  </body>
</html>`,
	};
	return transporter.sendMail(mailOptions);
};

/**
 * Sends a two-factor authentication OTP email to an admin.
 * This OTP is valid for 5 minutes.
 * @param {string} to - Admin's email address.
 * @param {string} otp - One-time password code.
 * @returns {Promise} - Resolves when the email is sent.
 */
export const sendAdminTwoFactorOTPEmail = async (to, otp) => {
	const mailOptions = {
		from: `"No Reply" <${process.env.SMTP_USER}>`,
		to,
		subject: "Your Admin Two-Factor Authentication Code - Dayadevraha",
		text: `Your OTP code is: ${otp}`,
		html: `<html>
  <head>
  <style type="text/css">
    .email-container { width: 100%; background: #f5f5f5; padding: 20px; font-family: Arial, sans-serif; }
    .email-content { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #6f42c1; padding: 15px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .body-text { color: #333333; line-height: 1.5; text-align: center; }
    .otp-code { font-size: 24px; font-weight: bold; color: #dc3545; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999999; }
  </style>
  </head>
  <body>
  <div class="email-container">
    <div class="email-content">
    <div class="header">
      <h2>Your Admin OTP Code</h2>
    </div>
    <div class="body-text">
      <p>Hello,</p>
      <p>Your admin one-time password (OTP) for two-factor authentication is:</p>
      <p class="otp-code">${otp}</p>
      <p>This code is valid for 5 minutes.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Dayadevraha. All rights reserved.</p>
    </div>
    </div>
  </div>
  </body>
</html>`,
	};
	return transporter.sendMail(mailOptions);
};
