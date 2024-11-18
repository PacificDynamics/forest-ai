import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    hasAccessKey: !!process.env.FOREST_AI_S3_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.FOREST_AI_S3_ACCESS_KEY,
    region: process.env.FOREST_AI_AWS_REGION
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
