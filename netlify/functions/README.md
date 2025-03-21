# Netlify Functions for Latinium

This directory contains serverless functions used by the Latinium application when deployed to Netlify.

## Overview

These functions handle server-side operations that can't be performed in a static site, primarily the Latin text analysis functionality using Google's Gemini API.

## Function Details

- **analyze.ts**: Handles Latin text analysis using the Gemini API
- **types.ts**: Shared TypeScript types for the API
- **cache.ts**: In-memory caching system for API responses
- **diagnosis.ts**: Diagnostic utility to verify function configuration
- **hello.js**: Simple test function to verify the functions infrastructure

## Configuration

The functions are configured in the root `netlify.toml` file, which sets up:

1. The functions directory location
2. Redirects from `/api/analyze` to `/.netlify/functions/analyze`
3. Fallback redirects for SPA routing
4. Extended timeout (30 seconds) for the analyze function
5. Node.js version requirement

## Performance Optimizations

- **Caching**: Responses are cached to reduce API calls for repeated texts
- **Text Truncation**: Long texts in streaming mode are automatically shortened
- **Timeout Handling**: Custom timeout management for API calls
- **Model Configuration**: Using the faster Gemini 1.5 Flash model with optimized parameters
- **Error Recovery**: Automatic fallback to non-streaming for complex requests

## Environment Variables

These functions require the following environment variables to be set in the Netlify deployment:

- `GEMINI_API_KEY`: Your Google Gemini API key

## Local Development

To test these functions locally:

1. Install the Netlify CLI: `npm install -g netlify-cli`
2. Run the development server: `netlify dev`

## Deployment

These functions are automatically deployed when you deploy the site to Netlify. Make sure to set required environment variables in the Netlify dashboard.

## Troubleshooting

If you encounter timeouts or errors:
1. Check the Netlify function logs in the Netlify dashboard
2. Try the diagnostic functions at `/test-functions.html`
3. For long texts, consider using non-streaming mode
4. Verify your Gemini API key has sufficient quota 