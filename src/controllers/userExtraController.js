// src/controllers/userExtraController.js

import crypto from "crypto";
import bcrypt from "bcryptjs";
import _ from "lodash";
import User from "../models/User.js";
import { sendResponse } from "../utils/helpers.js";
import {
	sendUserVerificationEmail,
	sendUserResetPasswordEmail,
	sendUserTwoFactorOTPEmail,
} from "../services/emailService.js";
import { generateUserToken } from "../services/tokenServices.js";
import logger from "../utils/logger.js"; // Using Winston for logging

// Helper: Generates a random hexadecimal token
const generateToken = () => crypto.randomBytes(20).toString("hex");

/**
 * GET /api/v1/auth/verify-email
 * Verifies a user's email using the token from the query parameters.
 */
export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;
		if (!token) {
			logger.warn("Verification token missing in request.");
			return sendResponse(res, 400, false, null, "Token is required");
		}

		const user = await User.findOne({
			emailVerificationToken: token,
			emailVerificationExpires: { $gt: Date.now() },
		});

		if (!user) {
			logger.warn(`Invalid or expired token: ${token}`);
			return sendResponse(
				res,
				400,
				false,
				null,
				"Invalid or expired token"
			);
		}

		user.isVerified = true;
		user.emailVerificationToken = undefined;
		user.emailVerificationExpires = undefined;
		await user.save();

		logger.info(`Email verified for user: ${user._id}`);
		return sendResponse(
			res,
			200,
			true,
			null,
			"Email verified successfully"
		);
	} catch (err) {
		logger.error(`Error in verifyEmail: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v1/auth/resend-verification
 * Resends the verification email to users who have not verified their email yet.
 */
export const resendVerificationEmail = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			logger.warn("Resend verification: Email missing in request.");
			return sendResponse(res, 400, false, null, "Email is required");
		}

		const user = await User.findOne({ email });
		if (!user) {
			logger.warn(
				`Resend verification failed: User not found (${email})`
			);
			return sendResponse(res, 400, false, null, "User not found");
		}
		if (user.isVerified) {
			logger.info(`User ${email} already verified; no action needed.`);
			return sendResponse(
				res,
				400,
				false,
				null,
				"Email already verified"
			);
		}

		const token = generateToken();
		user.emailVerificationToken = token;
		user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
		await user.save();

		await sendUserVerificationEmail(user.email, token);

		logger.info(`Resent verification email to user: ${user._id}`);
		return sendResponse(res, 200, true, null, "Verification email sent");
	} catch (err) {
		logger.error(`Error in resendVerificationEmail: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v1/auth/forgot-password
 * Generates a password reset token and sends a reset email to the user.
 */
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			logger.warn("Forgot password: Email missing.");
			return sendResponse(res, 400, false, null, "Email is required");
		}

		const user = await User.findOne({ email });
		if (!user) {
			logger.warn(`Forgot password: User not found for email ${email}`);
			return sendResponse(res, 400, false, null, "User not found");
		}

		const token = generateToken();
		user.forgotPasswordToken = token;
		user.forgotPasswordExpires = Date.now() + 60 * 60 * 1000;
		await user.save();

		await sendUserResetPasswordEmail(user.email, token);

		logger.info(`Password reset email sent for user: ${user._id}`);
		return sendResponse(res, 200, true, null, "Password reset email sent");
	} catch (err) {
		logger.error(`Error in forgotPassword: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v1/auth/reset-password
 * Resets the user's password after validating the provided token and new password matches.
 */
export const resetPassword = async (req, res) => {
	try {
		const allowedFields = ["token", "newPassword", "confirmPassword"];
		const data = _.pick(req.body, allowedFields);

		if (!data.token || !data.newPassword || !data.confirmPassword) {
			logger.warn("Reset password: Missing required fields.");
			return sendResponse(
				res,
				400,
				false,
				null,
				"Token and new passwords are required"
			);
		}

		if (data.newPassword !== data.confirmPassword) {
			logger.warn("Reset password: Passwords do not match.");
			return sendResponse(
				res,
				400,
				false,
				null,
				"Passwords do not match"
			);
		}

		const user = await User.findOne({
			forgotPasswordToken: data.token,
			forgotPasswordExpires: { $gt: Date.now() },
		});
		if (!user) {
			logger.warn(
				`Reset password failed: Invalid or expired token (${data.token})`
			);
			return sendResponse(
				res,
				400,
				false,
				null,
				"Invalid or expired token"
			);
		}

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(data.newPassword, salt);
		user.forgotPasswordToken = undefined;
		user.forgotPasswordExpires = undefined;
		await user.save();

		logger.info(`Password reset successful for user: ${user._id}`);
		return sendResponse(res, 200, true, null, "Password reset successful");
	} catch (err) {
		logger.error(`Error in resetPassword: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v1/auth/send-otp
 * Sends a six-digit two-factor authentication OTP to the user's email.
 */
export const sendTwoFactorOTP = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			logger.warn("Send OTP: Email missing.");
			return sendResponse(res, 400, false, null, "Email is required");
		}

		const user = await User.findOne({ email });
		if (!user) {
			logger.warn(`Send OTP: User not found for email ${email}`);
			return sendResponse(res, 400, false, null, "User not found");
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		user.twoFactorOTP = otp;
		user.twoFactorOTPExpires = Date.now() + 5 * 60 * 1000;
		await user.save();

		await sendUserTwoFactorOTPEmail(user.email, otp);

		logger.info(`OTP sent for 2FA to user: ${user._id}`);
		return sendResponse(res, 200, true, null, "OTP sent to email");
	} catch (err) {
		logger.error(`Error in sendTwoFactorOTP: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v1/auth/verify-otp
 * Verifies the two-factor authentication OTP and issues a JWT token if valid.
 */
export const verifyTwoFactorOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) {
			logger.warn("Verify OTP: Email or OTP missing.");
			return sendResponse(
				res,
				400,
				false,
				null,
				"Email and OTP are required"
			);
		}

		const user = await User.findOne({ email });
		if (
			!user ||
			!user.twoFactorOTP ||
			user.twoFactorOTPExpires < Date.now()
		) {
			logger.warn(
				`Verify OTP failed: OTP invalid or expired for ${email}`
			);
			return sendResponse(
				res,
				400,
				false,
				null,
				"OTP is invalid or expired"
			);
		}
		if (user.twoFactorOTP !== otp) {
			logger.warn(
				`Verify OTP failed: Provided OTP does not match for ${email}`
			);
			return sendResponse(res, 400, false, null, "OTP does not match");
		}

		// Clear the OTP
		user.twoFactorOTP = undefined;
		user.twoFactorOTPExpires = undefined;
		await user.save();

		// Generate JWT and set as cookie (expires in 1 hour)
		const token = generateUserToken({ id: user._id, email: user.email });
		const cookieOptions = {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 1000,
		};
		res.cookie("user-token", token, cookieOptions);

		logger.info(`OTP verified for user: ${user._id} and token issued`);
		return sendResponse(
			res,
			200,
			true,
			{ token },
			"OTP verified successfully; token issued"
		);
	} catch (err) {
		logger.error(`Error in verifyTwoFactorOTP: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * GET /api/v1/auth/verification-status
 * Retrieves the email verification status for the authenticated user.
 */
export const getVerificationStatus = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) {
			logger.warn(
				`User not found for verification status: ${req.user.id}`
			);
			return sendResponse(res, 404, false, null, "User not found");
		}
		const status = {
			verified: user.isVerified,
			message: user.isVerified
				? "Email is verified"
				: "Email is not verified. Please verify your email.",
		};
		logger.info(`Verification status retrieved for user: ${user._id}`);
		return sendResponse(
			res,
			200,
			true,
			status,
			"Verification status retrieved"
		);
	} catch (err) {
		logger.error(`Error in getVerificationStatus: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v1/auth/enable-2fa
 * Enables two-factor authentication for the authenticated user.
 */
export const enableTwoFactorAuth = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) {
			logger.warn(
				`User not found for enabling two-factor: ${req.user.id}`
			);
			return sendResponse(res, 404, false, null, "User not found");
		}
		user.twoFactorEnabled = true;
		await user.save();
		logger.info(`Two-factor authentication enabled for user: ${user._id}`);
		return sendResponse(
			res,
			200,
			true,
			null,
			"Two-factor authentication enabled"
		);
	} catch (err) {
		logger.error(`Error in enableTwoFactorAuth: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v1/auth/disable-2fa
 * Disables two-factor authentication for the authenticated user.
 */
export const disableTwoFactorAuth = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) {
			logger.warn(
				`User not found for disabling two-factor: ${req.user.id}`
			);
			return sendResponse(res, 404, false, null, "User not found");
		}
		user.twoFactorEnabled = false;
		await user.save();
		logger.info(`Two-factor authentication disabled for user: ${user._id}`);
		return sendResponse(
			res,
			200,
			true,
			null,
			"Two-factor authentication disabled"
		);
	} catch (err) {
		logger.error(`Error in disableTwoFactorAuth: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};
