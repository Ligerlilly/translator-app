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
    speakBtn: document.getElementById("speakBtn"),
};

// Text-to-Speech function
function speakTranslation() {
    const translatedText = elements.translation.textContent;
    const targetLang = elements.targetLang.textContent.toLowerCase();
    
    if (!translatedText) {
        showStatus("No translation to speak!", "error");
        return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Wait for voices to load, then speak
    setTimeout(() => {
        // Get available voices
        const voices = window.speechSynthesis.getVoices();
        console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(translatedText);
        
        // Set language based on target
        const desiredLang = targetLang === 'french' ? 'fr' : 'en';
        utterance.lang = targetLang === 'french' ? 'fr-FR' : 'en-US';
        
        // Try to find a voice for the target language
        const matchingVoice = voices.find(voice => voice.lang.startsWith(desiredLang));
        if (matchingVoice) {
            utterance.voice = matchingVoice;
            console.log("Using voice:", matchingVoice.name, matchingVoice.lang);
        } else {
            console.warn(`No ${desiredLang} voice found, using default`);
            // Just use default voice - will still speak, even if accent is wrong
        }
        
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0; // Max volume
        
        // Add event handlers for debugging
        utterance.onstart = () => {
            console.log("Speech started");
            showStatus("🔊 Speaking...", "info");
        };
        utterance.onend = () => {
            console.log("Speech ended");
            showStatus("Translation complete!", "success");
        };
        utterance.onerror = (event) => {
            console.error("Speech error:", event.error);
            showStatus("Speech error: " + event.error, "error");
        };
        
        // Speak
        window.speechSynthesis.speak(utterance);
        
        console.log("Speaking:", translatedText, "in language:", utterance.lang);
    }, 100);
}

// Initialize Application
async function initializeApp() {
    showStatus("Initializing application...", "info");

    // Test if Transformers.js is properly imported
    console.log("Transformers.js pipeline available:", typeof pipeline);
    
    // Set up event listeners
    elements.recordBtn.addEventListener("click", startRecording);
    elements.stopBtn.addEventListener("click", stopRecording);
    elements.speakBtn.addEventListener("click", speakTranslation);

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
        // Keep results visible so user can read the translation while recording
        // elements.resultsSection.classList.add("hidden");
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
            "Xenova/whisper-base",
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

// Load Translation Model - using lighter Opus-MT models
async function loadTranslationModel(sourceLanguageCode, targetLanguageCode) {
    // Determine which model to use based on direction
    let modelName;
    const cacheKey = `${sourceLanguageCode}_${targetLanguageCode}`;
    
    if (sourceLanguageCode === "eng_Latn" && targetLanguageCode === "fra_Latn") {
        modelName = "Xenova/opus-mt-en-fr";
    } else if (sourceLanguageCode === "fra_Latn" && targetLanguageCode === "eng_Latn") {
        modelName = "Xenova/opus-mt-fr-en";
    } else {
        throw new Error("Unsupported translation direction");
    }

    // Check if we already have this model loaded
    if (state.translatorPipeline && state.translatorPipeline._cacheKey === cacheKey) {
        return state.translatorPipeline;
    }

    showLoading(`Loading ${sourceLanguageCode.startsWith('eng') ? 'EN→FR' : 'FR→EN'} translation model...`);

    try {
        console.log(`Loading translation model: ${modelName}`);
        const pipeline_inst = await pipeline("translation", modelName, {
            progress_callback: (progress) => {
                console.log("Translation model progress:", progress);
                if (progress.status === "downloading") {
                    const percent = Math.round(progress.progress || 0);
                    showLoading(`Downloading translation model: ${percent}%`);
                }
            }
        });
        
        // Cache the model with its direction
        pipeline_inst._cacheKey = cacheKey;
        state.translatorPipeline = pipeline_inst;
        
        console.log("Translation model loaded successfully");
        return pipeline_inst;
    } catch (error) {
        console.error("Error loading translation model:", error);
        throw new Error(`Failed to load translation model: ${error.message}`);
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

        // Get selected language from dropdown
        const directionSelect = document.getElementById('direction');
        const direction = directionSelect.value; // "en-fr" or "fr-en"
        const sourceLanguage = direction.startsWith('en') ? 'en' : 'fr';
        
        // Transcribe audio with the selected language
        const transcriptionResult = await whisper(audioData, {
            return_timestamps: true,
            chunk_length_s: 30,
            stride_length_s: 5,
            language: sourceLanguage, // Use selected language for better accuracy
            task: "transcribe",
        });

        const transcribedText = transcriptionResult.text.trim();
        
        console.log("Full transcription result:", transcriptionResult);
        console.log("Transcribed text:", transcribedText);
        console.log("Text length:", transcribedText.length);

        if (!transcribedText || transcribedText.length < 2) {
            showStatus("No clear speech detected. Please speak louder and longer (3-10 seconds).", "error");
            hideLoading();
            return;
        }

        // Check for Whisper hallucinations (repeated words/phrases)
        const words = transcribedText.split(/\s+/);
        if (words.length > 20) {
            // Count most repeated word
            const wordCounts = {};
            words.forEach(word => {
                const lower = word.toLowerCase();
                wordCounts[lower] = (wordCounts[lower] || 0) + 1;
            });
            const maxRepeats = Math.max(...Object.values(wordCounts));
            const repeatRatio = maxRepeats / words.length;
            
            if (repeatRatio > 0.3 || maxRepeats > 50) {
                showStatus("Audio quality too low. Please speak MUCH louder and closer to microphone.", "error");
                console.warn("Hallucination detected:", { maxRepeats, repeatRatio, transcribedText: transcribedText.substring(0, 200) });
                hideLoading();
                return;
            }
        }

        const detectedLanguage = sourceLanguage;
        console.log("Selected direction:", direction);
        console.log("Source language:", detectedLanguage);

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

        // Opus-MT models don't need src_lang/tgt_lang parameters
        const translationResult = await translator(transcribedText);

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
