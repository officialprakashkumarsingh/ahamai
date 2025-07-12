// Gemini API integration for AhamAI
class GeminiAPI {
    constructor() {
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.apiUrl = CONFIG.GEMINI_API_URL;
        this.conversationHistory = [];
        this.maxHistoryLength = CONFIG.MAX_CONVERSATION_HISTORY;
    }

    // Main method to send message to Gemini
    async sendMessage(message, options = {}) {
        try {
            Utils.performance.mark('gemini-request-start');
            
            // Prepare the request payload
            const payload = this.preparePayload(message, options);
            
            // Make the API request
            const response = await this.makeRequest(payload);
            
            // Process the response
            const result = await this.processResponse(response, message);
            
            Utils.performance.measure('gemini-request', 'gemini-request-start');
            
            return result;
            
        } catch (error) {
            Utils.handleError(error, 'GeminiAPI.sendMessage');
            throw new Error(CONFIG.ERROR_MESSAGES.API_ERROR);
        }
    }

    // Prepare the request payload for Gemini API
    preparePayload(message, options = {}) {
        const systemPrompt = this.generateSystemPrompt();
        const conversationContext = this.buildConversationContext();
        
        const contents = [
            {
                role: 'user',
                parts: [{
                    text: `${systemPrompt}\n\n${conversationContext}\n\nUser: ${message}`
                }]
            }
        ];

        return {
            contents: contents,
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxTokens || 2048,
                stopSequences: options.stopSequences || []
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
            ]
        };
    }

    // Generate system prompt with tool instructions
    generateSystemPrompt() {
        return `You are AhamAI, an advanced AI assistant powered by Gemini 2.5-flash. You are helpful, intelligent, and capable of understanding context and providing accurate information.

IMPORTANT INSTRUCTIONS:
1. You can generate presentations, diagrams, and visual content
2. You have access to external tools like Wikipedia and DuckDuckGo search
3. You should automatically decide when to use these tools based on user requests
4. When users ask for presentations, respond with a structured format that can be converted to slides
5. When users ask for diagrams, provide Mermaid.js syntax
6. When users need current information or want to search for something, indicate that you'll search for it
7. Be conversational, helpful, and engaging
8. Use the tools intelligently - don't mention them unless you're using them

TOOL USAGE INDICATORS:
- For presentations: Start response with [PRESENTATION] and provide structured slide content
- For diagrams: Start response with [DIAGRAM] and provide Mermaid syntax
- For Wikipedia search: Start response with [WIKIPEDIA:search_term] 
- For general search: Start response with [SEARCH:search_term]
- For visual content: Start response with [VISUAL] and describe what should be created

Remember: You should decide automatically when to use these tools based on the user's request. Don't ask permission - just use them when appropriate.`;
    }

    // Build conversation context from history
    buildConversationContext() {
        if (this.conversationHistory.length === 0) {
            return '';
        }

        const recentHistory = this.conversationHistory.slice(-10); // Last 10 messages
        return recentHistory.map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');
    }

    // Make the actual API request
    async makeRequest(payload) {
        const url = `${this.apiUrl}?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API Error:', errorData);
            
            if (response.status === 429) {
                throw new Error(CONFIG.ERROR_MESSAGES.RATE_LIMIT);
            } else if (response.status >= 500) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            } else {
                throw new Error(CONFIG.ERROR_MESSAGES.API_ERROR);
            }
        }

        return response.json();
    }

    // Process the API response
    async processResponse(response, originalMessage) {
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('No response generated');
        }

        const candidate = response.candidates[0];
        const content = candidate.content?.parts?.[0]?.text || '';

        if (!content) {
            throw new Error('Empty response from API');
        }

        // Add to conversation history
        this.addToHistory('user', originalMessage);
        this.addToHistory('assistant', content);

        // Analyze response for tool usage
        const toolAnalysis = this.analyzeToolUsage(content);

        return {
            content: content,
            rawResponse: response,
            toolUsage: toolAnalysis,
            finishReason: candidate.finishReason
        };
    }

    // Analyze response for tool usage indicators
    analyzeToolUsage(content) {
        const toolUsage = {
            presentation: false,
            diagram: false,
            wikipedia: false,
            search: false,
            visual: false,
            searchTerm: null,
            wikipediaTerm: null
        };

        // Check for tool indicators
        if (content.startsWith('[PRESENTATION]')) {
            toolUsage.presentation = true;
        }
        
        if (content.startsWith('[DIAGRAM]')) {
            toolUsage.diagram = true;
        }
        
        const wikipediaMatch = content.match(/^\[WIKIPEDIA:(.+?)\]/);
        if (wikipediaMatch) {
            toolUsage.wikipedia = true;
            toolUsage.wikipediaTerm = wikipediaMatch[1];
        }
        
        const searchMatch = content.match(/^\[SEARCH:(.+?)\]/);
        if (searchMatch) {
            toolUsage.search = true;
            toolUsage.searchTerm = searchMatch[1];
        }
        
        if (content.startsWith('[VISUAL]')) {
            toolUsage.visual = true;
        }

        return toolUsage;
    }

    // Add message to conversation history
    addToHistory(role, content) {
        this.conversationHistory.push({
            role: role,
            content: content,
            timestamp: Date.now()
        });

        // Limit history length
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory.shift();
        }

        // Save to localStorage
        Utils.storage.set(CONFIG.STORAGE_KEYS.CONVERSATION_HISTORY, this.conversationHistory);
    }

    // Load conversation history from localStorage
    loadHistory() {
        const saved = Utils.storage.get(CONFIG.STORAGE_KEYS.CONVERSATION_HISTORY, []);
        this.conversationHistory = saved;
    }

    // Clear conversation history
    clearHistory() {
        this.conversationHistory = [];
        Utils.storage.remove(CONFIG.STORAGE_KEYS.CONVERSATION_HISTORY);
    }

    // Get conversation history
    getHistory() {
        return [...this.conversationHistory];
    }

    // Generate a follow-up question or suggestion
    async generateFollowUp(context) {
        try {
            const response = await this.sendMessage(
                `Based on our conversation, suggest a relevant follow-up question or topic. Keep it brief and engaging. Context: ${context}`,
                { maxTokens: 100, temperature: 0.8 }
            );
            
            return response.content.trim();
        } catch (error) {
            Utils.handleError(error, 'GeminiAPI.generateFollowUp');
            return null;
        }
    }

    // Generate a summary of the conversation
    async generateSummary() {
        if (this.conversationHistory.length < 4) {
            return null;
        }

        try {
            const context = this.buildConversationContext();
            const response = await this.sendMessage(
                `Provide a brief summary of our conversation in 2-3 sentences. Focus on the main topics discussed. Context: ${context}`,
                { maxTokens: 150, temperature: 0.5 }
            );
            
            return response.content.trim();
        } catch (error) {
            Utils.handleError(error, 'GeminiAPI.generateSummary');
            return null;
        }
    }

    // Extract structured data from text
    async extractStructuredData(text, schema) {
        try {
            const prompt = `Extract structured data from the following text according to this schema: ${JSON.stringify(schema)}. Return only valid JSON.\n\nText: ${text}`;
            
            const response = await this.sendMessage(prompt, {
                temperature: 0.1,
                maxTokens: 1000
            });
            
            // Try to parse JSON from response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return null;
        } catch (error) {
            Utils.handleError(error, 'GeminiAPI.extractStructuredData');
            return null;
        }
    }

    // Check if the API is available
    async checkHealth() {
        try {
            const response = await this.sendMessage('Hello', { maxTokens: 10 });
            return response.content.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Get API usage statistics (if available in response)
    getUsageStats() {
        // This would be populated from API responses if Gemini provides usage stats
        return {
            totalTokens: 0,
            promptTokens: 0,
            completionTokens: 0,
            requestCount: this.conversationHistory.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAPI;
}