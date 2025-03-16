import { Router } from "express";
import {
	registerAdmin,
	loginAdmin,
	validateAdminToken,
	logoutAdmin,
	getAdminProfile,
	updateAdminProfile,
	deleteAdminAccount,
} from "../controllers/adminController.js";
import { loginLimiter } from "../middlewares/rateLimiter.js";
import { adminProtect } from "../middlewares/authMiddleware.js";

export default function adminRoutes(version) {
	const router = Router();

	// Route: POST /api/v{version}/admin/register
	// Description: Registers a new admin account.
	router.post(`/api/v${version}/admin/register`, registerAdmin);

	// Route: POST /api/v{version}/admin/login
	// Description: Authenticates an admin. Includes login rate limiting.
	router.post(`/api/v${version}/admin/login`, loginLimiter, loginAdmin);

	// Route: GET /api/v{version}/admin/validate-token
	// Description: Validates the admin's authentication token.
	router.get(`/api/v${version}/admin/validate-token`, validateAdminToken);

	// Route: POST /api/v{version}/admin/logout
	// Description: Logs out the authenticated admin.
	router.post(`/api/v${version}/admin/logout`, logoutAdmin);

	// Route: GET /api/v{version}/admin/profile
	// Description: Retrieves the profile of the authenticated admin.
	router.get(`/api/v${version}/admin/profile`, adminProtect, getAdminProfile);

	// Route: PUT /api/v{version}/admin/update-profile
	// Description: Updates the profile details of the authenticated admin.
	router.put(
		`/api/v${version}/admin/update-profile`,
		adminProtect,
		updateAdminProfile
	);

	// Route: DELETE /api/v{version}/admin/delete-account
	// Description: Deletes the authenticated admin's account.
	router.delete(
		`/api/v${version}/admin/delete-account`,
		adminProtect,
		deleteAdminAccount
	);

	return router;
}
