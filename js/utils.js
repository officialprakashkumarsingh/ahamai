// Utility functions for AhamAI
class Utils {
    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format timestamp
    static formatTimestamp(timestamp = Date.now()) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Escape HTML to prevent XSS
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Parse markdown-like formatting
    static parseMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof Array) {
            return obj.map(item => Utils.deepClone(item));
        }
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // Check if string contains any of the keywords
    static containsKeywords(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    }

    // Extract URLs from text
    static extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    // Truncate text with ellipsis
    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength - 3) + '...';
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (fallbackErr) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    // Download content as file
    static downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if device is mobile
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Check if device supports touch
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Get browser information
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';
        
        return {
            name: browser,
            userAgent: ua,
            isMobile: Utils.isMobile(),
            isTouch: Utils.isTouchDevice()
        };
    }

    // Local storage helpers
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Failed to read from localStorage:', error);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('Failed to remove from localStorage:', error);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
                return false;
            }
        }
    };

    // URL helpers
    static url = {
        getParams() {
            return new URLSearchParams(window.location.search);
        },

        getParam(name, defaultValue = null) {
            const params = Utils.url.getParams();
            return params.get(name) || defaultValue;
        },

        setParam(name, value) {
            const url = new URL(window.location);
            url.searchParams.set(name, value);
            window.history.pushState({}, '', url);
        },

        removeParam(name) {
            const url = new URL(window.location);
            url.searchParams.delete(name);
            window.history.pushState({}, '', url);
        }
    };

    // Animation helpers
    static animate = {
        fadeIn(element, duration = 300) {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const start = performance.now();
            
            function frame(timestamp) {
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(frame);
                }
            }
            
            requestAnimationFrame(frame);
        },

        fadeOut(element, duration = 300) {
            const start = performance.now();
            const startOpacity = parseFloat(getComputedStyle(element).opacity);
            
            function frame(timestamp) {
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = startOpacity * (1 - progress);
                
                if (progress >= 1) {
                    element.style.display = 'none';
                } else {
                    requestAnimationFrame(frame);
                }
            }
            
            requestAnimationFrame(frame);
        },

        slideUp(element, duration = 300) {
            const height = element.offsetHeight;
            element.style.height = height + 'px';
            element.style.overflow = 'hidden';
            
            const start = performance.now();
            
            function frame(timestamp) {
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (height * (1 - progress)) + 'px';
                
                if (progress >= 1) {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                } else {
                    requestAnimationFrame(frame);
                }
            }
            
            requestAnimationFrame(frame);
        }
    };

    // Error handling
    static handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // You can extend this to send errors to a logging service
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        // For now, just log to console
        console.error('Error details:', errorInfo);
        
        return errorInfo;
    }

    // Performance monitoring
    static performance = {
        marks: new Map(),
        
        mark(name) {
            Utils.performance.marks.set(name, performance.now());
        },
        
        measure(name, startMark) {
            const start = Utils.performance.marks.get(startMark);
            const end = performance.now();
            const duration = end - start;
            
            console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
            return duration;
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}