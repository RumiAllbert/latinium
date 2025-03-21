import type { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // Check if Netlify Functions are working
  const environment = {
    NODE_ENV: process.env.NODE_ENV,
    // Check if GEMINI_API_KEY exists (without revealing it)
    GEMINI_API_KEY_EXISTS: process.env.GEMINI_API_KEY ? 'Yes' : 'No',
    // Add other relevant environment info
    NETLIFY: process.env.NETLIFY,
    CONTEXT: process.env.CONTEXT, // development, production, etc.
    DEPLOY_URL: process.env.DEPLOY_URL,
    // Include build info
    COMMIT_REF: process.env.COMMIT_REF,
    BRANCH: process.env.BRANCH,
    // System info
    NODE_VERSION: process.version,
    // Request info
    REQUEST_METHOD: event.httpMethod,
    PATH: event.path,
    HEADERS: Object.keys(event.headers),
  };

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Netlify Functions are working correctly',
      environment,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
};

export { handler };
