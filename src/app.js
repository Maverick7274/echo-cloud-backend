// src/app.js

// Import external modules
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";

// Import route modules which provide user and admin API endpoints
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userExtraRoutes from "./routes/userExtraRoutes.js";
import adminExtraRoutes from "./routes/adminExtraRoutes.js";
import timeCapsuleRoutes from "./routes/timeCapsuleRoutes.js";


// Load environment variables from .env file
dotenv.config();

const app = express();

// Set up basic configuration with defaults:
// CLIENT_PORT for client origin, and API_VERSION for route versioning.

const API_VERSION = process.env.API_VERSION || "1";

// Enable CORS for requests from the client origin, allowing credentials.
const allowedOrigins = process.env.CLIENT_URL.split(',').map(url => url.trim());
app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl)
			if (!origin) return callback(null, true);
			if (allowedOrigins.indexOf(origin) !== -1) {
				return callback(null, true);
			} else {
				return callback(new Error('Not allowed by CORS'), false);
			}
		},
		credentials: true,
	})
);

// Secure HTTP headers with Helmet.
app.use(helmet());

// Log incoming HTTP requests for debugging and monitoring with Morgan.
app.use(morgan("combined"));

// Parse JSON payloads, URL-encoded form data, and cookies.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Mount routes with dynamic API versioning.
// User Routes: typically include login, registration etc.
// The actual base path is defined within the userRoutes module.
app.use(userRoutes(API_VERSION));

// Admin Routes: handle administrative functions.
// The route prefix is dynamically added inside the adminRoutes module.
app.use(adminRoutes(API_VERSION));

// Additional User Routes: supplementary endpoints for user-related operations.
app.use(userExtraRoutes(API_VERSION));

// Additional Admin Routes: supplementary endpoints for admin-specific operations.
app.use(adminExtraRoutes(API_VERSION));
app.use(timeCapsuleRoutes(API_VERSION));


// Health Check Route:
// GET / returns a simple message to verify that the server is running.
app.get("/", (req, res) => {
	res.send("Welcome to the Authentication API");
});

export default app;
