import { Router } from "express";
import {
	registerUser,
	loginUser,
	validateUserToken,
	logoutUser,
	getUserProfile,
	updateUserProfile,
	deleteUserAccount,
} from "../controllers/userController.js";
import { loginLimiter } from "../middlewares/rateLimiter.js";
import { userProtect } from "../middlewares/authMiddleware.js";

export default function userRoutes(version) {
	const router = Router();

	// Registers a new user
	// POST /api/v{version}/auth/register
	router.post(`/api/v${version}/user/register`, registerUser);

	// Logs in a user with rate limiting applied
	// POST /api/v{version}/user/login
	router.post(`/api/v${version}/user/login`, loginLimiter, loginUser);

	// Validates the user's token to ensure authentication validity
	// GET /api/v{version}/user/validate-token
	router.get(`/api/v${version}/user/validate-token`, validateUserToken);

	// Logs out the currently authenticated user
	// POST /api/v{version}/user/logout
	router.post(`/api/v${version}/user/logout`, logoutUser);

	// Retrieves the profile for the authenticated user
	// GET /api/v{version}/user/profile
	router.get(`/api/v${version}/user/profile`, userProtect, getUserProfile);

	// Updates the profile of the currently authenticated user
	// PUT /api/v{version}/user/update-profile
	router.put(
		`/api/v${version}/user/update-profile`,
		userProtect,
		updateUserProfile
	);

	// Deletes the account of the authenticated user
	// DELETE /api/v${version}/user/delete-account
	router.delete(
		`/api/v${version}/user/delete-account`,
		userProtect,
		deleteUserAccount
	);

	return router;
}
