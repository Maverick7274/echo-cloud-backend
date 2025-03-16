// src/controllers/userController.js

import bcrypt from "bcryptjs";
import _ from "lodash";
import { z } from "zod";
import crypto from "crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";
import {
	generateUserToken,
	verifyUserToken,
} from "../services/tokenServices.js";
import { sendResponse, formatError } from "../utils/helpers.js";
import {
	sendUserVerificationEmail,
	sendUserTwoFactorOTPEmail,
} from "../services/emailService.js";
import logger from "../utils/logger.js";

// Schema for registering a new user (Route: POST /api/users/register)
const userRegisterSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	email: z.string().email({ message: "Invalid email format" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters long" }),
	confirmPassword: z.string().min(6, {
		message: "Confirm password must be at least 6 characters long",
	}),
	dateOfBirth: z.string().optional(),
	emergencyRecoveryContact: z.string().optional(),
});

// Schema for user login (Route: POST /api/users/login)
const userLoginSchema = z.object({
	email: z.string().email({ message: "Invalid email format" }),
	password: z.string().min(1, { message: "Password is required" }),
});

// Helper function to extract session details from the request
const getSessionData = (req, token) => ({
	ipAddress:
		req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown",
	location: "Unknown", // Optionally integrate geolocation here
	userAgent: req.headers["user-agent"] || "Unknown",
	token,
});

/**
 * Register a new user.
 * Route: POST /api/users/register
 * - Validates user input.
 * - Creates a new user, hashes the password.
 * - Generates an email verification token and sends a verification email.
 * - Creates a session record and sets a user token cookie.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const registerUser = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"email",
			"password",
			"confirmPassword",
			"dateOfBirth",
			"emergencyRecoveryContact",
		];
		const data = _.pick(req.body, allowedFields);

		// Validate input data
		const parsedData = userRegisterSchema.parse(data);

		// Ensure passwords match
		if (parsedData.password !== parsedData.confirmPassword) {
			logger.warn("Registration failed: Passwords do not match.");
			return sendResponse(
				res,
				400,
				false,
				null,
				"Passwords do not match"
			);
		}
		delete parsedData.confirmPassword;

		// Check for existing user by email
		let user = await User.findOne({ email: parsedData.email });
		if (user) {
			logger.warn(
				`Registration failed: ${parsedData.email} already exists.`
			);
			return sendResponse(res, 400, false, null, "User already exists");
		}

		// Hash the password before saving
		const salt = await bcrypt.genSalt(10);
		parsedData.password = await bcrypt.hash(parsedData.password, salt);

		// Create and save the user record
		user = await User.create(parsedData);

		// Generate email verification token and set expiration (24 hours)
		const verificationToken = crypto.randomBytes(20).toString("hex");
		user.emailVerificationToken = verificationToken;
		user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
		await user.save();
		await sendUserVerificationEmail(user.email, verificationToken);

		// Generate JWT token for immediate login
		const token = generateUserToken({
			id: user._id,
			email: user.email,
		});
		const cookieOptions = {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 1000, // 1 hour
		};
		res.cookie("user-token", token, cookieOptions);

		// Log session details for user
		await Session.create({
			user: user._id,
			userModel: "User",
			...getSessionData(req, token),
		});

		logger.info(`User registered: ${user._id}`);

		return sendResponse(
			res,
			201,
			true,
			_.pick(user, [
				"_id",
				"name",
				"email",
				"dateOfBirth",
				"emergencyRecoveryContact",
			]),
			"User registered successfully. Please verify your email."
		);
	} catch (err) {
		if (err instanceof z.ZodError) {
			logger.error("Validation error during registration.");
			return res
				.status(400)
				.json({ success: false, errors: formatError(err.errors) });
		}
		logger.error(`Error in registerUser: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * Log in a user.
 * Route: POST /api/users/login
 * - Validates credentials.
 * - Issues a 2FA OTP if enabled or generates a token and creates a session.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const loginUser = async (req, res) => {
	try {
		const credentials = _.pick(req.body, ["email", "password"]);
		const parsedCreds = userLoginSchema.parse(credentials);
		const user = await User.findOne({ email: parsedCreds.email });
		if (!user) {
			logger.warn(`Login failed: User ${parsedCreds.email} not found.`);
			return sendResponse(res, 401, false, null, "Invalid credentials");
		}
		const isMatch = await bcrypt.compare(
			parsedCreds.password,
			user.password
		);
		if (!isMatch) {
			logger.warn(
				`Login failed: Incorrect password for ${parsedCreds.email}.`
			);
			return sendResponse(res, 401, false, null, "Invalid credentials");
		}

		// If two-factor auth is enabled, send an OTP and halt further login processing
		if (user.twoFactorEnabled) {
			const otp = Math.floor(100000 + Math.random() * 900000).toString();
			user.twoFactorOTP = otp;
			user.twoFactorOTPExpires = Date.now() + 5 * 60 * 1000; // Expires in 5 minutes
			await user.save();
			await sendUserTwoFactorOTPEmail(user.email, otp);
			logger.info(`2FA OTP sent for user: ${user._id}`);
			return sendResponse(
				res,
				200,
				true,
				{ twoFactorRequired: true },
				"OTP sent, please verify your login via the two-factor endpoint."
			);
		}

		// Generate JWT token for login and set cookie
		const token = generateUserToken({ id: user._id, email: user.email });
		const cookieOptions = {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 1000,
		};
		res.cookie("user-token", token, cookieOptions);

		// Record session information
		await Session.create({
			user: user._id,
			userModel: "User",
			...getSessionData(req, token),
		});

		logger.info(`User logged in: ${user._id}`);
		return sendResponse(
			res,
			200,
			true,
			_.pick(user, [
				"_id",
				"name",
				"email",
				"dateOfBirth",
				"emergencyRecoveryContact",
			]),
			"Login successful"
		);
	} catch (err) {
		if (err instanceof z.ZodError) {
			logger.error("Validation error during login.");
			return res
				.status(400)
				.json({ success: false, errors: formatError(err.errors) });
		}
		logger.error(`Error in loginUser: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * Validate a user's token.
 * Route: GET /api/users/validate-token
 * - Checks for the token in cookies or Authorization header.
 * - Verifies and returns a response.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const validateUserToken = async (req, res) => {
	try {
		let token;
		if (req.cookies && req.cookies["user-token"]) {
			token = req.cookies["user-token"];
		} else if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer ")
		) {
			token = req.headers.authorization.split(" ")[1];
		}
		if (!token) {
			logger.warn("No token provided for validation.");
			return sendResponse(res, 401, false, null, "No token provided");
		}
		const decoded = verifyUserToken(token);
		if (!decoded) {
			logger.warn("Invalid token provided.");
			return sendResponse(res, 401, false, null, "Invalid token");
		}
		logger.info("User token validated successfully");

		return sendResponse(res, 200, true, { token }, "Token is valid");
	} catch (err) {
		logger.error(`Error in validateUserToken: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * Log out the current user.
 * Route: POST /api/users/logout
 * - Clears the user token cookie.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const logoutUser = async (req, res) => {
	try {
		res.clearCookie("user-token");
		logger.info(
			`User logged out: ${req.user ? req.user.id : "unknown user"}`
		);
		return sendResponse(res, 200, true, null, "Logged out successfully");
	} catch (err) {
		logger.error(`Error in logoutUser: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * Retrieve the user's profile.
 * Route: GET /api/users/profile
 * - Returns user information only if the email has been verified.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("-password");
		if (!user) {
			logger.warn(
				`Profile retrieval failed. User not found: ${req.user.id}`
			);
			return sendResponse(res, 404, false, null, "User not found");
		}
		if (!user.isVerified) {
			return sendResponse(
				res,
				403,
				false,
				null,
				"Your email is not verified. Please verify your email to access your profile."
			);
		}
		logger.info(`User profile retrieved: ${req.user.id}`);
		return sendResponse(res, 200, true, user, "User profile retrieved");
	} catch (err) {
		logger.error(`Error in getUserProfile: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * Update the user's profile.
 * Route: PUT /api/users/profile
 * - Allows updating of user data if email verified.
 * - Re-hashes password if it is updated.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const updateUserProfile = async (req, res) => {
	try {
		const existingUser = await User.findById(req.user.id);
		if (!existingUser) {
			logger.warn(`Update failed. User not found: ${req.user.id}`);
			return sendResponse(res, 404, false, null, "User not found");
		}
		if (!existingUser.isVerified) {
			return sendResponse(
				res,
				403,
				false,
				null,
				"Your email is not verified. Please verify your email to update your profile."
			);
		}

		const allowedFields = [
			"name",
			"email",
			"password",
			"dateOfBirth",
			"emergencyRecoveryContact",
		];
		const updateData = _.pick(req.body, allowedFields);

		// Hash new password if provided
		if (updateData.password) {
			const salt = await bcrypt.genSalt(10);
			updateData.password = await bcrypt.hash(updateData.password, salt);
		}

		const user = await User.findByIdAndUpdate(req.user.id, updateData, {
			new: true,
		});
		if (!user) {
			logger.warn(`Update failed. User not found: ${req.user.id}`);
			return sendResponse(res, 404, false, null, "User not found");
		}
		logger.info(`User profile updated: ${req.user.id}`);
		return sendResponse(
			res,
			200,
			true,
			_.pick(user, [
				"_id",
				"name",
				"email",
				"dateOfBirth",
				"emergencyRecoveryContact",
			]),
			"User profile updated successfully"
		);
	} catch (err) {
		logger.error(`Error in updateUserProfile: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

/**
 * Delete the user's account.
 * Route: DELETE /api/users/account
 * - Deletes the account only if the user's email is verified.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const deleteUserAccount = async (req, res) => {
	try {
		const existingUser = await User.findById(req.user.id);
		if (!existingUser) {
			logger.warn(`Deletion failed. User not found: ${req.user.id}`);
			return sendResponse(res, 404, false, null, "User not found");
		}
		if (!existingUser.isVerified) {
			return sendResponse(
				res,
				403,
				false,
				null,
				"Your email is not verified. Please verify your email to delete your account."
			);
		}
		await User.findByIdAndDelete(req.user.id);
		logger.info(`User account deleted: ${req.user.id}`);
		return sendResponse(
			res,
			200,
			true,
			null,
			"User account deleted successfully"
		);
	} catch (err) {
		logger.error(`Error in deleteUserAccount: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};
