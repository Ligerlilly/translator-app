// Import Transformers.js
import { pipeline, env } from "@xenova/transformers";

// Configure Transformers.js to use remote models only
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

// IMPORTANT: Set the correct HuggingFace path template
env.remoteHost = "https://huggingface.co";
env.remotePathTemplate = "{model}/resolve/main/";

console.log("Transformers.js configured:");
console.log("- Remote models:", env.allowRemoteModels);
console.log("- Remote host:", env.remoteHost);
console.log("- Cache enabled:", env.useBrowserCache);

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

    // Test if Transformers.js is properly imported
    console.log("Transformers.js pipeline available:", typeof pipeline);
    
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
        console.log("Starting to load Whisper model...");
        state.whisperPipeline = await pipeline(
            "automatic-speech-recognition",
            "Xenova/whisper-tiny",
            {
                progress_callback: (progress) => {
                    console.log("Model loading progress:", progress);
                    if (progress.status === "downloading") {
                        const percent = Math.round(progress.progress || 0);
                        showLoading(`Downloading speech model: ${percent}%`);
                    } else if (progress.status === "loading") {
                        showLoading("Loading speech model...");
                    }
                }
            }
        );
        console.log("Whisper model loaded successfully");
        return state.whisperPipeline;
    } catch (error) {
        console.error("Error loading Whisper model:", error);
        console.error("Error details:", error.message, error.stack);
        throw new Error(`Failed to load speech recognition model: ${error.message}`);
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
        let detectedLanguage = transcriptionResult.language || "en"; // Default to English if unknown

        console.log("Transcription:", transcribedText);
        console.log("Detected language:", detectedLanguage);
        console.log("Full result:", transcriptionResult);

        if (!transcribedText) {
            throw new Error("No speech detected. Please try again.");
        }

        // Simple language detection fallback: check for French words in transcription
        if (detectedLanguage === "unknown" || !detectedLanguage) {
            const frenchWords = /\b(bonjour|merci|oui|non|je|tu|il|est|dans|pour|avec|sur)\b/i;
            detectedLanguage = frenchWords.test(transcribedText) ? "fr" : "en";
            console.log("Fallback language detection:", detectedLanguage);
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
            // Default to English if still unknown
            console.warn("Language still unknown, defaulting to English→French");
            targetLanguage = "French";
            sourceLanguageCode = "eng_Latn";
            targetLanguageCode = "fra_Latn";
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
