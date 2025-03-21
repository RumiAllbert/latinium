# Netlify Functions for Latinium

This directory contains serverless functions used by the Latinium application when deployed to Netlify.

## Overview

These functions handle server-side operations that can't be performed in a static site, primarily the Latin text analysis functionality using Google's Gemini API.

## Function Details

- **analyze.ts**: Handles Latin text analysis using the Gemini API
- **types.ts**: Shared TypeScript types for the API
- **cache.ts**: In-memory caching system for API responses

## Configuration

The functions are configured in the root `netlify.toml` file, which sets up:

1. The functions directory location
2. Redirects from `/api/analyze` to `/.netlify/functions/analyze`
3. Fallback redirects for SPA routing

## Environment Variables

These functions require the following environment variables to be set in the Netlify deployment:

- `GEMINI_API_KEY`: Your Google Gemini API key

## Local Development

To test these functions locally:

1. Install the Netlify CLI: `npm install -g netlify-cli`
2. Run the development server: `netlify dev`

## Deployment

These functions are automatically deployed when you deploy the site to Netlify. Make sure to set required environment variables in the Netlify dashboard.

## Notes

- The functions use simple in-memory caching to reduce API calls
- Rate limiting is implemented to prevent excessive API usage
- Error handling includes user-friendly messages and fallback mechanisms 