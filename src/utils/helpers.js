import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: false, // upgrade later with STARTTLS if needed
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

export const sendEmail = async (to, subject, text, html) => {
	try {
		const info = await transporter.sendMail({
			from: process.env.SMTP_USER,
			to,
			subject,
			text,
			html,
		});
		return info;
	} catch (error) {
		throw error;
	}
};

export const buildQuery = (queryParams) => {
	const filter = {};
	if (queryParams.name) {
		filter.name = { $regex: queryParams.name, $options: "i" };
	}
	if (queryParams.sick) {
		filter.sicknessStatus = queryParams.sick === "true";
	}
	if (queryParams.old) {
		filter.agedStatus = queryParams.old === "true";
	}
	if (queryParams.adopted) {
		filter.adoptionStatus = queryParams.adopted === "true";
	}
	return filter;
};



/**
 * helpers.js
 *
 * This file contains helper functions for the SSO Authentication Server.
 * These functions are used in various route handlers (e.g., /api/auth/login) to
 * send standardized responses and to format error messages.
 */

/**
 * Sends a standardized JSON response.
 *
 * @param {Object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {boolean} success - Indicates if the request succeeded.
 * @param {any} [data=null] - Payload data to send.
 * @param {string} [message=""] - Optional message to include.
 * @returns {Object} JSON response.
 */
export const sendResponse = (
	res,
	statusCode,
	success,
	data = null,
	message = ""
) => {
	return res.status(statusCode).json({ success, data, message });
};

/**
 * Formats an array of error objects into a standardized structure.
 *
 * @param {Array} errors - Array of error objects (each should have 'path' and 'message' properties).
 * @returns {Array} Array of formatted error objects with 'field' and 'message'.
 */
export const formatError = (errors) => {
	return errors.map((err) => ({ field: err.path, message: err.message }));
};
