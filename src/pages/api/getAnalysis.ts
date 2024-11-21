import type { APIRoute } from 'astro';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename');

    console.log('GetAnalysis called with filename:', filename);

    if (!filename) {
      return new Response(JSON.stringify({
        error: 'No filename provided'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Debug log environment variables
    console.log('Environment check:', {
      hasRegion: Boolean(process.env.FOREST_AI_AWS_REGION),
      hasAccessKeyId: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY_ID),
      hasSecretKey: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY)
    });

    // Validate AWS credentials
    if (!process.env.FOREST_AI_S3_ACCESS_KEY_ID || !process.env.FOREST_AI_S3_ACCESS_KEY) {
      throw new Error('AWS credentials not configured');
    }

    // Create S3 client
    const s3Client = new S3Client({
      region: process.env.FOREST_AI_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.FOREST_AI_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.FOREST_AI_S3_ACCESS_KEY
      }
    });

    // Get object from S3
    const command = new GetObjectCommand({
      Bucket: 'forest-fire-data-bucket',
      Key: filename
    });

    console.log('Attempting to fetch from S3:', {
      bucket: 'forest-fire-data-bucket',
      key: filename
    });

    try {
      const response = await s3Client.send(command);
      const htmlContent = await response.Body?.transformToString();

      if (!htmlContent) {
        throw new Error('No content found');
      }

      console.log('Successfully retrieved HTML content length:', htmlContent.length);

      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (s3Error: any) {
      if (s3Error.name === 'NoSuchKey') {
        return new Response(JSON.stringify({
          error: 'Analysis not ready yet'
        }), { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      throw s3Error;
    }

  } catch (error: any) {
    console.error('GetAnalysis error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch analysis: ' + (error.message || 'Unknown error'),
      details: {
        hasRegion: Boolean(process.env.FOREST_AI_AWS_REGION),
        hasAccessKeyId: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY_ID),
        hasSecretKey: Boolean(process.env.FOREST_AI_S3_ACCESS_KEY)
      }
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};