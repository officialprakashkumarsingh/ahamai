// Configuration file for AhamAI
const CONFIG = {
    // Gemini API Configuration
    GEMINI_API_KEY: 'AIzaSyBUiSSswKvLvEK7rydCCRPF50eIDI_KOGc',
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    
    // External APIs
    WIKIPEDIA_API_URL: 'https://en.wikipedia.org/api/rest_v1',
    DUCKDUCKGO_INSTANT_ANSWER_URL: 'https://api.duckduckgo.com/',
    
    // App Settings
    MAX_MESSAGE_LENGTH: 4000,
    MAX_CONVERSATION_HISTORY: 50,
    TYPING_DELAY: 50, // milliseconds per character
    
    // Tool Detection Keywords (AI will decide when to use these)
    TOOL_KEYWORDS: {
        PRESENTATION: ['presentation', 'slides', 'slideshow', 'powerpoint', 'present'],
        DIAGRAM: ['diagram', 'chart', 'flowchart', 'graph', 'visualization', 'flow', 'process'],
        SEARCH: ['search', 'find', 'look up', 'research', 'information about', 'what is', 'who is'],
        WIKIPEDIA: ['wikipedia', 'wiki', 'encyclopedia', 'facts about'],
        VISUAL: ['image', 'picture', 'visual', 'draw', 'sketch', 'illustration']
    },
    
    // Presentation Templates
    PRESENTATION_THEMES: {
        default: {
            background: '#ffffff',
            primary: '#4a90e2',
            secondary: '#757575',
            accent: '#4caf50'
        },
        dark: {
            background: '#1a1a1a',
            primary: '#ffffff',
            secondary: '#cccccc',
            accent: '#4a90e2'
        },
        minimal: {
            background: '#fafafa',
            primary: '#212121',
            secondary: '#757575',
            accent: '#ff5722'
        }
    },
    
    // Mermaid Diagram Configuration
    MERMAID_CONFIG: {
        theme: 'neutral',
        themeVariables: {
            primaryColor: '#4a90e2',
            primaryTextColor: '#212121',
            primaryBorderColor: '#e0e0e0',
            lineColor: '#757575',
            secondaryColor: '#f5f5f5',
            tertiaryColor: '#ffffff'
        },
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true
        },
        sequence: {
            useMaxWidth: true,
            wrap: true
        }
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        API_ERROR: 'Sorry, I encountered an issue while processing your request. Please try again.',
        NETWORK_ERROR: 'Unable to connect to the service. Please check your internet connection.',
        RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
        INVALID_INPUT: 'Please provide a valid input.',
        FEATURE_NOT_AVAILABLE: 'This feature is currently not available.',
        GENERATION_FAILED: 'Failed to generate the requested content. Please try rephrasing your request.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        PRESENTATION_GENERATED: 'Presentation generated successfully!',
        DIAGRAM_GENERATED: 'Diagram created successfully!',
        SEARCH_COMPLETED: 'Search completed successfully!',
        CONTENT_COPIED: 'Content copied to clipboard!'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        CONVERSATION_HISTORY: 'ahamai_conversation_history',
        USER_PREFERENCES: 'ahamai_user_preferences',
        THEME: 'ahamai_theme'
    }
};

// Feature flags for enabling/disabling functionality
const FEATURES = {
    PRESENTATION_GENERATION: true,
    DIAGRAM_GENERATION: true,
    WIKIPEDIA_INTEGRATION: true,
    DUCKDUCKGO_INTEGRATION: true,
    VISUAL_GENERATION: true,
    CONVERSATION_HISTORY: true,
    EXPORT_FUNCTIONALITY: true,
    VOICE_INPUT: false, // Future feature
    FILE_UPLOAD: false  // Future feature
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, FEATURES };
}