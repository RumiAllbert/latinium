# 🏛️ Latinium: Learn Latin Interactively

> **Bring ancient Latin to life with modern visualization and AI analysis!**

Latinium is a learning-first web app for reading Latin. Paste text, lock it, hover sentences for instant breakdowns, then pin a sentence to get a guided Tutor walkthrough, an auto‑generated Quiz, and build your own Vocab deck. Powered by Google’s Gemini.

[Latinium In Action](https://latinium.rumiallbert.com/)

## ✨ Key Features

- 🔒 Lock & Hover analysis: fast sentence‑level breakdowns with animated auras
- 📌 Pin a sentence: open Tutor (guided steps) and Quiz (MCQs) for that line
- 🗂️ Vocab deck: save words and meanings to a local deck
- 🎨 Case-based coloring and relationship cues for clarity
- 🌓 Light mode by default with a theme toggle
- ⚡ Direct Gemini client using `models/gemini-2.5-flash` with structured output

## 🚀 Getting Started

### Prerequisites

- 📦 **Node.js v18.14.1 or higher** (critical requirement)
- 🔑 **Google Gemini API key** ([Get one here](https://ai.google.dev/))

### Quick Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/latinium.git
   cd latinium
   npm install
   ```

2. **Set up your API key**
   Create a `.env` file in the project root:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start developing**
   ```bash
   npm run dev
   ```
   Then visit `http://localhost:4321` in your browser! 🎉

## 🔧 Working with Latinium

### Using the Workspace

1. Paste text → click “Lock & Analyze”
2. Hover sentences to analyze; click a sentence to pin it
3. Use Tutor/Quiz/Vocab (right panel) for learning workflow

### Case-Based Coloring 🎨

Words are now colored based on their grammatical case to make Latin easier to understand:

- **Nominative (subject)**: 🟦 Blue
- **Accusative (direct object)**: 🟨 Amber
- **Genitive (possession)**: 🟪 Purple
- **Dative (indirect object)**: 🟩 Green
- **Ablative (by/with/from)**: 🟫 Pink
- **Vocative (direct address)**: 🟦 Indigo
- **Verbs**: 🟥 Always colored red

This visualization helps you instantly recognize grammatical patterns and understand how words relate to each other in Latin sentences.

### Tutor & Quiz

- Tutor builds small steps: find verb, subject, objects, modifiers, then translate
- Quiz generates 3–5 questions (identify subject, tense, case usage, agreement, etc.)

### Word Filtering

- Filter by part of speech to focus on specific word types
- Toggle relationship types to highlight specific grammatical connections
- Use the "Focus Mode" to concentrate on one relationship at a time

## 📁 Project Structure

```
latinium
├── src/                # Source code
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Basic UI components
│   │   └── ...         # Feature-specific components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Astro pages (file-based routing)
│   │   └── index.astro # Homepage
│   ├── styles/         # Global styles
│   ├── utils/          # Utility functions
│   │   ├── directGeminiApi.ts # Direct client-side API integration
│   │   ├── mockData.ts # Fallback data when API is unavailable
│   │   └── textUtils.ts # Text processing utilities
│   └── types/          # TypeScript type definitions
└── public/             # Static assets
```

## 🛠️ Technical Notes

- **Current Output Mode**: Static site generation (`output: 'static'`)
- **API Implementation**: Uses direct client-side API integration with Google's Gemini API
- **Node.js Requirement**: This project requires v18.14.1+ (critical)
- **Fallback System**: Gracefully falls back to mock data when API is unavailable

## 📝 Deployment Options

### Netlify Deployment (Recommended)

1. Fork/Clone this repository
2. Connect to Netlify
3. Configure the environment variable:
   - `PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key
4. Deploy! The build will automatically include your API key in the client-side code

### Using the API Locally

For local development with full API functionality:

1. Ensure you have Node.js v18.14.1+ installed
2. Configure your `.env` file with your Gemini API key as `PUBLIC_GEMINI_API_KEY`
3. Run in development mode: `npm run dev`

## 🔮 Future Enhancements

- 📱 Mobile-optimized interface
- 🌍 Support for additional languages
- 📖 Integration with classical Latin texts library
- 📚 Educational exercises based on analysis results

## 📜 License

MIT
