import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAppStore } from "../../store/appStore";

interface SampleText {
  id: string;
  title: string;
  author: string;
  content: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  era: string;
  genre: string;
  wordCount: number;
  description: string;
  tags: string[];
}

const SAMPLE_TEXTS: SampleText[] = [
  {
    id: "caesar-gallia",
    title: "Gallia est omnis divisa",
    author: "Julius Caesar",
    content:
      "Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae, nostra Galli appellantur.",
    difficulty: "beginner",
    era: "Classical",
    genre: "Historical",
    wordCount: 28,
    description:
      "The famous opening of Caesar's Gallic Wars, introducing the geography of Gaul.",
    tags: ["geography", "introduction", "famous opening"],
  },
  {
    id: "cicero-catilina",
    title: "Quousque tandem abutere",
    author: "Marcus Tullius Cicero",
    content:
      "Quousque tandem abutere, Catilina, patientia nostra? Quam diu etiam furor iste tuus nos eludet? Quem ad finem sese effrenata iactabit audacia?",
    difficulty: "intermediate",
    era: "Classical",
    genre: "Oratory",
    wordCount: 32,
    description:
      "The dramatic opening of Cicero's first speech against Catiline.",
    tags: ["rhetoric", "politics", "famous speech"],
  },
  {
    id: "virgil-aeneid",
    title: "Arma virumque cano",
    author: "Publius Vergilius Maro",
    content:
      "Arma virumque cano, Troiae qui primus ab oris Italiam, fato profugus, Laviniaque venit litora, multum ille et terris iactatus et alto.",
    difficulty: "advanced",
    era: "Augustan",
    genre: "Epic Poetry",
    wordCount: 28,
    description: "The opening lines of Virgil's Aeneid, Rome's national epic.",
    tags: ["epic", "heroism", "foundation myth"],
  },
  {
    id: "ovid-amores",
    title: "Arma gravi numero violentaque bella parabam",
    author: "Publius Ovidius Naso",
    content:
      "Arma gravi numero violentaque bella parabam edere, materia conveniente modis. Par erat inferior versus—risisse Cupido dicitur atque unum surripuisse pedem.",
    difficulty: "intermediate",
    era: "Augustan",
    genre: "Love Poetry",
    wordCount: 32,
    description:
      "Ovid explains how Cupid changed his intended epic into love poetry.",
    tags: ["love", "poetry", "humor"],
  },
  {
    id: "horace-odes",
    title: "Odi profanum volgus",
    author: "Quintus Horatius Flaccus",
    content:
      "Odi profanum volgus et arceo. Favete linguis: carmina non prius audita Musarum sacerdos virginibus puerisque canto.",
    difficulty: "advanced",
    era: "Augustan",
    genre: "Lyric Poetry",
    wordCount: 24,
    description: "Horace addresses the crowd before reciting his poetry.",
    tags: ["poetry", "religion", "exclusion"],
  },
  {
    id: "sallust-catiline",
    title: "Omnis homines qui sese student",
    author: "Gaius Sallustius Crispus",
    content:
      "Omnis homines qui sese student praestare ceteris animalibus summa ope niti decet ne vitam silentio transeant veluti pecora.",
    difficulty: "intermediate",
    era: "Classical",
    genre: "Historical",
    wordCount: 26,
    description: "Sallust on the human drive to excel and leave a mark.",
    tags: ["philosophy", "human nature", "ambition"],
  },
  {
    id: "catullus-poem",
    title: "Vivamus, mea Lesbia",
    author: "Gaius Valerius Catullus",
    content:
      "Vivamus, mea Lesbia, atque amemus rumoresque senum severiorum omnes unius aestimemus assis. Soles occidere et redire possunt.",
    difficulty: "intermediate",
    era: "Classical",
    genre: "Love Poetry",
    wordCount: 24,
    description:
      "Catullus invites Lesbia to live and love while ignoring gossip.",
    tags: ["love", "carpe diem", "defiance"],
  },
  {
    id: "pliny-letter",
    title: "Gaius Plinius Caecilio suo salutem",
    author: "Gaius Plinius Caecilius Secundus",
    content:
      "Gaius Plinius Caecilio suo salutem. Petis ut tibi avunculi mei exitum scribam, quo verius tradere posteris possis.",
    difficulty: "advanced",
    era: "Imperial",
    genre: "Letters",
    wordCount: 20,
    description:
      "Pliny describes the death of his uncle during the Vesuvius eruption.",
    tags: ["history", "natural disaster", "eyewitness"],
  },
  {
    id: "lucretius-philosophy",
    title: "Nil posse creari de nilo",
    author: "Titus Lucretius Carus",
    content:
      "Nil posse creari de nilo neque quod genitum est ad nihil revocari posse, idcirco quia semper quod fuerit necesse est.",
    difficulty: "advanced",
    era: "Classical",
    genre: "Philosophy",
    wordCount: 22,
    description: "Lucretius explains the principle of conservation of matter.",
    tags: ["philosophy", "physics", "atomism"],
  },
  {
    id: "tacitus-annals",
    title: "Urbem Romam a principio reges habuere",
    author: "Publius Cornelius Tacitus",
    content:
      "Urbem Romam a principio reges habuere; libertatem et consulatum L. Brutus instituit. Dictaturae ad tempus sumebantur.",
    difficulty: "advanced",
    era: "Imperial",
    genre: "Historical",
    wordCount: 18,
    description:
      "Tacitus traces the evolution of Roman government from kings to republic.",
    tags: ["history", "politics", "republic"],
  },
];

const TextLibrary = () => {
  const {
    storedTexts,
    saveText,
    deleteText,
    updateText,
    setCurrentText,
    analyzeText,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "title" | "author" | "difficulty" | "wordCount"
  >("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState({
    title: "",
    content: "",
    author: "",
    difficulty: "intermediate" as const,
    era: "",
    genre: "",
    source: "",
    tags: [] as string[],
  });

  // Filter and sort texts
  const filteredAndSortedTexts = useMemo(() => {
    let texts: (SampleText | (typeof storedTexts)[0])[] = [
      ...SAMPLE_TEXTS,
      ...storedTexts.map((text) => ({ ...text, isPersonal: true })),
    ];

    // Apply filters
    if (searchTerm) {
      texts = texts.filter(
        (text) =>
          text.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          text.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          text.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDifficulty !== "all") {
      texts = texts.filter((text) => text.difficulty === selectedDifficulty);
    }

    if (selectedEra !== "all") {
      texts = texts.filter((text) => text.era === selectedEra);
    }

    if (selectedGenre !== "all") {
      texts = texts.filter((text) => text.genre === selectedGenre);
    }

    // Apply sorting
    texts.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "author":
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case "difficulty":
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          aValue = difficultyOrder[a.difficulty];
          bValue = difficultyOrder[b.difficulty];
          break;
        case "wordCount":
          aValue = a.wordCount;
          bValue = b.wordCount;
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return texts;
  }, [
    storedTexts,
    searchTerm,
    selectedDifficulty,
    selectedEra,
    selectedGenre,
    sortBy,
    sortOrder,
  ]);

  // Get unique values for filters
  const difficulties = [
    ...new Set(SAMPLE_TEXTS.map((text) => text.difficulty)),
  ];
  const eras = [...new Set(SAMPLE_TEXTS.map((text) => text.era))];
  const genres = [...new Set(SAMPLE_TEXTS.map((text) => text.genre))];

  const handleAddText = () => {
    if (!newText.title || !newText.content) return;

    const textToSave = {
      title: newText.title,
      content: newText.content,
      author: newText.author || "Unknown",
      language: "Latin",
      source: newText.source,
      difficulty: newText.difficulty,
      tags: newText.tags,
      isFavorite: false,
    };

    saveText(textToSave);
    setNewText({
      title: "",
      content: "",
      author: "",
      difficulty: "intermediate",
      era: "",
      genre: "",
      source: "",
      tags: [],
    });
    setShowAddForm(false);
  };

  const handleSelectText = async (
    text: SampleText | (typeof storedTexts)[0]
  ) => {
    setCurrentText(text.content);

    // If it's a sample text, also save it to the library
    if (!("isPersonal" in text)) {
      const textToSave = {
        title: text.title,
        content: text.content,
        author: text.author,
        language: "Latin",
        source: `${text.author} - ${text.era} ${text.genre}`,
        difficulty: text.difficulty,
        tags: text.tags,
        isFavorite: false,
      };
      saveText(textToSave);
    }

    // Navigate to app and trigger analysis
    window.location.href = "/app?autoAnalyze=true";
  };

  const handleDeleteText = (textId: string) => {
    if (confirm("Are you sure you want to delete this text?")) {
      deleteText(textId);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-serif">
            Text Library
          </h1>
          <p className="text-white/60 text-lg">
            Discover and manage Latin texts for study and analysis
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search texts, authors, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Difficulties</option>
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Eras</option>
                {eras.map((era) => (
                  <option key={era} value={era}>
                    {era}
                  </option>
                ))}
              </select>

              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-white/60 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 bg-black/20 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="difficulty">Difficulty</option>
                <option value="wordCount">Length</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-1 bg-black/20 border border-white/20 rounded hover:bg-white/10 transition-colors"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4 text-white" />
                ) : (
                  <SortDesc className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Text</span>
            </button>
          </div>
        </div>

        {/* Add Text Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-bold text-white mb-4">Add New Text</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Title *"
                value={newText.title}
                onChange={(e) =>
                  setNewText((prev) => ({ ...prev, title: e.target.value }))
                }
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Author"
                value={newText.author}
                onChange={(e) =>
                  setNewText((prev) => ({ ...prev, author: e.target.value }))
                }
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newText.difficulty}
                onChange={(e) =>
                  setNewText((prev) => ({
                    ...prev,
                    difficulty: e.target.value as any,
                  }))
                }
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                type="text"
                placeholder="Source (optional)"
                value={newText.source}
                onChange={(e) =>
                  setNewText((prev) => ({ ...prev, source: e.target.value }))
                }
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              placeholder="Latin text content *"
              value={newText.content}
              onChange={(e) =>
                setNewText((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddText}
                disabled={!newText.title || !newText.content}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Add Text
              </button>
            </div>
          </motion.div>
        )}

        {/* Text Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTexts.map((text, index) => (
            <motion.div
              key={text.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 font-serif">
                    {text.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-2">by {text.author}</p>
                  <div className="flex items-center space-x-3 text-xs text-white/40">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        text.difficulty === "beginner"
                          ? "bg-green-500/20 text-green-300"
                          : text.difficulty === "intermediate"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {text.difficulty}
                    </span>
                    <span>{text.wordCount} words</span>
                  </div>
                </div>

                {"isPersonal" in text && (
                  <button
                    onClick={() => handleDeleteText(text.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-white/70 text-sm mb-4 line-clamp-3">
                {text.description}
              </p>

              {text.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {text.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleSelectText(text)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Study This Text</span>
              </button>
            </motion.div>
          ))}
        </div>

        {filteredAndSortedTexts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No texts found
            </h3>
            <p className="text-white/60">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TextLibrary;
