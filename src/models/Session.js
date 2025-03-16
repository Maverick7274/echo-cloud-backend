// Define the schema for a user session using Mongoose
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    // The ID of the user initiating the session.
    // The refPath field dynamically references the user model defined in 'userModel'.
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },

    // The model name for the user (either 'User' or 'Admin').
    userModel: { type: String, required: true, enum: ['User', 'Admin'] },

    // The authentication token assigned to the session.
    token: { type: String, required: true },

    // IP address from which the session is initiated.
    ipAddress: { type: String, required: true },

    // User's geographical location; defaults to 'Unknown'.
    location: { type: String, default: 'Unknown' },

    // Browser or client information; defaults to 'Unknown'.
    userAgent: { type: String, default: 'Unknown' },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps.
    timestamps: true,
  }
);

// Export the Session model for use in other parts of the application
export default mongoose.model('Session', sessionSchema);
