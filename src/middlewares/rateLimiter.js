// src/middlewares/rateLimiter.js

// Import the express-rate-limit library to set up rate limiting middleware
import rateLimit from "express-rate-limit";

/*
 * Middleware: loginLimiter
 * Purpose: Protect the login route from brute-force attacks by limiting repeated requests.
 * Configuration:
 *   windowMs: Time frame for which requests are checked (15 minutes).
 *   max: Maximum number of requests per IP within the time window (10 requests).
 *   message: Response message sent when limit is exceeded.
 *
 * Usage:
 *   Apply this middleware to the login route in your Express app, e.g.,
 *   app.post('/login', loginLimiter, loginHandler);
 */
export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes time window
	max: 10, // Limit each IP to 10 login requests per window
	message: "Too many login attempts from this IP, please try again after 15 minutes",
});
