// External tools integration for AhamAI (Wikipedia and DuckDuckGo)
class ExternalTools {
    constructor() {
        this.wikipediaBaseUrl = CONFIG.WIKIPEDIA_API_URL;
        this.duckDuckGoUrl = CONFIG.DUCKDUCKGO_INSTANT_ANSWER_URL;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Main method to search using the appropriate tool
    async search(query, source = 'auto') {
        try {
            Utils.performance.mark('search-start');
            
            // Clean and prepare query
            const cleanQuery = this.cleanQuery(query);
            
            // Check cache first
            const cached = this.getFromCache(cleanQuery, source);
            if (cached) {
                return cached;
            }

            let result;
            
            switch (source) {
                case 'wikipedia':
                    result = await this.searchWikipedia(cleanQuery);
                    break;
                case 'duckduckgo':
                    result = await this.searchDuckDuckGo(cleanQuery);
                    break;
                case 'auto':
                default:
                    // Automatically choose the best source
                    result = await this.autoSearch(cleanQuery);
                    break;
            }
            
            // Cache the result
            this.saveToCache(cleanQuery, source, result);
            
            Utils.performance.measure('search-complete', 'search-start');
            
            return result;
            
        } catch (error) {
            Utils.handleError(error, 'ExternalTools.search');
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    // Wikipedia search implementation
    async searchWikipedia(query) {
        try {
            // First, search for the page
            const searchUrl = `${this.wikipediaBaseUrl}/page/summary/${encodeURIComponent(query)}`;
            
            const response = await fetch(searchUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'AhamAI/1.0 (https://ahamai.app)'
                }
            });

            if (!response.ok) {
                // If direct summary fails, try search API
                return await this.searchWikipediaFallback(query);
            }

            const data = await response.json();
            
            return {
                source: 'wikipedia',
                query: query,
                success: true,
                results: [{
                    title: data.title,
                    summary: data.extract,
                    url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
                    thumbnail: data.thumbnail?.source || null,
                    type: 'summary'
                }],
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.warn('Wikipedia search failed:', error);
            return {
                source: 'wikipedia',
                query: query,
                success: false,
                error: error.message,
                results: [],
                timestamp: Date.now()
            };
        }
    }

    // Fallback Wikipedia search using search API
    async searchWikipediaFallback(query) {
        try {
            // Use OpenSearch API for better search results
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`;
            
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            if (!data || data.length < 4) {
                throw new Error('No search results found');
            }
            
            const titles = data[1];
            const descriptions = data[2];
            const urls = data[3];
            
            const results = titles.map((title, index) => ({
                title: title,
                summary: descriptions[index] || 'No description available',
                url: urls[index],
                thumbnail: null,
                type: 'search_result'
            }));
            
            return {
                source: 'wikipedia',
                query: query,
                success: true,
                results: results,
                timestamp: Date.now()
            };
            
        } catch (error) {
            throw new Error(`Wikipedia fallback search failed: ${error.message}`);
        }
    }

    // DuckDuckGo search implementation
    async searchDuckDuckGo(query) {
        try {
            // DuckDuckGo Instant Answer API
            const searchUrl = `${this.duckDuckGoUrl}?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
            
            // Note: Due to CORS restrictions, we might need to use a proxy
            // For now, we'll try direct access and handle CORS errors
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            const results = [];
            
            // Parse instant answer
            if (data.Abstract) {
                results.push({
                    title: data.Heading || query,
                    summary: data.Abstract,
                    url: data.AbstractURL,
                    thumbnail: data.Image || null,
                    type: 'instant_answer'
                });
            }
            
            // Parse definition
            if (data.Definition) {
                results.push({
                    title: `Definition: ${query}`,
                    summary: data.Definition,
                    url: data.DefinitionURL,
                    thumbnail: null,
                    type: 'definition'
                });
            }
            
            // Parse related topics
            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                data.RelatedTopics.slice(0, 3).forEach(topic => {
                    if (topic.Text) {
                        results.push({
                            title: topic.Text.split(' - ')[0] || 'Related Topic',
                            summary: topic.Text,
                            url: topic.FirstURL,
                            thumbnail: topic.Icon?.URL || null,
                            type: 'related_topic'
                        });
                    }
                });
            }
            
            return {
                source: 'duckduckgo',
                query: query,
                success: true,
                results: results,
                timestamp: Date.now()
            };
            
        } catch (error) {
            // CORS error handling - provide fallback
            if (error.message.includes('CORS') || error.name === 'TypeError') {
                return {
                    source: 'duckduckgo',
                    query: query,
                    success: false,
                    error: 'CORS restriction - unable to access DuckDuckGo directly',
                    results: [{
                        title: `Search for: ${query}`,
                        summary: `Due to browser security restrictions, I cannot directly search DuckDuckGo. However, you can search for "${query}" on DuckDuckGo.com`,
                        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                        thumbnail: null,
                        type: 'fallback'
                    }],
                    timestamp: Date.now()
                };
            }
            
            throw error;
        }
    }

    // Automatically choose the best search source
    async autoSearch(query) {
        // Determine the best source based on query characteristics
        const isFactual = this.isFactualQuery(query);
        const isDefinition = this.isDefinitionQuery(query);
        
        if (isFactual || isDefinition) {
            // Try Wikipedia first for factual/definitional queries
            try {
                const wikipediaResult = await this.searchWikipedia(query);
                if (wikipediaResult.success && wikipediaResult.results.length > 0) {
                    return wikipediaResult;
                }
            } catch (error) {
                console.warn('Wikipedia auto-search failed, trying DuckDuckGo');
            }
        }
        
        // Fallback to DuckDuckGo
        return await this.searchDuckDuckGo(query);
    }

    // Clean and normalize search query
    cleanQuery(query) {
        return query
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
            .replace(/\s+/g, ' ') // Normalize whitespace
            .toLowerCase();
    }

    // Check if query is factual
    isFactualQuery(query) {
        const factualIndicators = [
            'what is', 'who is', 'when is', 'where is', 'how is',
            'what are', 'who are', 'when are', 'where are', 'how are',
            'define', 'definition', 'meaning', 'explain',
            'history of', 'facts about', 'information about'
        ];
        
        const lowerQuery = query.toLowerCase();
        return factualIndicators.some(indicator => lowerQuery.includes(indicator));
    }

    // Check if query is asking for a definition
    isDefinitionQuery(query) {
        const definitionIndicators = [
            'define', 'definition', 'meaning', 'what does', 'what is'
        ];
        
        const lowerQuery = query.toLowerCase();
        return definitionIndicators.some(indicator => lowerQuery.startsWith(indicator));
    }

    // Cache management
    getFromCache(query, source) {
        const key = `${source}:${query}`;
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        
        // Remove expired cache
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }

    saveToCache(query, source, data) {
        const key = `${source}:${query}`;
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get current news (if available)
    async getCurrentNews(topic = '') {
        try {
            // This is a placeholder for news API integration
            // You could integrate with news APIs like NewsAPI, Guardian, etc.
            const query = topic ? `${topic} news` : 'current news';
            return await this.searchDuckDuckGo(query);
        } catch (error) {
            Utils.handleError(error, 'ExternalTools.getCurrentNews');
            return {
                source: 'news',
                query: query,
                success: false,
                error: error.message,
                results: [],
                timestamp: Date.now()
            };
        }
    }

    // Get weather information (placeholder)
    async getWeather(location) {
        try {
            // This is a placeholder for weather API integration
            const query = `weather in ${location}`;
            return await this.searchDuckDuckGo(query);
        } catch (error) {
            Utils.handleError(error, 'ExternalTools.getWeather');
            return {
                source: 'weather',
                query: query,
                success: false,
                error: error.message,
                results: [],
                timestamp: Date.now()
            };
        }
    }

    // Get trending topics (placeholder)
    async getTrendingTopics() {
        try {
            const query = 'trending topics today';
            return await this.searchDuckDuckGo(query);
        } catch (error) {
            Utils.handleError(error, 'ExternalTools.getTrendingTopics');
            return {
                source: 'trending',
                query: query,
                success: false,
                error: error.message,
                results: [],
                timestamp: Date.now()
            };
        }
    }

    // Format search results for display
    formatResultsForDisplay(searchResult) {
        if (!searchResult.success || searchResult.results.length === 0) {
            return `Sorry, I couldn't find any information about "${searchResult.query}".`;
        }

        let formatted = `Here's what I found about "${searchResult.query}":\n\n`;
        
        searchResult.results.forEach((result, index) => {
            formatted += `**${result.title}**\n`;
            formatted += `${result.summary}\n`;
            if (result.url) {
                formatted += `[Read more](${result.url})\n`;
            }
            formatted += '\n';
        });
        
        formatted += `*Source: ${searchResult.source}*`;
        
        return formatted;
    }

    // Get search statistics
    getSearchStats() {
        return {
            cacheSize: this.cache.size,
            cacheExpiry: this.cacheExpiry,
            supportedSources: ['wikipedia', 'duckduckgo', 'auto']
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExternalTools;
}