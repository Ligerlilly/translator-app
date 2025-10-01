# Speech Translation Web App - Implementation Guide

This document provides detailed step-by-step instructions for implementing the speech translation web app based on requirements.md.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Project Structure](#project-structure)
3. [Implementation Steps](#implementation-steps)
4. [Code Examples](#code-examples)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Project Setup

### Vite Project Setup

Since you're already in the translator-app directory, let's initialize it as a Vite project:

```bash
# Initialize Vite in current directory
npm create vite@latest . -- --template vanilla

# If prompted about existing files, choose to proceed
# This will create package.json and other necessary files

# Install dependencies
npm install

# Install Transformers.js
npm install @xenova/transformers

# Start development server
npm run dev
```

The dev server will automatically open your browser at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

After setup, your Vite project structure should look like this:

```
translator-app/
├── index.html          # Main HTML file (in root for Vite)
├── style.css           # Styles
├── main.js             # Main application logic (rename from counter.js)
├── javascript.svg      # Default Vite asset (can delete)
├── counter.js          # Default Vite file (can delete)
├── package.json        # Dependencies
├── package-lock.json   # Dependency lock file
├── vite.config.js      # Vite configuration (optional)
├── public/             # Static assets
│   └── vite.svg        # Default Vite logo (can delete)
├── requirements.md     # Your requirements doc
└── implementation.md   # This implementation guide
```

**Note:** Vite places `index.html` in the root directory (not in a `src` folder for vanilla projects).

## Implementation Steps

### Phase 1: Update HTML Structure

**File: index.html** (replace the default Vite template)

Replace the entire contents of `index.html` with this:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Speech Translator - EN ↔ FR</title>
        <link rel="stylesheet" href="style.css" />
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🎙️ Speech Translator</h1>
                <p>Record audio and translate between English and French</p>
            </header>

            <main>
                <!-- Status Messages -->
                <div id="status" class="status-message"></div>

                <!-- Control Panel -->
                <section class="control-panel">
                    <button id="recordBtn" class="btn btn-record" aria-label="Start recording">
                        <span class="icon">🎤</span>
                        <span class="text">Record</span>
                    </button>
                    <button id="stopBtn" class="btn btn-stop" disabled aria-label="Stop recording">
                        <span class="icon">⏹️</span>
                        <span class="text">Stop</span>
                    </button>
                    <div id="recordingIndicator" class="recording-indicator hidden">
                        <span class="pulse"></span>
                        <span id="timer">00:00</span>
                    </div>
                </section>

                <!-- Results Display -->
                <section class="results-section hidden" id="resultsSection">
                    <div class="result-card">
                        <div class="result-header">
                            <h3>Original</h3>
                            <span id="detectedLang" class="language-badge"></span>
                        </div>
                        <div id="transcription" class="result-text"></div>
                    </div>

                    <div class="translation-arrow">↓</div>

                    <div class="result-card">
                        <div class="result-header">
                            <h3>Translation</h3>
                            <span id="targetLang" class="language-badge"></span>
                        </div>
                        <div id="translation" class="result-text"></div>
                    </div>
                </section>

                <!-- Loading Indicator -->
                <div id="loadingIndicator" class="loading-indicator hidden">
                    <div class="spinner"></div>
                    <p id="loadingText">Processing...</p>
                </div>
            </main>

            <footer>
                <p>All processing happens in your browser. No data is sent to external servers.</p>
            </footer>
        </div>

        <!-- Vite module script -->
        <script type="module" src="/main.js"></script>
    </body>
</html>
```

### Phase 2: Create CSS Styling

**File: style.css**

```css
/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    color: #333;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

/* Header */
header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

header p {
    font-size: 1.1rem;
    opacity: 0.9;
}

/* Main Content */
main {
    padding: 40px 30px;
}

/* Status Message */
.status-message {
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
    display: none;
    font-weight: 500;
}

.status-message.info {
    background: #e3f2fd;
    color: #1976d2;
    display: block;
}

.status-message.success {
    background: #e8f5e9;
    color: #388e3c;
    display: block;
}

.status-message.error {
    background: #ffebee;
    color: #c62828;
    display: block;
}

/* Control Panel */
.control-panel {
    display: flex;
    gap: 15px;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.btn {
    padding: 15px 30px;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-record {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.btn-record:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

.btn-stop {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
}

.btn-stop:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(250, 112, 154, 0.4);
}

.btn .icon {
    font-size: 1.3rem;
}

/* Recording Indicator */
.recording-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    background: rgba(244, 67, 54, 0.1);
    border-radius: 25px;
    font-weight: 600;
    color: #f44336;
}

.recording-indicator.hidden {
    display: none;
}

.pulse {
    width: 12px;
    height: 12px;
    background: #f44336;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.1);
    }
}

/* Results Section */
.results-section {
    margin-top: 30px;
}

.results-section.hidden {
    display: none;
}

.result-card {
    background: #f5f5f5;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 15px;
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.result-header h3 {
    font-size: 1.2rem;
    color: #666;
}

.language-badge {
    padding: 5px 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
}

.result-text {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #333;
    min-height: 60px;
    padding: 15px;
    background: white;
    border-radius: 10px;
}

.translation-arrow {
    text-align: center;
    font-size: 2rem;
    color: #667eea;
    margin: 10px 0;
}

/* Loading Indicator */
.loading-indicator {
    text-align: center;
    padding: 40px;
}

.loading-indicator.hidden {
    display: none;
}

.spinner {
    width: 50px;
    height: 50px;
    margin: 0 auto 20px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

#loadingText {
    font-size: 1.1rem;
    color: #666;
    font-weight: 500;
}

/* Footer */
footer {
    background: #f5f5f5;
    padding: 20px;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 600px) {
    header h1 {
        font-size: 2rem;
    }

    .control-panel {
        flex-direction: column;
    }

    .btn {
        width: 100%;
        justify-content: center;
    }
}

/* Utility Classes */
.hidden {
    display: none !important;
}
```

### Phase 3: Implement JavaScript Logic

**File: main.js** (rename or replace the default `main.js` file)

Delete the default `main.js` and `counter.js` files that Vite created, then create a new `main.js` with this content:

```javascript
// Import Transformers.js
import { pipeline } from "@xenova/transformers";

// Application State
const state = {
    mediaRecorder: null,
    audioChunks: [],
    startTime: null,
    timerInterval: null,
    whisperPipeline: null,
    translatorPipeline: null,
    isModelLoading: false,
};

// DOM Elements
const elements = {
    recordBtn: document.getElementById("recordBtn"),
    stopBtn: document.getElementById("stopBtn"),
    recordingIndicator: document.getElementById("recordingIndicator"),
    timer: document.getElementById("timer"),
    status: document.getElementById("status"),
    resultsSection: document.getElementById("resultsSection"),
    transcription: document.getElementById("transcription"),
    translation: document.getElementById("translation"),
    detectedLang: document.getElementById("detectedLang"),
    targetLang: document.getElementById("targetLang"),
    loadingIndicator: document.getElementById("loadingIndicator"),
    loadingText: document.getElementById("loadingText"),
};

// Initialize Application
async function initializeApp() {
    showStatus("Initializing application...", "info");

    // Set up event listeners
    elements.recordBtn.addEventListener("click", startRecording);
    elements.stopBtn.addEventListener("click", stopRecording);

    showStatus('Ready! Click "Record" to start.', "success");
}

// Show Status Message
function showStatus(message, type = "info") {
    elements.status.textContent = message;
    elements.status.className = `status-message ${type}`;
}

// Format Timer
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Update Timer
function updateTimer() {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    elements.timer.textContent = formatTime(elapsed);
}

// Start Recording
async function startRecording() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create MediaRecorder
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];

        // Handle data available
        state.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                state.audioChunks.push(event.data);
            }
        };

        // Handle stop
        state.mediaRecorder.onstop = async () => {
            // Stop all tracks
            stream.getTracks().forEach((track) => track.stop());

            // Create audio blob
            const audioBlob = new Blob(state.audioChunks, { type: "audio/webm" });

            // Process audio
            await processAudio(audioBlob);
        };

        // Start recording
        state.mediaRecorder.start();
        state.startTime = Date.now();

        // Update UI
        elements.recordBtn.disabled = true;
        elements.stopBtn.disabled = false;
        elements.recordingIndicator.classList.remove("hidden");
        elements.resultsSection.classList.add("hidden");
        showStatus("Recording... Speak clearly in English or French.", "info");

        // Start timer
        state.timerInterval = setInterval(updateTimer, 1000);
    } catch (error) {
        console.error("Error starting recording:", error);
        showStatus("Error: Could not access microphone. Please grant permission.", "error");
    }
}

// Stop Recording
function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state === "recording") {
        state.mediaRecorder.stop();

        // Clear timer
        clearInterval(state.timerInterval);

        // Update UI
        elements.recordBtn.disabled = false;
        elements.stopBtn.disabled = true;
        elements.recordingIndicator.classList.add("hidden");
        showStatus("Processing audio...", "info");
    }
}

// Load Whisper Model
async function loadWhisperModel() {
    if (state.whisperPipeline) return state.whisperPipeline;

    showLoading("Loading speech recognition model (first time only)...");

    try {
        state.whisperPipeline = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny");
        return state.whisperPipeline;
    } catch (error) {
        console.error("Error loading Whisper model:", error);
        throw new Error("Failed to load speech recognition model");
    }
}

// Load Translation Model
async function loadTranslationModel(sourceLang, targetLang) {
    // Use NLLB model for translation
    if (state.translatorPipeline) return state.translatorPipeline;

    showLoading("Loading translation model (first time only)...");

    try {
        state.translatorPipeline = await pipeline("translation", "Xenova/nllb-200-distilled-600M");
        return state.translatorPipeline;
    } catch (error) {
        console.error("Error loading translation model:", error);
        throw new Error("Failed to load translation model");
    }
}

// Show Loading Indicator
function showLoading(message) {
    elements.loadingIndicator.classList.remove("hidden");
    elements.loadingText.textContent = message;
}

// Hide Loading Indicator
function hideLoading() {
    elements.loadingIndicator.classList.add("hidden");
}

// Convert Audio Blob to AudioBuffer
async function audioBufferToArray(audioBlob) {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get audio data as Float32Array
    const float32Array = audioBuffer.getChannelData(0);
    return float32Array;
}

// Process Audio
async function processAudio(audioBlob) {
    try {
        showLoading("Transcribing audio...");

        // Load Whisper model
        const whisper = await loadWhisperModel();

        // Convert audio to format expected by Whisper
        const audioData = await audioBufferToArray(audioBlob);

        // Transcribe audio
        const transcriptionResult = await whisper(audioData, {
            return_timestamps: false,
            language: null, // Auto-detect language
        });

        const transcribedText = transcriptionResult.text.trim();
        const detectedLanguage = transcriptionResult.language || "unknown";

        console.log("Transcription:", transcribedText);
        console.log("Detected language:", detectedLanguage);

        if (!transcribedText) {
            throw new Error("No speech detected. Please try again.");
        }

        // Display transcription
        elements.transcription.textContent = transcribedText;
        elements.detectedLang.textContent = detectedLanguage.toUpperCase();

        // Determine translation direction
        let targetLanguage;
        let sourceLanguageCode;
        let targetLanguageCode;

        if (detectedLanguage.toLowerCase().startsWith("en")) {
            targetLanguage = "French";
            sourceLanguageCode = "eng_Latn";
            targetLanguageCode = "fra_Latn";
        } else if (detectedLanguage.toLowerCase().startsWith("fr")) {
            targetLanguage = "English";
            sourceLanguageCode = "fra_Latn";
            targetLanguageCode = "eng_Latn";
        } else {
            throw new Error(`Unsupported language detected: ${detectedLanguage}`);
        }

        elements.targetLang.textContent = targetLanguage.toUpperCase();

        // Translate text
        showLoading("Translating...");
        const translator = await loadTranslationModel(sourceLanguageCode, targetLanguageCode);

        const translationResult = await translator(transcribedText, {
            src_lang: sourceLanguageCode,
            tgt_lang: targetLanguageCode,
        });

        const translatedText = translationResult[0].translation_text;
        console.log("Translation:", translatedText);

        // Display translation
        elements.translation.textContent = translatedText;

        // Show results
        hideLoading();
        elements.resultsSection.classList.remove("hidden");
        showStatus("Translation complete!", "success");
    } catch (error) {
        console.error("Error processing audio:", error);
        hideLoading();
        showStatus(`Error: ${error.message}`, "error");
    }
}

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
```

### Phase 4: Configuration (Optional)

**Create vite.config.js** for additional Vite configuration (optional but recommended):

```javascript
import { defineConfig } from "vite";

export default defineConfig({
    base: "./",
    build: {
        target: "esnext",
        outDir: "dist",
    },
    server: {
        port: 3000,
        open: true,
    },
});
```

**Your package.json should look similar to this** (Vite creates this automatically):

```json
{
    "name": "translator-app",
    "private": true,
    "version": "0.0.1",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "@xenova/transformers": "^2.6.0"
    },
    "devDependencies": {
        "vite": "^5.0.0"
    }
}
```

**Note:** The `@xenova/transformers` dependency will be added when you run `npm install @xenova/transformers`.

## Testing

### Manual Testing Checklist

1. **Microphone Access**

    - [ ] Browser requests microphone permission
    - [ ] Error message shown if permission denied
    - [ ] Record button enables after permission granted

2. **Recording Functionality**

    - [ ] Record button starts recording
    - [ ] Stop button becomes enabled
    - [ ] Recording indicator appears with pulse animation
    - [ ] Timer counts seconds correctly
    - [ ] Stop button ends recording

3. **Speech Recognition**

    - [ ] Test with English speech (5-10 seconds)
    - [ ] Transcription appears in results
    - [ ] Language detected as English
    - [ ] Test with French speech
    - [ ] Language detected as French

4. **Translation**

    - [ ] English text translates to French
    - [ ] French text translates to English
    - [ ] Translation is accurate
    - [ ] Both original and translation displayed

5. **UI/UX**

    - [ ] Loading indicators appear during processing
    - [ ] Status messages update appropriately
    - [ ] Results section appears after processing
    - [ ] Can record multiple times
    - [ ] Responsive on mobile devices

6. **Model Loading**
    - [ ] First use downloads models (may take time)
    - [ ] Subsequent uses are faster (cached)
    - [ ] Progress messages shown during load

### Browser Testing

Test in multiple browsers:

-   ✅ Chrome/Edge (Chromium)
-   ✅ Firefox
-   ✅ Safari (14.1+)

### Test Phrases

**English:**

-   "Hello, how are you today?"
-   "The weather is beautiful this morning."
-   "I would like to learn French."

**French:**

-   "Bonjour, comment allez-vous?"
-   "Le temps est magnifique ce matin."
-   "Je voudrais apprendre l'anglais."

## Deployment

### Option 1: GitHub Pages

```bash
# Build the project
npm run build

# Deploy to GitHub Pages
# 1. Create GitHub repository
# 2. Push code to main branch
# 3. Go to Settings > Pages
# 4. Select "main" branch and "/dist" folder
# 5. Save and wait for deployment
```

### Option 2: Netlify

```bash
# Build the project
npm run build

# Deploy via Netlify CLI
npx netlify-cli deploy --prod --dir=dist

# Or use Netlify web interface to deploy the dist folder
```

### Option 3: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 4: Static Hosting

Simply upload the `dist` folder (after running `npm run build`) to any static hosting service:

-   AWS S3 + CloudFront
-   Firebase Hosting
-   Cloudflare Pages
-   Surge.sh

## Troubleshooting

### Common Issues

**Issue: Microphone not accessible**

-   Solution: Ensure HTTPS or localhost. Browsers require secure context for microphone access.
-   Check browser permissions in settings.

**Issue: Models not loading**

-   Solution: Check internet connection for first-time model download.
-   Clear browser cache and reload.
-   Check browser console for specific errors.

**Issue: Poor transcription quality**

-   Solution: Ensure clear audio input, minimal background noise.
-   Speak at moderate pace and volume.
-   Try using headset microphone.

**Issue: Translation not working**

-   Solution: Verify language was detected correctly.
-   Check console for translation errors.
-   Ensure sufficient recording length (3+ seconds).

**Issue: Slow performance**

-   Solution: First load is always slower (model download).
-   Subsequent uses are much faster (cached models).
-   Consider using smaller Whisper model if needed.

**Issue: Build errors with Vite**

-   Solution: Ensure Node.js 18+ installed.
-   Delete `node_modules` and `package-lock.json`, reinstall.
-   Check for dependency version conflicts.

### Debug Mode

Add this to app.js for detailed logging:

```javascript
// Enable debug logging
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log("[DEBUG]", ...args);
    }
}

// Use throughout code:
debugLog("Audio data:", audioData.length);
debugLog("Transcription result:", transcriptionResult);
```

## Performance Optimization

### Reduce Model Size

Use smaller models for faster loading:

```javascript
// Instead of whisper-tiny, use whisper-base for better accuracy
"Xenova/whisper-base"; // 74M params

// For translation, use Opus-MT for specific language pairs
"Xenova/opus-mt-en-fr"; // Smaller, faster
```

### Implement Progressive Loading

```javascript
// Show progress during model loading
const whisper = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
    progress_callback: (progress) => {
        if (progress.status === "downloading") {
            const percent = Math.round(progress.progress);
            showLoading(`Downloading model: ${percent}%`);
        }
    },
});
```

### Cache Management

Models are automatically cached in IndexedDB. To clear cache:

```javascript
// Clear all Transformers.js cache
await caches.delete("transformers-cache");
```

## Next Steps

1. ✅ Complete basic implementation
2. ⬜ Add support for more languages
3. ⬜ Implement real-time transcription
4. ⬜ Add export functionality
5. ⬜ Implement text-to-speech for translations
6. ⬜ Add conversation history
7. ⬜ Improve error handling and recovery
8. ⬜ Add unit tests
9. ⬜ Optimize for production
10. ⬜ Deploy to production

## Additional Resources

-   [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
-   [Whisper Model Cards](https://huggingface.co/models?search=whisper)
-   [NLLB Translation Models](https://huggingface.co/facebook/nllb-200-distilled-600M)
-   [MediaRecorder API Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
-   [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review the troubleshooting section
3. Verify all dependencies are installed
4. Ensure using a supported browser
5. Check Transformers.js GitHub issues

---

**Ready to build!** Follow these steps in order, test thoroughly, and you'll have a working speech translation app running entirely in the browser.
