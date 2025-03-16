import TimeCapsule from "../models/TimeCapsule.js";
import { z } from "zod";
import logger from "../utils/logger.js";
import { sendResponse, formatError } from "../utils/helpers.js";
import { uploadFileToR2 } from "../services/r2Service.js";

// Schema for creating a Time Capsule (without media files)
const createCapsuleSchema = z.object({
	title: z.string().min(1, { message: "Title is required" }),
	description: z.string().optional(),
	unlockDate: z
		.string()
		.min(1, { message: "Unlock date is required" })
		.refine((val) => !isNaN(Date.parse(val)), {
			message: "Unlock date must be a valid date in YYYY-MM-DD format",
		}),
	isPrivate: z
		.preprocess((val) => {
			if (typeof val === "string") return val === "true";
			return val;
		}, z.boolean())
		.optional(),
	sharedWith: z.array(z.string()).optional(),
});

// Schema for updating an existing Time Capsule
const updateCapsuleSchema = z.object({
	title: z.string().min(1).optional(),
	description: z.string().optional(),
	unlockDate: z.string().optional(),
	// Validate mediaFiles if provided
	mediaFiles: z
		.array(
			z.object({
				url: z.string().url(),
				type: z.enum(["photo", "video", "audio"]), // Ensure enum matches your logic
				fileName: z.string(),
				fileSize: z.number(),
				mimeType: z.string(),
			})
		)
		.optional(),
	isPrivate: z
		.preprocess((val) => {
			if (typeof val === "string") return val === "true";
			return val;
		}, z.boolean())
		.optional(),
	sharedWith: z.array(z.string()).optional(),
});

// Create a new Time Capsule
export const createCapsule = async (req, res) => {
	try {
		const parsedData = createCapsuleSchema.parse(req.body);
		parsedData.unlockDate = new Date(parsedData.unlockDate);
		parsedData.createdBy = req.user.id;
		parsedData.mediaFiles = []; // initialize empty array
		console.log(parsedData);

		// Process uploaded files (if any)
		if (req.files && req.files.length > 0) {
			console.log("level 2");
			for (const file of req.files) {
				let fileType = "";
				if (file.mimetype.startsWith("video/")) {
					fileType = "video";
				} else if (file.mimetype.startsWith("audio/")) {
					fileType = "audio";
				} else if (file.mimetype.startsWith("image/")) {
					fileType = "photo";
				} else {
					// Skip unsupported file types
					continue;
				}
				// Upload file buffer to Cloudflare R2
				const publicUrl = await uploadFileToR2(
					file.buffer,
					file.originalname,
					file.mimetype
				);
				parsedData.mediaFiles.push({
					url: publicUrl,
					type: fileType,
					fileName: file.originalname,
					fileSize: file.size,
					mimeType: file.mimetype,
				});
			}
		}

		const capsule = await TimeCapsule.create(parsedData);
		console.log("level 4");
		logger.info(
			`Time Capsule created: ${capsule._id} by user ${req.user.id}`
		);
		return sendResponse(
			res,
			201,
			true,
			capsule,
			"Time Capsule created successfully"
		);
	} catch (err) {
		if (err instanceof z.ZodError) {
			// Log the detailed validation errors to debug exactly which field is failing
			logger.error(
				"Validation error while creating Time Capsule:",
				err.errors
			);
			return res
				.status(400)
				.json({ success: false, errors: formatError(err.errors) });
		}
		logger.error(`Error in createCapsule: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

// Get all Time Capsules for the authenticated user
export const getAllCapsules = async (req, res) => {
	try {
		const capsules = await TimeCapsule.find({ createdBy: req.user.id });
		logger.info(
			`Retrieved ${capsules.length} Time Capsules for user ${req.user.id}`
		);
		return sendResponse(
			res,
			200,
			true,
			capsules,
			"Time Capsules retrieved successfully"
		);
	} catch (err) {
		logger.error(`Error in getAllCapsules: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

// Get a single Time Capsule by its ID
export const getCapsuleById = async (req, res) => {
	try {
		const { id } = req.params;
		const capsule = await TimeCapsule.findById(id);
		if (!capsule) {
			logger.warn(`Time Capsule not found: ${id}`);
			return sendResponse(
				res,
				404,
				false,
				null,
				"Time Capsule not found"
			);
		}
		// Ensure that the capsule belongs to the authenticated user
		if (capsule.createdBy.toString() !== req.user.id) {
			logger.warn(`Unauthorized access to Time Capsule: ${id}`);
			return sendResponse(res, 403, false, null, "Unauthorized access");
		}
		return sendResponse(
			res,
			200,
			true,
			capsule,
			"Time Capsule retrieved successfully"
		);
	} catch (err) {
		logger.error(`Error in getCapsuleById: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

// Update a Time Capsule by its ID
// Update a Time Capsule and optionally process new file uploads
export const updateCapsule = async (req, res) => {
	try {
		const { id } = req.params;
		// Use updateCapsuleSchema (which already makes fields optional)
		console.log("req.body:", req.body); // Debug log to check incoming body
		const parsedData = updateCapsuleSchema.parse(req.body);
		if (parsedData.unlockDate) {
			parsedData.unlockDate = new Date(parsedData.unlockDate);
		}
		const capsule = await TimeCapsule.findById(id);
		if (!capsule) {
			logger.warn(`Time Capsule not found: ${id}`);
			return sendResponse(
				res,
				404,
				false,
				null,
				"Time Capsule not found"
			);
		}
		if (capsule.createdBy.toString() !== req.user.id) {
			logger.warn(`Unauthorized update attempt for Time Capsule: ${id}`);
			return sendResponse(res, 403, false, null, "Unauthorized access");
		}

		// If files are uploaded, process and append them to the mediaFiles array
		if (req.files && req.files.length > 0) {
			// Use existing mediaFiles if any, otherwise initialize as an empty array
			parsedData.mediaFiles = capsule.mediaFiles || [];
			for (const file of req.files) {
				let fileType = "";
				if (file.mimetype.startsWith("video/")) {
					fileType = "video";
				} else if (file.mimetype.startsWith("audio/")) {
					fileType = "audio";
				} else if (file.mimetype.startsWith("image/")) {
					fileType = "photo";
				} else {
					continue;
				}
				const publicUrl = await uploadFileToR2(
					file.buffer,
					file.originalname,
					file.mimetype
				);
				parsedData.mediaFiles.push({
					url: publicUrl,
					type: fileType,
					fileName: file.originalname,
					fileSize: file.size,
					mimeType: file.mimetype,
				});
			}
		}

		const updatedCapsule = await TimeCapsule.findByIdAndUpdate(
			id,
			parsedData,
			{
				new: true,
			}
		);
		logger.info(`Time Capsule updated: ${id} by user ${req.user.id}`);
		return sendResponse(
			res,
			200,
			true,
			updatedCapsule,
			"Time Capsule updated successfully"
		);
	} catch (err) {
		if (err instanceof z.ZodError) {
			logger.error("Validation error while updating Time Capsule");
			return res
				.status(400)
				.json({ success: false, errors: formatError(err.errors) });
		}
		logger.error(`Error in updateCapsule: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};

// Delete a Time Capsule by its ID
export const deleteCapsule = async (req, res) => {
	try {
		const { id } = req.params;
		const capsule = await TimeCapsule.findById(id);
		if (!capsule) {
			logger.warn(`Time Capsule not found: ${id}`);
			return sendResponse(
				res,
				404,
				false,
				null,
				"Time Capsule not found"
			);
		}
		if (capsule.createdBy.toString() !== req.user.id) {
			logger.warn(`Unauthorized delete attempt for Time Capsule: ${id}`);
			return sendResponse(res, 403, false, null, "Unauthorized access");
		}
		await TimeCapsule.findByIdAndDelete(id);
		logger.info(`Time Capsule deleted: ${id} by user ${req.user.id}`);
		return sendResponse(
			res,
			200,
			true,
			null,
			"Time Capsule deleted successfully"
		);
	} catch (err) {
		logger.error(`Error in deleteCapsule: ${err.message}`);
		return sendResponse(res, 500, false, null, "Server error");
	}
};
