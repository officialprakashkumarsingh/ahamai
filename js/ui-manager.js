// UI Manager for AhamAI - handles all user interface interactions
class UIManager {
    constructor() {
        this.elements = {};
        this.isLoading = false;
        this.currentTheme = 'light';
        this.messageElements = new Map();
        this.typingTimeouts = new Map();
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadUserPreferences();
    }

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            // Main containers
            chatContainer: document.getElementById('chat-container'),
            messagesContainer: document.getElementById('messages'),
            inputArea: document.querySelector('.input-area'),
            
            // Input elements
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            characterCount: document.querySelector('.character-count'),
            
            // Header elements
            clearChatButton: document.getElementById('clear-chat'),
            themeToggle: document.getElementById('toggle-theme'),
            
            // Loading overlay
            loadingOverlay: document.getElementById('loading-overlay'),
            
            // Modals
            presentationModal: document.getElementById('presentation-modal'),
            diagramModal: document.getElementById('diagram-modal'),
            
            // Modal controls
            closePresentationButton: document.getElementById('close-presentation'),
            closeDiagramButton: document.getElementById('close-diagram'),
            fullscreenPresentationButton: document.getElementById('fullscreen-presentation'),
            downloadPresentationButton: document.getElementById('download-presentation'),
            downloadDiagramButton: document.getElementById('download-diagram'),
            
            // Welcome message
            welcomeMessage: document.querySelector('.welcome-message')
        };
    }

    // Setup event listeners
    setupEventListeners() {
        // Input handling
        this.elements.messageInput.addEventListener('input', (e) => this.handleInputChange(e));
        this.elements.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // Header controls
        this.elements.clearChatButton.addEventListener('click', () => this.clearChat());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Modal controls
        this.elements.closePresentationButton.addEventListener('click', () => this.closeModal('presentation'));
        this.elements.closeDiagramButton.addEventListener('click', () => this.closeModal('diagram'));
        this.elements.fullscreenPresentationButton.addEventListener('click', () => this.togglePresentationFullscreen());
        this.elements.downloadPresentationButton.addEventListener('click', () => this.downloadPresentation());
        this.elements.downloadDiagramButton.addEventListener('click', () => this.downloadDiagram());
        
        // Modal background clicks
        this.elements.presentationModal.addEventListener('click', (e) => {
            if (e.target === this.elements.presentationModal) {
                this.closeModal('presentation');
            }
        });
        
        this.elements.diagramModal.addEventListener('click', (e) => {
            if (e.target === this.elements.diagramModal) {
                this.closeModal('diagram');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
        
        // Resize handling
        window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250));
        
        // Auto-resize textarea
        this.setupAutoResize();
    }

    // Handle input changes
    handleInputChange(event) {
        const input = event.target;
        const length = input.value.length;
        const maxLength = CONFIG.MAX_MESSAGE_LENGTH;
        
        // Update character count
        this.elements.characterCount.textContent = `${length} / ${maxLength}`;
        
        // Update send button state
        this.elements.sendButton.disabled = length === 0 || length > maxLength;
        
        // Auto-resize textarea
        this.autoResizeTextarea(input);
    }

    // Handle key down events
    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!this.elements.sendButton.disabled && !this.isLoading) {
                this.handleSendMessage();
            }
        }
    }

    // Handle global keyboard shortcuts
    handleGlobalKeyDown(event) {
        // Ctrl/Cmd + Enter to send message
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            if (!this.elements.sendButton.disabled && !this.isLoading) {
                this.handleSendMessage();
            }
        }
        
        // Escape to close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
        
        // Ctrl/Cmd + K to focus input
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.elements.messageInput.focus();
        }
    }

    // Setup auto-resize for textarea
    setupAutoResize() {
        this.elements.messageInput.style.height = 'auto';
        this.elements.messageInput.style.overflowY = 'hidden';
    }

    // Auto-resize textarea
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const maxHeight = 150; // Max height in pixels
        
        if (scrollHeight > maxHeight) {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.height = scrollHeight + 'px';
            textarea.style.overflowY = 'hidden';
        }
    }

    // Handle send message
    handleSendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.isLoading) return;
        
        // Emit custom event for message sending
        const sendEvent = new CustomEvent('sendMessage', {
            detail: { message: message }
        });
        
        document.dispatchEvent(sendEvent);
    }

    // Add message to chat
    addMessage(message, isUser = false, options = {}) {
        const messageId = Utils.generateId();
        const messageElement = this.createMessageElement(message, isUser, messageId, options);
        
        // Hide welcome message if this is the first message
        if (this.elements.welcomeMessage && this.elements.messagesContainer.children.length === 0) {
            Utils.animate.fadeOut(this.elements.welcomeMessage);
        }
        
        // Add to container
        this.elements.messagesContainer.appendChild(messageElement);
        this.messageElements.set(messageId, messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Type animation for AI messages
        if (!isUser && options.typeAnimation) {
            this.typeMessage(messageId, message);
        }
        
        return messageId;
    }

    // Create message element
    createMessageElement(message, isUser, messageId, options = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        messageDiv.setAttribute('data-message-id', messageId);
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? 'U' : 'AI';
        
        // Content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Message bubble
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        if (options.typeAnimation && !isUser) {
            bubble.innerHTML = '<span class="typing-cursor">|</span>';
        } else {
            bubble.innerHTML = Utils.parseMarkdown(Utils.escapeHtml(message));
        }
        
        contentDiv.appendChild(bubble);
        
        // Message actions (for assistant messages)
        if (!isUser) {
            const actionsDiv = this.createMessageActions(messageId, message);
            contentDiv.appendChild(actionsDiv);
        }
        
        // Timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = Utils.formatTimestamp();
        contentDiv.appendChild(timestamp);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
    }

    // Create message actions
    createMessageActions(messageId, message) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => this.copyMessage(message);
        
        // Regenerate button
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'action-btn';
        regenerateBtn.textContent = 'Regenerate';
        regenerateBtn.onclick = () => this.regenerateMessage(messageId);
        
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(regenerateBtn);
        
        return actionsDiv;
    }

    // Type message animation
    typeMessage(messageId, message) {
        const messageElement = this.messageElements.get(messageId);
        if (!messageElement) return;
        
        const bubble = messageElement.querySelector('.message-bubble');
        if (!bubble) return;
        
        const words = message.split(' ');
        let currentWordIndex = 0;
        let currentText = '';
        
        // Clear initial content
        bubble.innerHTML = '<span class="typing-cursor">|</span>';
        
        const typeNextWord = () => {
            if (currentWordIndex >= words.length) {
                // Typing complete
                bubble.innerHTML = Utils.parseMarkdown(Utils.escapeHtml(message));
                this.typingTimeouts.delete(messageId);
                return;
            }
            
            currentText += (currentWordIndex > 0 ? ' ' : '') + words[currentWordIndex];
            bubble.innerHTML = Utils.parseMarkdown(Utils.escapeHtml(currentText)) + '<span class="typing-cursor">|</span>';
            
            currentWordIndex++;
            
            // Schedule next word
            const timeout = setTimeout(typeNextWord, CONFIG.TYPING_DELAY);
            this.typingTimeouts.set(messageId, timeout);
        };
        
        // Start typing
        typeNextWord();
    }

    // Update message content (for streaming responses)
    updateMessage(messageId, newContent) {
        const messageElement = this.messageElements.get(messageId);
        if (!messageElement) return;
        
        const bubble = messageElement.querySelector('.message-bubble');
        if (bubble) {
            bubble.innerHTML = Utils.parseMarkdown(Utils.escapeHtml(newContent));
            this.scrollToBottom();
        }
    }

    // Clear input
    clearInput() {
        this.elements.messageInput.value = '';
        this.elements.characterCount.textContent = '0 / ' + CONFIG.MAX_MESSAGE_LENGTH;
        this.elements.sendButton.disabled = true;
        this.autoResizeTextarea(this.elements.messageInput);
    }

    // Show loading state
    showLoading(message = 'AhamAI is thinking...') {
        this.isLoading = true;
        this.elements.loadingOverlay.querySelector('p').textContent = message;
        this.elements.loadingOverlay.classList.add('show');
        this.elements.sendButton.disabled = true;
    }

    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        this.elements.loadingOverlay.classList.remove('show');
        this.updateSendButtonState();
    }

    // Update send button state
    updateSendButtonState() {
        const hasContent = this.elements.messageInput.value.trim().length > 0;
        const withinLimit = this.elements.messageInput.value.length <= CONFIG.MAX_MESSAGE_LENGTH;
        this.elements.sendButton.disabled = !hasContent || !withinLimit || this.isLoading;
    }

    // Clear chat
    clearChat() {
        if (confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
            this.elements.messagesContainer.innerHTML = '';
            this.messageElements.clear();
            
            // Clear any typing timeouts
            this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
            this.typingTimeouts.clear();
            
            // Show welcome message
            if (this.elements.welcomeMessage) {
                this.elements.welcomeMessage.style.display = 'block';
                this.elements.welcomeMessage.style.opacity = '1';
            }
            
            // Emit clear event
            document.dispatchEvent(new CustomEvent('clearChat'));
        }
    }

    // Toggle theme
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        
        // Update theme toggle button
        this.elements.themeToggle.textContent = this.currentTheme === 'light' ? '🌓' : '☀️';
        
        // Save preference
        Utils.storage.set(CONFIG.STORAGE_KEYS.THEME, this.currentTheme);
    }

    // Show modal
    showModal(modalType, content = null) {
        let modal;
        
        switch (modalType) {
            case 'presentation':
                modal = this.elements.presentationModal;
                break;
            case 'diagram':
                modal = this.elements.diagramModal;
                break;
            default:
                return;
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close modal
    closeModal(modalType) {
        let modal;
        
        switch (modalType) {
            case 'presentation':
                modal = this.elements.presentationModal;
                break;
            case 'diagram':
                modal = this.elements.diagramModal;
                break;
            default:
                return;
        }
        
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Close all modals
    closeAllModals() {
        this.closeModal('presentation');
        this.closeModal('diagram');
    }

    // Toggle presentation fullscreen
    togglePresentationFullscreen() {
        const presentationContainer = document.getElementById('presentation-container');
        if (presentationContainer) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                presentationContainer.requestFullscreen();
            }
        }
    }

    // Download presentation
    downloadPresentation() {
        document.dispatchEvent(new CustomEvent('downloadPresentation'));
    }

    // Download diagram
    downloadDiagram() {
        document.dispatchEvent(new CustomEvent('downloadDiagram'));
    }

    // Copy message
    async copyMessage(message) {
        const success = await Utils.copyToClipboard(message);
        if (success) {
            this.showToast('Message copied to clipboard');
        } else {
            this.showToast('Failed to copy message', 'error');
        }
    }

    // Regenerate message
    regenerateMessage(messageId) {
        document.dispatchEvent(new CustomEvent('regenerateMessage', {
            detail: { messageId: messageId }
        }));
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Get color based on type
        let backgroundColor;
        switch (type) {
            case 'error':
                backgroundColor = '#da3633';
                break;
            case 'warning':
                backgroundColor = '#fb8500';
                break;
            case 'info':
                backgroundColor = '#0366d6';
                break;
            default:
                backgroundColor = '#2ea043';
        }
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: backgroundColor,
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Show success message
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    // Show error message
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    // Show warning message
    showWarningMessage(message) {
        this.showToast(message, 'warning');
    }

    // Show info message
    showInfoMessage(message) {
        this.showToast(message, 'info');
    }

    // Scroll to bottom of chat
    scrollToBottom(smooth = true) {
        const scrollOptions = {
            top: this.elements.chatContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        };
        
        this.elements.chatContainer.scrollTo(scrollOptions);
    }

    // Handle window resize
    handleResize() {
        // Adjust chat container height on mobile
        if (Utils.isMobile()) {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        // Re-scroll to bottom if at bottom
        const { scrollTop, scrollHeight, clientHeight } = this.elements.chatContainer;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        
        if (isAtBottom) {
            this.scrollToBottom(false);
        }
    }

    // Load user preferences
    loadUserPreferences() {
        // Load theme
        const savedTheme = Utils.storage.get(CONFIG.STORAGE_KEYS.THEME, 'light');
        if (savedTheme !== this.currentTheme) {
            this.toggleTheme();
        }
        
        // Load other preferences
        const preferences = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_PREFERENCES, {});
        
        // Apply preferences
        if (preferences.autoScroll !== undefined) {
            this.autoScroll = preferences.autoScroll;
        }
    }

    // Save user preferences
    saveUserPreferences() {
        const preferences = {
            theme: this.currentTheme,
            autoScroll: this.autoScroll
        };
        
        Utils.storage.set(CONFIG.STORAGE_KEYS.USER_PREFERENCES, preferences);
    }

    // Get UI state
    getState() {
        return {
            isLoading: this.isLoading,
            currentTheme: this.currentTheme,
            messageCount: this.messageElements.size,
            hasWelcomeMessage: this.elements.welcomeMessage && this.elements.welcomeMessage.style.display !== 'none'
        };
    }

    // Focus input
    focusInput() {
        this.elements.messageInput.focus();
    }

    // Disable input
    disableInput() {
        this.elements.messageInput.disabled = true;
        this.elements.sendButton.disabled = true;
    }

    // Enable input
    enableInput() {
        this.elements.messageInput.disabled = false;
        this.updateSendButtonState();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}