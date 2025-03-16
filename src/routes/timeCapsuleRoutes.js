import { Router } from "express";
import {
	createCapsule,
	getAllCapsules,
	getCapsuleById,
	updateCapsule,
	deleteCapsule,
} from "../controllers/timeCapsuleController.js";
import { userProtect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

export default function timeCapsuleRoutes(version) {
	const router = Router();

	// Create a new Time Capsule (use upload.array for multiple media files)
	router.post(
		`/api/v${version}/capsules`,
		userProtect,
		upload.array("mediaFiles"),
		createCapsule
	);

	// Retrieve all Time Capsules for the authenticated user
	router.get(`/api/v${version}/capsules`, userProtect, getAllCapsules);

	// Retrieve a specific Time Capsule by ID
	router.get(`/api/v${version}/capsules/:id`, userProtect, getCapsuleById);

	// Update a Time Capsule by ID (allowing new file uploads)
	router.put(
		`/api/v${version}/capsules/:id`,
		userProtect,
		upload.array("mediaFiles"),
		updateCapsule
	);

	// Delete a Time Capsule by ID
	router.delete(`/api/v${version}/capsules/:id`, userProtect, deleteCapsule);

	return router;
}
