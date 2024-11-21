import type { APIRoute } from 'astro';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Debug logging
    console.log('Environment check:', {
      region: process.env.FOREST_AI_AWS_REGION,
      hasAccessKeyId: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY_ID),
      hasSecretKey: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY)
    });

    // Validate environment variables first
    if (!process.env.FOREST_AI_S3_ACCESS_KEY_ID) {
      throw new Error('AWS Access Key ID is missing');
    }
    if (!process.env.FOREST_AI_S3_ACCESS_KEY) {
      throw new Error('AWS Secret Access Key is missing');
    }
    if (!process.env.FOREST_AI_AWS_REGION) {
      throw new Error('AWS Region is missing');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({
        error: 'No file uploaded'
      }), { status: 400 });
    }

    // Create S3 client with custom environment variables
    const s3Client = new S3Client({
      region: process.env.FOREST_AI_AWS_REGION,
      credentials: {
        accessKeyId: process.env.FOREST_AI_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.FOREST_AI_S3_ACCESS_KEY
      }
    });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Upload to S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: 'forest-fire-data-bucket',
      Key: filename,
      Body: buffer,
      ContentType: file.type
    });

    await s3Client.send(command);

    return new Response(JSON.stringify({
      message: 'File uploaded successfully',
      filename: filename
    }), { status: 200 });

  } catch (error) {
    console.error('Upload error:', {
      message: error.message,
      env: {
        hasRegion: Boolean(process.env.FOREST_AI_AWS_REGION),
        hasAccessKeyId: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY_ID),
        hasSecretKey: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY)
      }
    });

    return new Response(JSON.stringify({
      error: 'Upload failed: ' + error.message,
      details: {
        hasRegion: Boolean(process.env.FOREST_AI_AWS_REGION),
        hasAccessKeyId: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY_ID),
        hasSecretKey: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY)
      }
    }), { status: 500 });
  }
};