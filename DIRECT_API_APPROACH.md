# Direct Gemini API Integration for Latinium

This document explains how to use Google's Gemini API directly from the client-side application, avoiding the need for Netlify Functions entirely.

## Why Direct Integration?

Netlify Functions can be challenging to work with for AI applications because:

1. **Timeouts**: Netlify Functions have a 10-second timeout by default (up to 30s max)
2. **Cold starts**: Serverless functions need to "wake up" when not used frequently
3. **Complexity**: Adds unnecessary complexity to the application architecture
4. **Debugging**: More difficult to debug issues that occur in the serverless environment

## Direct Client-Side Integration Benefits

Using the Gemini API directly from the client offers several advantages:

1. **Simplicity**: No server-side code or functions to manage
2. **Performance**: Remove the middleman - direct communication between client and Google API
3. **Reliability**: Avoid Netlify Function timeouts and cold starts
4. **Easier maintenance**: One less component in your architecture
5. **Better debugging**: All code runs in the browser where you can easily debug

## Implementation Steps

### 1. Install the Gemini JavaScript SDK

```bash
npm install @google/generative-ai
```

### 2. Set up your API key in environment variables

In your `.env` file:
```
PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Ensure your `astro.config.mjs` makes this available to the client:
```javascript
vite: {
  define: {
    'import.meta.env.PUBLIC_GEMINI_API_KEY': JSON.stringify(envVars.GEMINI_API_KEY || ''),
  },
},
```

### 3. Create a direct Gemini API client

See the implementation in `src/utils/directGeminiApi.ts` - this handles:
- Direct communication with Gemini API
- Streaming capabilities
- Error handling and fallbacks
- Text truncation for faster responses

### 4. Use the direct client in your application

```typescript
import { analyzeLatin } from "../utils/directGeminiApi";

// Regular request
const { result, isMockData } = await analyzeLatin("Gallia est omnis divisa in partes tres.");

// Streaming request
const { result, isMockData } = await analyzeLatin("Puella bona est", {
  stream: true,
  onStreamChunk: (chunk) => {
    console.log("Received chunk:", chunk);
  }
});
```

## CORS Considerations

A key advantage of the direct approach is that CORS is handled automatically:

1. **No CORS issues**: Since the Gemini API allows browser requests directly, you won't encounter CORS errors that might occur with custom backend APIs
2. **Google's API policies**: Google has configured their API endpoints to allow client-side requests with proper authentication
3. **No proxy needed**: Unlike some APIs that require server-side proxying due to CORS restrictions, Gemini works directly from the browser

The Google Generative AI SDK is specifically designed to work from browser environments, making this approach viable without CORS concerns.

## Important Security Considerations

When exposing API keys to the client:

1. **API Key Restrictions**: 
   - Set up application restrictions in the Google Cloud Console
   - Restrict the key to your specific domain origins
   - Enable usage limits to prevent unexpected charges

2. **Client-Side Safety**:
   - Use the `PUBLIC_` prefix for environment variables to clearly indicate client exposure
   - Never expose admin-level API keys in the client

## Demo Page

A demo page is available at `/direct-api-demo` that shows how to use the direct API approach.

## New UI: Hover-to-Analyze Sentences

The landing analysis panel now includes a hover-driven sentence analyzer:

- Hover a sentence: A subtle aura appears while that sentence is analyzed.
- Popover breakdown: A popup shows parts of speech and relationships.
- Word hover: Hover a word in the popover to highlight the words it modifies (and vice versa) in the sentence.

This uses the same direct Gemini client but sends only the hovered sentence for faster, focused analysis.

## Model Choice

We use `models/gemini-2.5-flash` for fast, sentence-level inspection with structured output. See `src/utils/directGeminiApi.ts`.

## Migrating from Netlify Functions

If you're currently using Netlify Functions:

1. Replace imports from your API client:
   ```typescript
   // Before
   import { analyzeLatin } from "../utils/geminiApi";
   
   // After
   import { analyzeLatin } from "../utils/directGeminiApi";
   ```

2. Update environment variables to use the `PUBLIC_` prefix
3. Clean up your Netlify Functions if no longer needed

## Fallback Strategy

The direct client includes a fallback to mock data when:
- No API key is provided
- The API call fails for any reason
- Network connectivity issues occur

This ensures a graceful user experience even when the API is unavailable. 
