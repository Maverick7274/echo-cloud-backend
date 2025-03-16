// src/services/tokenServices.js

import jwt from "jsonwebtoken";

/**
 * Generates a JSON Web Token for an administrator.
 *
 * This function creates a JWT using the provided payload, signed with the ADMIN_JWT_SECRET.
 * The token is set to expire after 1 hour.
 *
 * @param {Object} payload - The data to be included in the token.
 * @returns {string} - The signed JWT.
 *
 * Route Example:
 * POST /api/admin/login (where token creation might be required)
 */
export const generateAdminToken = (payload) => {
	return jwt.sign(payload, process.env.ADMIN_JWT_SECRET, { expiresIn: "1h" });
};

/**
 * Verifies the validity of an administrator's JSON Web Token.
 *
 * This function attempts to decode and verify the token using the ADMIN_JWT_SECRET.
 * If the token is valid, the decoded payload is returned; otherwise, it returns null.
 *
 * @param {string} token - The JWT to be verified.
 * @returns {(Object|null)} - The decoded token payload if valid, otherwise null.
 *
 * Route Example:
 * GET /api/admin/dashboard (where token verification is needed)
 */
export const verifyAdminToken = (token) => {
	try {
		return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
	} catch (error) {
		return null;
	}
};

/**
 * Generates a JSON Web Token for a user.
 *
 * The function creates a JWT from the provided payload, using the USER_JWT_SECRET for signing.
 * The token remains valid for 1 hour.
 *
 * @param {Object} payload - The data to include in the token.
 * @returns {string} - The signed JWT.
 *
 * Route Example:
 * POST /api/user/login (where token generation is necessary)
 */
export const generateUserToken = (payload) => {
	return jwt.sign(payload, process.env.USER_JWT_SECRET, { expiresIn: "1h" });
};

/**
 * Verifies a user's JSON Web Token.
 *
 * This function verifies the token using the USER_JWT_SECRET to ensure it is valid.
 * If verification succeeds, the decoded token payload is returned. In case of failure, null is returned.
 *
 * @param {string} token - The JWT to be checked.
 * @returns {(Object|null)} - The decoded payload on success, or null if invalid.
 *
 * Route Example:
 * GET /api/user/profile (where token verification is implemented)
 */
export const verifyUserToken = (token) => {
	try {
		return jwt.verify(token, process.env.USER_JWT_SECRET);
	} catch (error) {
		return null;
	}
};
