# Speech Translation Web App - Requirements

## Project Overview

A browser-based web application that records audio, converts speech to text, and automatically translates between English and French based on the detected language.

## Core Features

### 1. Audio Recording

-   **Record Button**: Start capturing audio from user's microphone
-   **Stop Button**: End recording and trigger processing
-   Audio capture using browser's MediaRecorder API
-   Support for common audio formats (WebM, MP4, etc.)

### 2. Speech-to-Text Conversion

-   Convert recorded audio to text using AI models
-   Automatic language detection (English or French)
-   Real-time processing indicator/loading state

### 3. Automatic Translation

-   **English → French**: When English speech is detected
-   **French → English**: When French speech is detected
-   Display both original transcription and translation
-   Show detected language to user

## Technology Stack

### Frontend

-   **Framework**: Vanilla JavaScript or Vite (modern build tool)
-   **HTML5/CSS3**: For UI components
-   **MediaRecorder API**: For audio capture

### AI/ML Models (Browser-Based - No Backend Required)

-   **Transformers.js**: Run Hugging Face models directly in browser
    -   Library: `@xenova/transformers`
    -   Uses WebAssembly and ONNX for performance

### Models

1. **Speech-to-Text**: Whisper (OpenAI)

    - Model: `Xenova/whisper-tiny` (39M parameters, fastest)
    - Alternative: `Xenova/whisper-base` (74M parameters, more accurate)
    - Features:
        - Automatic language detection
        - Supports 99+ languages including English and French
        - High accuracy for both languages

2. **Translation**: Choose one approach

    - **Option A (Recommended)**: NLLB (Meta's No Language Left Behind)

        - Model: `Xenova/nllb-200-distilled-600M`
        - Supports 200+ languages including EN↔FR
        - Good quality, medium size (~600MB)

    - **Option B**: Opus-MT (Smaller, targeted models)
        - English→French: `Xenova/opus-mt-en-fr`
        - French→English: `Xenova/opus-mt-fr-en`
        - Faster, smaller downloads (~200MB total)

## Technical Requirements

### Browser Compatibility

-   Modern browsers supporting:
    -   MediaRecorder API (Chrome, Firefox, Edge, Safari 14.1+)
    -   WebAssembly
    -   Web Workers (for model inference)
    -   IndexedDB (for model caching)

### Performance Considerations

-   **Initial Load**: 50-200MB model download (one-time, cached)
-   **Processing Time**:
    -   Whisper-tiny: ~1-3 seconds for 30s audio
    -   Translation: ~1-2 seconds
-   Models cached in browser for subsequent uses
-   Web Workers for non-blocking processing

### Privacy & Security

-   All processing happens in browser (client-side)
-   No audio data sent to external servers
-   No API keys required
-   Works offline after initial model download

## User Interface Requirements

### Layout

1. **Header**: App title and description
2. **Control Panel**:
    - Record button (red/microphone icon)
    - Stop button (disabled until recording starts)
    - Recording indicator (visual feedback)
    - Timer showing recording duration
3. **Results Display**:
    - Detected language badge
    - Original transcription text box
    - Translation text box
    - Loading indicators during processing
4. **Status Messages**:
    - Model loading progress
    - Error messages
    - Success confirmations

### User Experience

-   Clear visual feedback for all states:
    -   Ready to record
    -   Recording in progress
    -   Processing audio
    -   Results ready
-   Responsive design (mobile-friendly)
-   Accessible (keyboard navigation, ARIA labels)
-   Error handling with user-friendly messages

## Development Phases

### Phase 1: Project Setup

-   Initialize project structure
-   Install dependencies (Transformers.js)
-   Set up basic HTML/CSS/JS files
-   Configure build tools (if using Vite)

### Phase 2: Audio Recording

-   Implement MediaRecorder setup
-   Create record/stop button functionality
-   Add recording indicator and timer
-   Handle audio blob creation

### Phase 3: Speech-to-Text

-   Load Whisper model
-   Process audio with model
-   Extract transcription and detected language
-   Display results

### Phase 4: Translation

-   Load translation model(s)
-   Implement language detection logic
-   Translate based on detected language
-   Display translation

### Phase 5: UI/UX Polish

-   Improve visual design
-   Add loading states and animations
-   Implement error handling
-   Test across browsers

### Phase 6: Testing & Optimization

-   Test with various audio lengths
-   Test both languages
-   Optimize model loading
-   Add performance monitoring

## Constraints & Limitations

### Known Limitations

1. **Model Size**: Initial download required (50-200MB)
2. **Processing Speed**: Slower than cloud APIs on first run
3. **Audio Length**: Best for clips under 30 seconds
4. **Browser Support**: Requires modern browsers
5. **Accuracy**: May vary with accent, audio quality, background noise

### Future Enhancements

-   Support for additional languages
-   Real-time streaming transcription
-   Audio quality pre-processing
-   Export functionality (download transcription/translation)
-   Voice cloning for translated audio output
-   Conversation mode (continuous recording)

## Success Criteria

### Minimum Viable Product (MVP)

-   ✅ Record audio in browser
-   ✅ Convert speech to text
-   ✅ Detect language automatically
-   ✅ Translate EN→FR and FR→EN
-   ✅ Display results clearly
-   ✅ Work without backend/API keys

### Stretch Goals

-   Multiple language pair support
-   Real-time transcription
-   Text-to-speech for translations
-   Save/export functionality
-   Conversation history

## Resources & References

### Documentation

-   [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
-   [Whisper Model Card](https://huggingface.co/openai/whisper-tiny)
-   [NLLB Model](https://huggingface.co/facebook/nllb-200-distilled-600M)
-   [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

### Example Projects

-   Transformers.js examples on Hugging Face
-   WebRTC audio recording demos
-   Browser-based ML inference examples

## Development Environment

### Prerequisites

-   Node.js 18+ (if using build tools)
-   Modern web browser
-   Code editor (VSCode recommended)
-   Local development server

### Installation

```bash
# If using Vite
npm create vite@latest translator-app -- --template vanilla
cd translator-app
npm install
npm install @xenova/transformers

# If using vanilla HTML/JS
# Just create index.html and include Transformers.js via CDN
```

### Running the App

```bash
# With Vite
npm run dev

# With vanilla HTML
# Open index.html in browser or use local server
python -m http.server 8000
# or
npx serve
```

## Notes

-   All AI processing happens in-browser using WebAssembly
-   No backend server required
-   No API costs
-   Privacy-preserving (data never leaves browser)
-   Works offline after initial model download
