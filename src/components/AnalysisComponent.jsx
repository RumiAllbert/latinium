import { analyzeLatin as analyzeLatinDirect } from "../utils/directGeminiApi";
import { analyzeLatin as analyzeLatinWithNetlify } from "../utils/geminiApi";

const [useDirectApi, setUseDirectApi] = useState(true); // Default to direct API

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);
  setResponseData(null);
  setAnalysisCompleted(false);

  const inputText = inputRef.current.value;
  
  if (!inputText.trim()) {
    setError("Please enter some Latin text to analyze.");
    setIsLoading(false);
    return;
  }

  // Choose which API method to use based on user selection
  const apiMethod = useDirectApi ? analyzeLatinDirect : analyzeLatinWithNetlify;
  
  try {
    console.log(`Analyzing Latin text using ${useDirectApi ? 'Direct API' : 'Netlify Functions'}`);
    
    const { result, isMockData } = await apiMethod(inputText, {
      stream: useStream,
      onStreamChunk: streamCallbackRef.current
    });
    
    setResponseData(result);
    setUsedMockData(isMockData);
    setAnalysisCompleted(true);
  } catch (error) {
    console.error("Error analyzing Latin text:", error);
    setError(`Error: ${error.message || "Failed to analyze text"}`);
  } finally {
    setIsLoading(false);
  }
};

<div className="mb-4 flex items-center">
  <label className="inline-flex items-center mr-4">
    <input
      type="radio"
      className="form-radio h-4 w-4 text-primary-600"
      checked={useDirectApi}
      onChange={() => setUseDirectApi(true)}
    />
    <span className="ml-2">Direct API (Recommended)</span>
  </label>
  <label className="inline-flex items-center">
    <input
      type="radio"
      className="form-radio h-4 w-4 text-primary-600"
      checked={!useDirectApi}
      onChange={() => setUseDirectApi(false)}
    />
    <span className="ml-2">Netlify Functions</span>
  </label>
</div> 