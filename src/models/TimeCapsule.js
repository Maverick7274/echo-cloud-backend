import mongoose from "mongoose";

const mediaFileSchema = new mongoose.Schema(
	{
		url: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: ["video", "audio", "photo"],
			required: true,
		},
		fileName: {
			type: String,
			required: true,
		},
		fileSize: {
			type: Number,
			required: true,
		},
		mimeType: {
			type: String,
			required: true,
		},
	},
	{ _id: false }
);

const timeCapsuleSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Title is required"],
		},
		description: {
			type: String,
		},
		// Date when the capsule should be unlocked
		unlockDate: {
			type: Date,
			required: [true, "Unlock date is required"],
		},
		// Array of media files with metadata
		mediaFiles: [mediaFileSchema],
		// Privacy settings (default is private)
		isPrivate: {
			type: Boolean,
			default: true,
		},
		// Array of user IDs with whom the capsule is shared
		sharedWith: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		// The creator of the capsule
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Creator is required"],
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model("TimeCapsule", timeCapsuleSchema);
