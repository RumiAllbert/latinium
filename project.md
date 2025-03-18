# Latinium: Interactive Latin Text Analysis Platform

## Project Overview
Latinium is a cutting-edge web-based application built with Astro that provides comprehensive Latin text analysis through intuitive visualization and interactive annotation features. The platform features a stunning glass-morphic UI design with subtle transparency effects, creating a modern, sophisticated aesthetic that appeals to tech-savvy users. Powered by Google's Gemini AI, the platform helps students, educators, and Latin enthusiasts understand complex grammatical structures and relationships within Latin texts through dynamic visual representations.

## Core Features

### Text Analysis Interface
- **Clean, modern text input area** with support for pasting or typing Latin passages
- **Two-panel view option**: original text alongside annotated/analyzed version
- **Text history and save functionality** to revisit previous analyses
- **Export options** for annotated texts (PDF, image, HTML)

### Grammatical Analysis
- **Automatic part-of-speech identification and color-coding**:
  - Nouns (with case detection)
  - Verbs (with tense, mood, voice detection)
  - Adjectives and adverbs
  - Prepositions and conjunctions
  - Pronouns
- **Morphological analysis** showing declensions, conjugations, and grammatical forms
- **Syntactic parsing** identifying sentence structures and clauses

### Interactive Visualization
- **Elegant relationship mapping system** with dynamic arrows showing grammatical connections:
  - Subject-verb relationships with directional flows
  - Verb-object connections through animated paths
  - Adjective-noun modifications with subtle connecting lines
  - Prepositional phrases and their objects through hierarchical indicators
- **Sophisticated interactive hover states** that:
  - Reveal beautiful animated arrows between grammatically related words
  - Display relationship type through minimalist tooltips
  - Temporarily highlight connected word groups with subtle glow effects
  - Fade unrelated content to maintain focus on the current selection
- **Visual syntax tree generation** with expandable/collapsible nodes
- **Customizable visualization settings** with intuitive controls for:
  - Arrow styles, thickness, and animation speed
  - Highlight colors and intensity
  - Annotation density and information display
  - Visual theme preferences

### Educational Tools
- **Difficulty assessment** for texts based on vocabulary and grammatical complexity
- **Integrated dictionary lookup** for unfamiliar words
- **Grammar rule explanations** tied to specific constructions in the text
- **Practice exercises** generated from analyzed text
- **Progress tracking** for educational settings

### Technical Implementation

#### Frontend
- **Astro framework** leveraging its high-performance static site generation with interactive islands
- **Ultra-modern, minimalist UI design** featuring:
  - Glass-morphic elements with subtle transparency effects
  - Clean typography with ample white space
  - Subtle animations and micro-interactions
  - Floating UI components with soft shadows
  - Gradient accents and subtle blur effects
- **Interactive visualizations** using D3.js for relationship mapping
- **Typescript** for type safety and code maintainability
- **TailwindCSS** for streamlined styling and consistent design system

#### Backend/API
- **Latin text processing pipeline powered by Google's Gemini API**:
  - Direct integration with Gemini 2 Flash model for real-time analysis
  - Structured JSON output from LLM containing detailed grammatical information
  - Example implementation:
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2-flash" });

async function analyzeLatin(latinText) {
  // Prompt engineering for structured grammatical analysis
  const prompt = `
    Analyze the following Latin text and provide a comprehensive grammatical breakdown.
    Return the analysis as a JSON object with the following structure for each word:
    {
      "words": [
        {
          "word": "original Latin word",
          "partOfSpeech": "noun|verb|adjective|etc",
          "lemma": "dictionary form",
          "morphology": {
            // For nouns:
            "case": "nominative|genitive|dative|accusative|ablative|vocative",
            "number": "singular|plural",
            "gender": "masculine|feminine|neuter",
            
            // For verbs:
            "person": "1|2|3",
            "number": "singular|plural",
            "tense": "present|imperfect|future|perfect|pluperfect|future perfect",
            "mood": "indicative|subjunctive|imperative|infinitive",
            "voice": "active|passive"
          },
          "relationships": [
            {
              "type": "subject-verb|verb-object|adjective-noun|etc",
              "relatedWordIndex": 3, // index of related word in the array
              "description": "brief explanation of relationship"
            }
          ]
        }
      ]
    }
    
    Latin text: "${latinText}"
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```
- **Caching system** for frequently analyzed texts or passages
- **User authentication** for saving analyses and personal settings

#### Data Sources
- **Latin grammatical rules database**
- **Latin vocabulary corpus** with frequency data
- **Example texts** of varying difficulty levels

## User Experience & Design Aesthetic
- **Cutting-edge, transparent glass-morphic interface** featuring:
  - Frosted glass panels with subtle backdrop blur effects
  - Semi-transparent UI components that reveal layered backgrounds
  - Floating cards with soft drop shadows and rounded corners
  - Delicate light/dark mode transitions with color scheme preferences
- **Progressive disclosure** of grammatical information through elegant animations
- **Customizable analysis depth** controlled through minimal, intuitive controls
- **Responsive design** optimized for desktop and tablet with fluid layouts
- **Accessibility features** ensuring the tool is usable by all students while maintaining the modern aesthetic
- **Visual coherence** with consistent use of a limited color palette for grammar highlighting

## Target Audience
- Latin language students (high school through university)
- Latin educators seeking visual teaching aids
- Scholars working with Latin texts
- Latin enthusiasts looking to improve their understanding of the language

## Future Enhancements
- Support for other classical languages (Ancient Greek, Sanskrit)
- AI-powered translation suggestions
- Community features for sharing analyses and annotations
- Integration with popular Latin texts and educational resources
- Mobile application version

## Development Roadmap
1. Core text analysis and basic visualization (MVP)
2. Enhanced visualization and interactive features
3. Educational tools and user accounts
4. Advanced analysis features and API improvements
5. Community features and expanded language support