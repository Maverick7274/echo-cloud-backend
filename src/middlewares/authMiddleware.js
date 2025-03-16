// src/middlewares/authMiddleware.js
// Middleware to protect routes that require admin authentication.
// It checks for an admin token in cookies or in the Authorization header and verifies it.
import {
	verifyAdminToken,
	verifyUserToken,
} from "../services/tokenServices.js";

/**
 * Middleware to protect admin routes.
 * Checks for an admin token from cookies ("admin-token") or Authorization header.
 * If token exists and is verified, attaches decoded token data to req.admin.
 * Use on routes that require admin level access (e.g., /admin/dashboard).
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const adminProtect = (req, res, next) => {
	let token;
	// Check for token in cookies or Authorization header
	if (req.cookies && req.cookies["admin-token"]) {
		token = req.cookies["admin-token"];
	} else if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer ")
	) {
		token = req.headers.authorization.split(" ")[1];
	}
	if (!token) {
		return res
			.status(401)
			.json({ success: false, message: "No admin token provided" });
	}
	// Validate the admin token
	const decoded = verifyAdminToken(token);
	if (!decoded) {
		return res
			.status(401)
			.json({ success: false, message: "Invalid admin token" });
	}
	// Attach decoded data to request and proceed
	req.admin = decoded;
	next();
};

/**
 * Middleware to protect user routes.
 * Checks for a user token from cookies ("user-token") or Authorization header.
 * If token exists and is verified, attaches decoded token data to req.user.
 * Use on routes that require user authentication (e.g., /profile, /orders).
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const userProtect = (req, res, next) => {
	let token;
	// Check for token in cookies or Authorization header
	if (req.cookies && req.cookies["user-token"]) {
		token = req.cookies["user-token"];
	} else if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer ")
	) {
		token = req.headers.authorization.split(" ")[1];
	}
	if (!token) {
		return res
			.status(401)
			.json({ success: false, message: "No user token provided" });
	}
	// Validate the user token
	const decoded = verifyUserToken(token);
	if (!decoded) {
		return res
			.status(401)
			.json({ success: false, message: "Invalid user token" });
	}
	// Attach decoded data to request and proceed
	req.user = decoded;
	next();
};
