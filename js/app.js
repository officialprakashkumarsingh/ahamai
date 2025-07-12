// Main application file for AhamAI
class AhamAI {
    constructor() {
        this.geminiAPI = null;
        this.offlineAI = null;
        this.mcpServer = null;
        this.externalTools = null;
        this.presentationGenerator = null;
        this.diagramGenerator = null;
        this.uiManager = null;
        
        this.isInitialized = false;
        this.conversationContext = [];
        this.isOfflineMode = false;
        
        this.init();
    }

    // Initialize the application
    async init() {
        try {
            console.log('Initializing AhamAI...');
            Utils.performance.mark('app-init-start');
            
            // Initialize components
            this.geminiAPI = new GeminiAPI();
            this.offlineAI = new OfflineAI();
            this.mcpServer = new MCPServer();
            this.externalTools = new ExternalTools();
            this.presentationGenerator = new PresentationGenerator();
            this.diagramGenerator = new DiagramGenerator();
            this.uiManager = new UIManager();
            
            // Initialize MCP server support
            await this.mcpServer.initialize();
            
            // Load conversation history
            this.geminiAPI.loadHistory();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check API health
            const isAPIHealthy = await this.checkAPIHealth();
            if (!isAPIHealthy) {
                console.warn('API health check failed, switching to offline mode');
                this.isOfflineMode = true;
            }
            
            this.isInitialized = true;
            Utils.performance.measure('app-initialized', 'app-init-start');
            
            console.log('AhamAI initialized successfully');
            
            // Focus on input
            this.uiManager.focusInput();
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.init');
            this.handleInitializationError(error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Message sending
        document.addEventListener('sendMessage', (event) => {
            this.handleSendMessage(event.detail.message);
        });
        
        // Chat clearing
        document.addEventListener('clearChat', () => {
            this.handleClearChat();
        });
        
        // Regenerate message
        document.addEventListener('regenerateMessage', (event) => {
            this.handleRegenerateMessage(event.detail.messageId);
        });
        
        // Download events
        document.addEventListener('downloadPresentation', () => {
            this.handleDownloadPresentation();
        });
        
        document.addEventListener('downloadDiagram', () => {
            this.handleDownloadDiagram();
        });
        
        // Error handling
        window.addEventListener('error', (event) => {
            Utils.handleError(event.error, 'Global error handler');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            Utils.handleError(event.reason, 'Unhandled promise rejection');
        });
    }

    // Handle sending a message
    async handleSendMessage(message) {
        if (!this.isInitialized || !message.trim()) {
            return;
        }

        try {
            Utils.performance.mark('message-processing-start');
            
            // Add user message to UI
            this.uiManager.addMessage(message, true);
            this.uiManager.clearInput();
            this.uiManager.showLoading();
            
            // Process the message
            const response = await this.processMessage(message);
            
            // Handle the response
            await this.handleResponse(response, message);
            
            Utils.performance.measure('message-processed', 'message-processing-start');
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleSendMessage');
            this.handleError(error);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    // Process message with AI (online or offline)
    async processMessage(message) {
        try {
            let response;
            
            // Try online mode first, fall back to offline
            if (!this.isOfflineMode) {
                try {
                    response = await this.geminiAPI.sendMessage(message);
                } catch (error) {
                    console.warn('Online processing failed, switching to offline mode:', error);
                    this.isOfflineMode = true;
                }
            }
            
            // Use offline mode if online failed or if already in offline mode
            if (this.isOfflineMode) {
                response = await this.offlineAI.processMessage(message);
                
                // For offline responses, handle special types
                if (response.type === 'diagram') {
                    // Generate diagram using offline AI
                    const diagramResult = await this.diagramGenerator.generateDiagram(response.diagramSyntax);
                    response.diagramGenerated = diagramResult.success;
                    response.diagramId = diagramResult.diagramId;
                } else if (response.type === 'presentation') {
                    // Generate presentation using offline AI
                    const presentationResult = await this.presentationGenerator.generatePresentation(response.title, response.slides);
                    response.presentationGenerated = presentationResult.success;
                    response.presentationId = presentationResult.presentationId;
                }
            }
            
            return response;
            
        } catch (error) {
            console.error('Failed to process message:', error);
            throw error;
        }
    }

    // Handle AI response (online or offline)
    async handleResponse(response, originalMessage) {
        // Handle offline responses
        if (this.isOfflineMode && typeof response === 'object') {
            if (response.type === 'diagram') {
                await this.handleOfflineDiagramGeneration(response);
            } else if (response.type === 'presentation') {
                await this.handleOfflinePresentationGeneration(response);
            } else {
                // Regular offline response
                this.uiManager.addMessage(response.text, false, { typeAnimation: true });
            }
            return;
        }
        
        // Handle online responses (original logic)
        const { content, toolUsage } = response || { content: response, toolUsage: {} };
        
        // Check if tools need to be used
        if (toolUsage && (toolUsage.search || toolUsage.wikipedia)) {
            await this.handleSearchTools(content, toolUsage, originalMessage);
        } else if (toolUsage && toolUsage.presentation) {
            await this.handlePresentationGeneration(content);
        } else if (toolUsage && toolUsage.diagram) {
            await this.handleDiagramGeneration(content);
        } else {
            // Regular response
            this.uiManager.addMessage(content || response, false, { typeAnimation: true });
        }
    }

    // Handle search tools (Wikipedia/DuckDuckGo)
    async handleSearchTools(content, toolUsage, originalMessage) {
        try {
            let searchResult = null;
            
            // Determine search source and query
            if (toolUsage.wikipedia) {
                this.uiManager.showLoading('Searching Wikipedia...');
                searchResult = await this.externalTools.search(toolUsage.wikipediaTerm, 'wikipedia');
            } else if (toolUsage.search) {
                this.uiManager.showLoading('Searching the web...');
                searchResult = await this.externalTools.search(toolUsage.searchTerm, 'auto');
            }
            
            if (searchResult && searchResult.success) {
                // Format search results and generate AI response
                const searchSummary = this.externalTools.formatResultsForDisplay(searchResult);
                
                // Get AI to process the search results
                const enhancedResponse = await this.geminiAPI.sendMessage(
                    `Based on this search information, provide a comprehensive answer to the user's question: "${originalMessage}"\n\nSearch results:\n${searchSummary}`,
                    { temperature: 0.7 }
                );
                
                this.uiManager.addMessage(enhancedResponse.content, false, { typeAnimation: true });
            } else {
                // Search failed, show AI's original response
                const cleanContent = content.replace(/^\[(?:SEARCH|WIKIPEDIA):[^\]]+\]\s*/, '');
                this.uiManager.addMessage(cleanContent || 'I apologize, but I was unable to search for that information right now.', false);
            }
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleSearchTools');
            this.uiManager.addMessage('I encountered an error while searching. Let me try to answer based on my existing knowledge.', false);
        }
    }

    // Handle presentation generation
    async handlePresentationGeneration(content) {
        try {
            this.uiManager.showLoading('Generating presentation...');
            
            const result = await this.presentationGenerator.generatePresentation(content);
            
            if (result.success) {
                // Show success message
                this.uiManager.addMessage(`${CONFIG.SUCCESS_MESSAGES.PRESENTATION_GENERATED} I've created a ${result.slideCount}-slide presentation for you.`, false);
                
                // Initialize and show presentation
                await this.presentationGenerator.initializeReveal();
                this.uiManager.showModal('presentation');
            } else {
                throw new Error(result.error || 'Failed to generate presentation');
            }
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handlePresentationGeneration');
            this.uiManager.addMessage('I apologize, but I encountered an issue while generating the presentation. Let me provide the information in text format instead.', false);
            
            // Fallback: show content as regular message
            const cleanContent = content.replace(/^\[PRESENTATION\]\s*/, '');
            this.uiManager.addMessage(cleanContent, false);
        }
    }

    // Handle offline diagram generation
    async handleOfflineDiagramGeneration(response) {
        try {
            this.uiManager.showLoading('Generating diagram...');
            
            // Add the AI message first
            this.uiManager.addMessage(response.text, false, { typeAnimation: true });
            
            // Generate the diagram
            const result = await this.diagramGenerator.generateDiagram(response.diagramSyntax);
            
            if (result.success) {
                // Show diagram in a modal or container
                this.uiManager.showModal('diagram', {
                    title: response.title || 'Generated Diagram',
                    content: result.svgContent,
                    diagramId: result.diagramId
                });
                
                this.uiManager.showSuccessMessage(CONFIG.SUCCESS_MESSAGES.DIAGRAM_GENERATED);
            } else {
                this.uiManager.showErrorMessage('Failed to generate diagram: ' + result.error);
            }
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleOfflineDiagramGeneration');
            this.uiManager.showErrorMessage('Error generating diagram');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    // Handle offline presentation generation
    async handleOfflinePresentationGeneration(response) {
        try {
            this.uiManager.showLoading('Creating presentation...');
            
            // Add the AI message first
            this.uiManager.addMessage(response.text, false, { typeAnimation: true });
            
            // Generate the presentation
            const result = await this.presentationGenerator.generatePresentation(response.title, response.slides);
            
            if (result.success) {
                // Show presentation in modal
                this.uiManager.showModal('presentation', {
                    title: response.title,
                    slides: response.slides,
                    presentationId: result.presentationId
                });
                
                this.uiManager.showSuccessMessage(CONFIG.SUCCESS_MESSAGES.PRESENTATION_GENERATED);
            } else {
                this.uiManager.showErrorMessage('Failed to create presentation: ' + result.error);
            }
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleOfflinePresentationGeneration');
            this.uiManager.showErrorMessage('Error creating presentation');
        } finally {
            this.uiManager.hideLoading();
        }
    }
    async handleDiagramGeneration(content) {
        try {
            this.uiManager.showLoading('Generating diagram...');
            
            const result = await this.diagramGenerator.generateDiagram(content);
            
            if (result.success) {
                // Show success message
                this.uiManager.addMessage(`${CONFIG.SUCCESS_MESSAGES.DIAGRAM_GENERATED} I've created a ${result.type} diagram for you.`, false);
                
                // Display diagram and show modal
                this.diagramGenerator.displayDiagram();
                this.uiManager.showModal('diagram');
            } else {
                throw new Error(result.error || 'Failed to generate diagram');
            }
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleDiagramGeneration');
            this.uiManager.addMessage('I apologize, but I encountered an issue while generating the diagram. Let me describe the concept instead.', false);
            
            // Fallback: show content as regular message
            const cleanContent = content.replace(/^\[DIAGRAM\]\s*/, '');
            this.uiManager.addMessage(cleanContent, false);
        }
    }

    // Handle chat clearing
    handleClearChat() {
        this.geminiAPI.clearHistory();
        this.conversationContext = [];
        console.log('Chat cleared');
    }

    // Handle message regeneration
    async handleRegenerateMessage(messageId) {
        try {
            // Get the last user message
            const history = this.geminiAPI.getHistory();
            const lastUserMessage = history.filter(msg => msg.role === 'user').pop();
            
            if (!lastUserMessage) {
                this.uiManager.showToast('No message to regenerate', 'error');
                return;
            }
            
            this.uiManager.showLoading('Regenerating response...');
            
            // Remove the last assistant response from history
            const filteredHistory = history.filter(msg => 
                !(msg.role === 'assistant' && msg.timestamp >= lastUserMessage.timestamp)
            );
            
            // Update history
            this.geminiAPI.conversationHistory = filteredHistory;
            
            // Process the message again
            const response = await this.processMessage(lastUserMessage.content);
            
            // Remove the old message from UI
            const messageElement = this.uiManager.messageElements.get(messageId);
            if (messageElement) {
                messageElement.remove();
                this.uiManager.messageElements.delete(messageId);
            }
            
            // Handle the new response
            await this.handleResponse(response, lastUserMessage.content);
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleRegenerateMessage');
            this.uiManager.showToast('Failed to regenerate message', 'error');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    // Handle presentation download
    handleDownloadPresentation() {
        try {
            if (!this.presentationGenerator.currentPresentation) {
                this.uiManager.showToast('No presentation to download', 'error');
                return;
            }
            
            const html = this.presentationGenerator.exportAsHtml('AhamAI Presentation');
            const filename = `ahamai-presentation-${new Date().toISOString().split('T')[0]}.html`;
            
            Utils.downloadFile(html, filename, 'text/html');
            this.uiManager.showToast('Presentation downloaded successfully');
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleDownloadPresentation');
            this.uiManager.showToast('Failed to download presentation', 'error');
        }
    }

    // Handle diagram download
    async handleDownloadDiagram() {
        try {
            if (!this.diagramGenerator.currentDiagram) {
                this.uiManager.showToast('No diagram to download', 'error');
                return;
            }
            
            const filename = `ahamai-diagram-${new Date().toISOString().split('T')[0]}.png`;
            await this.diagramGenerator.exportAsPng(filename);
            this.uiManager.showToast('Diagram downloaded successfully');
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.handleDownloadDiagram');
            this.uiManager.showToast('Failed to download diagram', 'error');
        }
    }

    // Check API health
    async checkAPIHealth() {
        try {
            const isHealthy = await this.geminiAPI.checkHealth();
            if (!isHealthy) {
                console.warn('API health check failed');
                this.uiManager.showToast('API connection issue detected', 'warning');
            }
        } catch (error) {
            console.warn('API health check failed:', error);
        }
    }

    // Handle initialization error
    handleInitializationError(error) {
        console.error('Failed to initialize AhamAI:', error);
        
        // Show error message to user
        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
        `;
        errorElement.innerHTML = `
            <h3>Initialization Error</h3>
            <p>Failed to initialize AhamAI. Please refresh the page and try again.</p>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #f44336;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">Refresh Page</button>
        `;
        
        document.body.appendChild(errorElement);
    }

    // Handle general errors
    handleError(error) {
        console.error('Application error:', error);
        
        let errorMessage = CONFIG.ERROR_MESSAGES.API_ERROR;
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
        } else if (error.message.includes('rate limit')) {
            errorMessage = CONFIG.ERROR_MESSAGES.RATE_LIMIT;
        }
        
        this.uiManager.addMessage(errorMessage, false);
    }

    // Get application statistics
    getStats() {
        return {
            initialized: this.isInitialized,
            conversationLength: this.geminiAPI ? this.geminiAPI.getHistory().length : 0,
            uiState: this.uiManager ? this.uiManager.getState() : null,
            presentationStats: this.presentationGenerator ? this.presentationGenerator.getPresentationStats() : null,
            diagramStats: this.diagramGenerator ? this.diagramGenerator.getDiagramStats() : null,
            searchStats: this.externalTools ? this.externalTools.getSearchStats() : null,
            browserInfo: Utils.getBrowserInfo()
        };
    }

    // Export conversation
    exportConversation() {
        try {
            const history = this.geminiAPI.getHistory();
            const conversation = {
                exportedAt: new Date().toISOString(),
                messageCount: history.length,
                messages: history
            };
            
            const filename = `ahamai-conversation-${new Date().toISOString().split('T')[0]}.json`;
            Utils.downloadFile(JSON.stringify(conversation, null, 2), filename, 'application/json');
            
            this.uiManager.showToast('Conversation exported successfully');
            
        } catch (error) {
            Utils.handleError(error, 'AhamAI.exportConversation');
            this.uiManager.showToast('Failed to export conversation', 'error');
        }
    }

    // Cleanup
    destroy() {
        if (this.presentationGenerator) {
            this.presentationGenerator.destroy();
        }
        
        if (this.diagramGenerator) {
            this.diagramGenerator.clearDiagram();
        }
        
        if (this.externalTools) {
            this.externalTools.clearCache();
        }
        
        console.log('AhamAI destroyed');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AhamAI...');
    window.ahamAI = new AhamAI();
});

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Service worker registration (for future PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration can be added here in the future
    });
}

// Export for use in other modules or debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AhamAI;
}