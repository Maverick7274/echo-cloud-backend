import crypto from "crypto";
import bcrypt from "bcryptjs";
import _ from "lodash";
import Admin from "../models/Admin.js";
import { sendResponse } from "../utils/helpers.js";
import {
	sendAdminVerificationEmail,
	sendAdminResetPasswordEmail,
	sendAdminTwoFactorOTPEmail,
} from "../services/emailService.js";
import { generateAdminToken } from "../services/tokenServices.js";
import logger from "../utils/logger.js";

// Generates a random token string
const generateToken = () => crypto.randomBytes(20).toString("hex");

/**
 * GET /api/v{version}/admin/verify-email?token=XYZ
 * Verifies the admin's email using the provided token.
 */
export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;
		if (!token) {
			logger.warn("Verification token missing in request.");
			return sendResponse(res, 400, false, null, "Token is required");
		}

		const admin = await Admin.findOne({
			emailVerificationToken: token,
			emailVerificationExpires: { $gt: Date.now() },
		});

		if (!admin) {
			logger.warn(`Invalid or expired token: ${token}`);
			return sendResponse(
				res,
				400,
				false,
				null,
				"Invalid or expired token"
			);
		}

		admin.isVerified = true;
		admin.emailVerificationToken = undefined;
		admin.emailVerificationExpires = undefined;
		await admin.save();

		logger.info(`Email verified for admin: ${admin._id}`);
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
 * POST /api/v{version}/admin/resend-verification
 * Resends the email verification link to an unverified admin.
 */
export const resendVerificationEmail = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			logger.warn("Resend verification: Email missing in request.");
			return sendResponse(res, 400, false, null, "Email is required");
		}

		const admin = await Admin.findOne({ email });
		if (!admin) {
			logger.warn(`Admin not found (${email})`);
			return sendResponse(res, 400, false, null, "Admin not found");
		}
		if (admin.isVerified) {
			logger.info(`Admin ${email} already verified.`);
			return sendResponse(
				res,
				400,
				false,
				null,
				"Email already verified"
			);
		}

		const token = generateToken();
		admin.emailVerificationToken = token;
		admin.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
		await admin.save();

		await sendAdminVerificationEmail(admin.email, token);
		logger.info(`Resent verification email to admin: ${admin._id}`);
		return sendResponse(res, 200, true, null, "Verification email sent");
	} catch (err) {
		logger.error(`Error in resendVerificationEmail: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v{version}/admin/forgot-password
 * Sends a password reset email to the admin with a valid email.
 */
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			logger.warn("Forgot password: Email missing.");
			return sendResponse(res, 400, false, null, "Email is required");
		}

		const admin = await Admin.findOne({ email });
		if (!admin) {
			logger.warn(`Admin not found for email ${email}`);
			return sendResponse(res, 400, false, null, "Admin not found");
		}

		const token = generateToken();
		admin.forgotPasswordToken = token;
		admin.forgotPasswordExpires = Date.now() + 60 * 60 * 1000;
		await admin.save();

		await sendAdminResetPasswordEmail(admin.email, token);
		logger.info(`Password reset email sent for admin: ${admin._id}`);
		return sendResponse(res, 200, true, null, "Password reset email sent");
	} catch (err) {
		logger.error(`Error in forgotPassword: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v{version}/admin/reset-password
 * Resets the admin's password after validating the token and new passwords.
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

		const admin = await Admin.findOne({
			forgotPasswordToken: data.token,
			forgotPasswordExpires: { $gt: Date.now() },
		});
		if (!admin) {
			logger.warn(`Invalid or expired token (${data.token})`);
			return sendResponse(
				res,
				400,
				false,
				null,
				"Invalid or expired token"
			);
		}

		const salt = await bcrypt.genSalt(10);
		admin.password = await bcrypt.hash(data.newPassword, salt);
		admin.forgotPasswordToken = undefined;
		admin.forgotPasswordExpires = undefined;
		await admin.save();

		logger.info(`Password reset successful for admin: ${admin._id}`);
		return sendResponse(res, 200, true, null, "Password reset successful");
	} catch (err) {
		logger.error(`Error in resetPassword: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v{version}/admin/send-otp
 * Generates a two-factor authentication OTP and sends it to the admin’s email.
 */
export const sendTwoFactorOTP = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			logger.warn("Send OTP: Email missing.");
			return sendResponse(res, 400, false, null, "Email is required");
		}

		const admin = await Admin.findOne({ email });
		if (!admin) {
			logger.warn(`Admin not found for email ${email}`);
			return sendResponse(res, 400, false, null, "Admin not found");
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		admin.twoFactorOTP = otp;
		admin.twoFactorOTPExpires = Date.now() + 5 * 60 * 1000;
		await admin.save();

		await sendAdminTwoFactorOTPEmail(admin.email, otp);
		logger.info(`OTP sent for admin: ${admin._id}`);
		return sendResponse(res, 200, true, null, "OTP sent to email");
	} catch (err) {
		logger.error(`Error in sendTwoFactorOTP: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * POST /api/v{version}/admin/verify-otp
 * Verifies the provided OTP and issues a JWT for the admin.
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
		const admin = await Admin.findOne({ email });
		if (
			!admin ||
			!admin.twoFactorOTP ||
			admin.twoFactorOTPExpires < Date.now()
		) {
			logger.warn(`OTP invalid or expired for ${email}`);
			return sendResponse(
				res,
				400,
				false,
				null,
				"OTP is invalid or expired"
			);
		}
		if (admin.twoFactorOTP !== otp) {
			logger.warn(`Provided OTP does not match for ${email}`);
			return sendResponse(res, 400, false, null, "OTP does not match");
		}

		admin.twoFactorOTP = undefined;
		admin.twoFactorOTPExpires = undefined;
		await admin.save();

		const token = generateAdminToken({ id: admin._id, email: admin.email });
		const cookieOptions = {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 1000,
		};
		res.cookie("admin-token", token, cookieOptions);

		logger.info(`OTP verified for admin: ${admin._id} and token issued`);
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
 * GET /api/v{version}/admin/verification-status
 * Returns the current email verification status of the authenticated admin.
 */
export const getVerificationStatus = async (req, res) => {
	try {
		const admin = await Admin.findById(req.admin.id);
		if (!admin) {
			logger.warn(`Admin not found: ${req.admin.id}`);
			return sendResponse(res, 404, false, null, "Admin not found");
		}
		const status = {
			verified: admin.isVerified,
			message: admin.isVerified
				? "Email is verified"
				: "Email is not verified. Please verify your email.",
		};
		logger.info(`Verification status retrieved for admin: ${admin._id}`);
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
 * PUT /api/v{version}/admin/enable-2fa
 * Enables two-factor authentication for the authenticated admin.
 */
export const enableTwoFactorAuth = async (req, res) => {
	try {
		const admin = await Admin.findById(req.admin.id);
		if (!admin) {
			logger.warn(`Admin not found: ${req.admin.id}`);
			return sendResponse(res, 404, false, null, "Admin not found");
		}
		admin.twoFactorEnabled = true;
		await admin.save();
		logger.info(`Two-factor enabled for admin: ${admin._id}`);
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
 * PUT /api/v{version}/admin/disable-2fa
 * Disables two-factor authentication for the authenticated admin.
 */
export const disableTwoFactorAuth = async (req, res) => {
	try {
		const admin = await Admin.findById(req.admin.id);
		if (!admin) {
			logger.warn(`Admin not found: ${req.admin.id}`);
			return sendResponse(res, 404, false, null, "Admin not found");
		}
		admin.twoFactorEnabled = false;
		await admin.save();
		logger.info(`Two-factor disabled for admin: ${admin._id}`);
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
