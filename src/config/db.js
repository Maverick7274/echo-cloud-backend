import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 *
 * This asynchronous function determines the correct MongoDB URI based on the current environment:
 * - If the environment is "Development", it directly uses the value of `process.env.MONGO_URI`.
 * - Otherwise, it assumes a production environment and appends "/production" to the URI.
 *
 * Upon a successful connection, it logs the connected host. If an error occurs during
 * the connection process, it logs the error message and exits the process.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when the connection is successful, otherwise the process exits.
 */
export default async function connectDB() {
	try {
		const conn = await mongoose.connect(
			process.env.ENVIRONMENT === "Development"
				? process.env.MONGO_URI
				: `${process.env.MONGO_URI}/production`
		);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Error connecting to MongoDB: ${error.message}`);
		process.exit(1);
	}
}
