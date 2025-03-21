# 🏛️ Latinium: Interactive Latin Text Analysis Platform

> **Bring ancient Latin to life with modern visualization and AI analysis!**

Latinium is a cutting-edge web application that transforms Latin text analysis through beautiful visualizations and interactive annotation features. Powered by Google's Gemini AI, Latinium helps students, educators, and Latin enthusiasts understand complex grammatical structures through dynamic visual representations.

![Latinium in action]()

## ✨ Key Features

- 📝 **Smart Text Analysis** - Paste any Latin text and get instant grammatical breakdown
- 🎨 **Case-Based Coloring** - Words are visually color-coded by grammatical case (nominative, accusative, genitive, dative, ablative, vocative)
- 🔄 **Interactive Relationships** - Explore connections between words with intuitive visualization
- 📊 **Traditional & Interactive Views** - Switch between visualization styles based on your preference
- 🔍 **Word Details On-Demand** - Hover for quick insights, click for comprehensive information
- ⚡ **Streaming Analysis** - See results appear in real-time as the AI processes your text
- 🧠 **AI-Powered** - Leveraging Google's Gemini 2.0 for accurate Latin analysis

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

### Analyzing Latin Text

1. Paste your Latin text in the input area
2. Click "Analyze" and watch the magic happen ✨
3. Explore the results:
   - Color-coded words by grammatical case
   - Interactive relationship visualization
   - Detailed morphological information

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

### Visualization Modes

- **Traditional View** 📊 - Hierarchical tree-like visualization with connecting arrows
- **Interactive View** 🔄 - Group-based organization by part of speech with hover interactions

### Word Filtering

- Filter by part of speech to focus on specific word types
- Toggle relationship types to highlight specific grammatical connections
- Use the "Focus Mode" to concentrate on one relationship at a time

## 📁 Project Structure

```
/src
 ├── components/        # UI components
 │   ├── TextAnalysisPanel.astro    # Main analysis interface
 │   ├── TextAnalysisResult.tsx     # Analysis results display
 │   └── InteractiveWordRelationships.tsx # Relationship visualization
 ├── layouts/           # Page layouts
 ├── pages/             # Astro pages (routes)
 │   └── api/
 │       └── analyze.ts # Gemini API integration
 ├── styles/            # Global CSS
 ├── types/             # TypeScript definitions
 └── utils/             # Helper functions
```

## 🛠️ Technical Notes

- **Current Output Mode**: Static site generation (`output: 'static'`)
- **Designed For**: Server-side rendering with API capabilities
- **Node.js Requirement**: This project requires v18.14.1+ (critical)
- **Fallback System**: Gracefully falls back to mock data when API is unavailable

## 📝 Using the API Locally

For full functionality including the Latin analysis API:

1. Ensure you have Node.js v18.14.1+ installed
2. Configure your `.env` file with your Gemini API key
3. Update `astro.config.mjs` to use server mode:
   ```js
   output: 'server',
   adapter: node({
     mode: 'standalone'
   }),
   ```
4. Install the Node adapter: `npm install @astrojs/node --save-dev`

## 🔮 Future Enhancements

- 📱 Mobile-optimized interface
- 🌍 Support for additional languages
- 📖 Integration with classical Latin texts library
- 📚 Educational exercises based on analysis results

## 📜 License

MIT