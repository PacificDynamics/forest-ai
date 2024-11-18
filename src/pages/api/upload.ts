import type { APIRoute } from 'astro';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({
        error: 'No file uploaded'
      }), { status: 400 });
    }

    // Create S3 client with custom environment variables
    const s3Client = new S3Client({
      region: process.env.FOREST_AI_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.FOREST_AI_S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.FOREST_AI_S3_ACCESS_KEY || ''
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

    console.log('Uploading with credentials:', {
      hasAccessKey: !!process.env.FOREST_AI_S3_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.FOREST_AI_S3_ACCESS_KEY,
      region: process.env.FOREST_AI_AWS_REGION
    });

    await s3Client.send(command);

    return new Response(JSON.stringify({
      message: 'File uploaded successfully',
      filename: filename
    }), { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed: ' + (error.message || 'Unknown error'),
      details: {
        hasAccessKey: !!process.env.FOREST_AI_S3_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.FOREST_AI_S3_ACCESS_KEY,
        region: process.env.FOREST_AI_AWS_REGION
      }
    }), { status: 500 });
  }
};
