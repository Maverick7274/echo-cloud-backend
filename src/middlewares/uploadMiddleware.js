// src/middlewares/uploadMiddleware.js
import multer from 'multer';

// Use memory storage so that we can directly pass the file buffer to R2
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
