import type { APIRoute } from 'astro';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-providers';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({
        error: 'No file uploaded'
      }), { status: 400 });
    }

    // Create S3 client with specific profile
    const s3Client = new S3Client({
      region: 'us-east-1',
      credentials: fromIni({ profile: 'my-profile' }) // Use my-profile credentials
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
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed: ' + (error.message || 'Unknown error')
    }), { status: 500 });
  }
};
