const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Lazy import to avoid requiring unused SDKs in some environments
let cloudinary;
let S3Client, PutObjectCommand;

function ensureCloudinary() {
  if (!cloudinary) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

function ensureS3() {
  if (!S3Client) {
    ({ S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'));
  }
}

async function uploadBufferToCloudinary(buffer, filename, folder) {
  ensureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: path.parse(filename).name, resource_type: 'auto' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, provider: 'cloudinary', key: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function uploadBufferToS3(buffer, filename, folder) {
  ensureS3();
  const Bucket = process.env.S3_BUCKET;
  if (!Bucket) throw new Error('S3_BUCKET not configured');
  const region = process.env.AWS_REGION || 'ap-south-1';
  const Key = `${folder || 'uploads'}/${uuidv4()}-${filename}`;
  const ContentType = guessContentType(filename);
  const s3 = new S3Client({ region, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
  await s3.send(new PutObjectCommand({ Bucket, Key, Body: buffer, ContentType, ACL: 'public-read' }));
  const url = `https://${Bucket}.s3.${region}.amazonaws.com/${Key}`;
  return { url, provider: 's3', key: Key };
}

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  return 'application/octet-stream';
}

/**
 * Upload a file buffer to the configured provider
 * env: UPLOAD_PROVIDER = 'cloudinary' | 's3'
 */
async function uploadFile({ buffer, originalname, folder = 'uploads' }) {
  const provider = (process.env.UPLOAD_PROVIDER || 'cloudinary').toLowerCase();
  if (provider === 's3') return uploadBufferToS3(buffer, originalname, folder);
  return uploadBufferToCloudinary(buffer, originalname, folder);
}

module.exports = { uploadFile };
