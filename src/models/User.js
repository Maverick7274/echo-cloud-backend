import mongoose from "mongoose";

// Define a schema for the User model using Mongoose
const userSchema = new mongoose.Schema(
	{
		// User's full name (required)
		name: {
			type: String,
			required: [true, "Name is required"],
		},
		// User's email (required, unique, stored in lowercase, and trimmed)
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		// User's password (required)
		password: {
			type: String,
			required: [true, "Password is required"],
		},
		// User's date of birth (optional)
		dateOfBirth: {
			type: Date,
		},
		// Timestamp indicating when the user was last active (optional)
		lastActive: {
			type: Date,
		},
		// Emergency recovery contact for account recovery (optional)
		emergencyRecoveryContact: {
			type: String,
		},
		// Flag indicating if the user's email is verified (default: false)
		isVerified: {
			type: Boolean,
			default: false,
		},
		// Token used for email verification
		emailVerificationToken: String,
		// Expiration date for the email verification token
		emailVerificationExpires: Date,
		// Token used for password reset requests
		forgotPasswordToken: String,
		// Expiration date for the password reset token
		forgotPasswordExpires: Date,
		// Flag indicating if two-factor authentication is enabled (default: false)
		twoFactorEnabled: {
			type: Boolean,
			default: false,
		},
		// One-time password generated for two-factor authentication
		twoFactorOTP: String,
		// Expiration date for the two-factor authentication OTP
		twoFactorOTPExpires: Date,
	},
	{
		// Enable automatic creation of createdAt and updatedAt timestamps and explicitly set the collection name
		timestamps: true,
		collection: "users",
	}
);

// Export the User model for use in routes and other parts of the application
export default mongoose.model("User", userSchema);
