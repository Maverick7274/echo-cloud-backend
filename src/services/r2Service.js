// src/services/r2Service.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const s3Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT, // Cloudflare R2 endpoint
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

/**
 * Uploads a file buffer to Cloudflare R2.
 *
 * @param {Buffer} fileBuffer - The file data as a buffer.
 * @param {string} fileName - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} - Returns the public URL of the uploaded file.
 */
export const uploadFileToR2 = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: process.env.R2_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read', // Adjust ACL if needed
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  // Construct the public URL (adjust as per your R2 configuration)
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};
