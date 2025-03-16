// models/Admin.js
import mongoose from "mongoose";

// Define the Admin schema for the "admins" collection in MongoDB
const adminSchema = new mongoose.Schema(
	{
		// Admin's full name
		name: {
			type: String,
			required: [true, "Name is required"],
		},
		// Unique email address used for admin login; must end with @echocloud.live
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			// You could also add a regex validation here if needed.
		},
		// Admin's hashed password
		password: {
			type: String,
			required: [true, "Password is required"],
		},
		// Admin's date of birth (optional)
		dateOfBirth: {
			type: Date,
		},
		// Email verification properties
		isVerified: {
			type: Boolean,
			default: false,
		},
		emailVerificationToken: {
			type: String,
		},
		emailVerificationExpires: {
			type: Date,
		},
		// Password reset properties
		forgotPasswordToken: {
			type: String,
		},
		forgotPasswordExpires: {
			type: Date,
		},
		// Two-factor authentication properties
		twoFactorEnabled: {
			type: Boolean,
			default: false,
		},
		twoFactorOTP: {
			type: String,
		},
		twoFactorOTPExpires: {
			type: Date,
		},
	},
	{
		// Automatically manage createdAt and updatedAt timestamps and specify collection name
		timestamps: true,
		collection: "admins",
	}
);

// Export the Admin model to be used in controllers and route handlers
export default mongoose.model("Admin", adminSchema);
