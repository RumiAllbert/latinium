# Latinium: Interactive Latin Text Analysis Platform

Latinium is a cutting-edge web-based application that provides comprehensive Latin text analysis through intuitive visualization and interactive annotation features. Powered by Google's Gemini AI, the platform helps students, educators, and Latin enthusiasts understand complex grammatical structures and relationships within Latin texts through dynamic visual representations.

## Features

- **Text Analysis Interface**: Clean, modern text input area with support for pasting or typing Latin passages
- **Grammatical Analysis**: Automatic part-of-speech identification and color-coding for nouns, verbs, adjectives, etc.
- **Interactive Visualization**: Elegant relationship mapping system with dynamic arrows showing grammatical connections
- **Educational Tools**: Difficulty assessment, integrated dictionary lookup, and grammar rule explanations
- **AI Integration**: Real-time Latin text analysis using Google's Gemini AI
- **Robust Error Handling**: Comprehensive error handling with user-friendly messages and fallback options
- **Adaptive Functionality**: Graceful fallback to mock data when API endpoints are unavailable

## Prerequisites

- Node.js v18 or higher (current project requires Node.js v18+)
- npm or yarn
- Google Gemini API key (get one at https://ai.google.dev/)

## Installation

1. **Clone the repository**:
   ```
   git clone https://github.com/yourusername/latinium.git
   cd latinium
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

   or if you use yarn:
   ```
   yarn
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root of the project based on the `.env.example` file and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Development

To run the development server:

```
npm run dev
```

or with yarn:

```
yarn dev
```

This will start the development server at `http://localhost:4321`.

## Building for Production

To build the application for production:

```
npm run build
```

or with yarn:

```
yarn build
```

To preview the production build:

```
npm run preview
```

## Project Structure

- `/src`: Source code
  - `/components`: Reusable UI components
  - `/layouts`: Page layouts
  - `/pages`: Astro pages that become routes
    - `/api`: Server-side API endpoints
  - `/styles`: Global CSS styles
  - `/types`: TypeScript type definitions
  - `/utils`: Utility functions and helpers
    - `errorHandling.ts`: Error handling utilities
    - `geminiApi.ts`: API integration utilities
    - `mockData.ts`: Mock data generation for fallback scenarios
- `/public`: Static assets

## How It Works

Latinium uses a server-side API endpoint to securely communicate with the Google Gemini API. When a user submits Latin text for analysis:

1. The text is sent to the `/api/analyze` endpoint
2. The server securely communicates with the Gemini API using your API key
3. Gemini analyzes the Latin text and returns detailed grammatical information
4. The analysis is displayed interactively in the UI with color-coding and relationship visualization

If at any point there's an error (server unavailable, API key missing, rate limiting, etc.):
1. The application provides a clear, user-friendly error message
2. Where appropriate, it falls back to using mock data to demonstrate functionality
3. The UI clearly indicates when mock data is being used instead of live AI analysis

## Deployment Considerations

Note that Latinium requires server-side functionality (`output: 'server'` in Astro config) to enable the API endpoints that communicate with Google's Gemini API. This means:

- You'll need to deploy to a hosting platform that supports server-side rendering (SSR)
- Suitable options include Vercel, Netlify, Render, or any Node.js hosting environment

### Deployment Options

1. **Full Server Deployment (Recommended)**:
   - Set `output: 'server'` in `astro.config.mjs`
   - Deploy to a server-supporting platform
   - Enjoy full API functionality with Gemini integration

2. **Static Site with Fallback**:
   - The application can be deployed to static hosting platforms like GitHub Pages
   - Set `output: 'static'` in `astro.config.mjs`
   - The application will automatically use mock data for analysis
   - Users will see a notification that they're using simplified mock analysis

## Technologies Used

- **Astro**: For fast, content-focused websites
- **React**: For interactive UI components
- **TailwindCSS**: For styling
- **TypeScript**: For type safety
- **D3.js**: For interactive visualizations
- **Google Gemini API**: For Latin text analysis

## Error Handling

Latinium implements robust error handling:

- **User-Friendly Messages**: Technical errors are translated into clear, actionable messages
- **Detailed Logging**: Comprehensive error logging for debugging
- **Fallback Mechanisms**: Graceful degradation with mock data when live analysis is unavailable
- **Visual Indicators**: Clear UI indicators when using fallback data

## Known Issues

- This project requires Node.js v18 or higher. If you have an older version, please update before attempting to install dependencies.
- The Gemini API may occasionally return responses that require additional processing to extract valid JSON.

## License

MIT