const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');
const config = require('../config/environment');

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.bucketName = config.aws.s3Bucket;
  }

  // Upload file to S3
  async uploadFile(file, folder = 'uploads') {
    try {
      const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private', // Private by default for security
        Metadata: {
          originalName: file.originalname,
          uploadedBy: file.userId || 'unknown',
          uploadDate: new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      return {
        key,
        url: `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  // Generate signed URL for private file access
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new Error('Failed to generate access URL');
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from cloud storage');
    }
  }

  // Process and optimize images before upload
  async processImage(buffer, options = {}) {
    try {
      const {
        width = 800,
        height = 800,
        quality = 80,
        format = 'jpeg'
      } = options;

      let processedImage = sharp(buffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality });

      if (format === 'webp') {
        processedImage = sharp(buffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality });
      }

      return await processedImage.toBuffer();
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }
}

module.exports = new S3Service();
