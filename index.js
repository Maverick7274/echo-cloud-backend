// index.js
import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import logger from "./src/utils/logger.js";

const SERVER_PORT = process.env.SERVER_PORT || 4001;

// Connect to MongoDB
connectDB();

const server = app.listen(SERVER_PORT, () => {
	logger.info(
		`Server is running on http://localhost:${SERVER_PORT} in ${process.env.ENVIRONMENT} mode`
	);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	logger.error(`Uncaught Exception: ${err.message}`);
	process.exit(1);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
	logger.error(`Unhandled Rejection: ${err.message}`);
	server.close(() => {
		process.exit(1);
	});
});
