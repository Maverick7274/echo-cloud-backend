// src/routes/adminExtraRoutes.js

import { Router } from "express";
import {
	verifyEmail,
	resendVerificationEmail,
	forgotPassword,
	resetPassword,
	sendTwoFactorOTP,
	verifyTwoFactorOTP,
	getVerificationStatus,
	enableTwoFactorAuth,
	disableTwoFactorAuth,
} from "../controllers/adminExtraController.js";
import { adminProtect } from "../middlewares/authMiddleware.js";

export default function adminExtraRoutes(version) {
	const router = Router();

	// GET /api/v{version}/admin/verify-email
	// Triggers the verification process for an admin's email address.
	router.get(`/api/v${version}/admin/verify-email`, verifyEmail);

	// POST /api/v{version}/admin/resend-verification
	// Resends the email verification link to the admin.
	router.post(
		`/api/v${version}/admin/resend-verification`,
		resendVerificationEmail
	);

	// GET /api/v{version}/admin/verification-status
	// Retrieves the current email verification status for the authenticated admin.
	router.get(
		`/api/v${version}/admin/verification-status`,
		adminProtect,
		getVerificationStatus
	);

	// POST /api/v{version}/admin/forgot-password
	// Initiates the password reset process by sending a reset link to the admin.
	router.post(`/api/v${version}/admin/forgot-password`, forgotPassword);

	// POST /api/v{version}/admin/reset-password
	// Resets the admin's password using the provided reset token and new password.
	router.post(`/api/v${version}/admin/reset-password`, resetPassword);

	// POST /api/v{version}/admin/send-otp
	// Sends a One-Time Password (OTP) to the admin for two-factor authentication.
	router.post(`/api/v${version}/admin/send-otp`, sendTwoFactorOTP);

	// POST /api/v{version}/admin/verify-otp
	// Verifies the OTP submitted by the admin to complete two-factor authentication.
	router.post(`/api/v${version}/admin/verify-otp`, verifyTwoFactorOTP);

	// POST /api/v{version}/admin/enable-two-factor
	// Enables two-factor authentication for the authenticated admin.
	router.post(
		`/api/v${version}/admin/enable-two-factor`,
		adminProtect,
		enableTwoFactorAuth
	);

	// POST /api/v{version}/admin/disable-two-factor
	// Disables two-factor authentication for the authenticated admin.
	router.post(
		`/api/v${version}/admin/disable-two-factor`,
		adminProtect,
		disableTwoFactorAuth
	);

	return router;
}
