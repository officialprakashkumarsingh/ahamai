// Presentation generator for AhamAI using Reveal.js
class PresentationGenerator {
    constructor() {
        this.revealInstance = null;
        this.currentPresentation = null;
        this.themes = CONFIG.PRESENTATION_THEMES;
    }

    // Generate presentation from AI response
    async generatePresentation(content, options = {}) {
        try {
            Utils.performance.mark('presentation-generation-start');
            
            // Parse the presentation content
            const slides = this.parseSlideContent(content);
            
            if (slides.length === 0) {
                throw new Error('No slides could be generated from the content');
            }
            
            // Create presentation HTML
            const presentationHtml = this.createPresentationHtml(slides, options);
            
            // Store current presentation
            this.currentPresentation = {
                slides: slides,
                html: presentationHtml,
                options: options,
                createdAt: Date.now()
            };
            
            Utils.performance.measure('presentation-generated', 'presentation-generation-start');
            
            return {
                success: true,
                slides: slides,
                html: presentationHtml,
                slideCount: slides.length
            };
            
        } catch (error) {
            Utils.handleError(error, 'PresentationGenerator.generatePresentation');
            return {
                success: false,
                error: error.message,
                slides: [],
                html: '',
                slideCount: 0
            };
        }
    }

    // Parse slide content from AI response
    parseSlideContent(content) {
        const slides = [];
        
        // Remove the [PRESENTATION] indicator if present
        const cleanContent = content.replace(/^\[PRESENTATION\]\s*/, '');
        
        // Try to parse structured slide format
        if (this.isStructuredFormat(cleanContent)) {
            return this.parseStructuredSlides(cleanContent);
        }
        
        // Try to parse markdown-style slides
        if (cleanContent.includes('---') || cleanContent.includes('##')) {
            return this.parseMarkdownSlides(cleanContent);
        }
        
        // Fallback: split by logical sections
        return this.parseGenericSlides(cleanContent);
    }

    // Check if content is in structured format
    isStructuredFormat(content) {
        return content.includes('Slide 1:') || 
               content.includes('Title:') || 
               content.includes('Content:') ||
               content.match(/^\d+\./m);
    }

    // Parse structured slide format
    parseStructuredSlides(content) {
        const slides = [];
        
        // Split by slide indicators
        const slideMatches = content.split(/(?:Slide \d+:|^\d+\.)/i).filter(s => s.trim());
        
        slideMatches.forEach((slideContent, index) => {
            const slide = this.parseIndividualSlide(slideContent.trim(), index);
            if (slide) {
                slides.push(slide);
            }
        });
        
        return slides;
    }

    // Parse markdown-style slides
    parseMarkdownSlides(content) {
        const slides = [];
        
        // Split by --- or ## headers
        const slideContents = content.split(/---|\n##/).filter(s => s.trim());
        
        slideContents.forEach((slideContent, index) => {
            const slide = this.parseMarkdownSlide(slideContent.trim(), index);
            if (slide) {
                slides.push(slide);
            }
        });
        
        return slides;
    }

    // Parse generic slides by splitting content
    parseGenericSlides(content) {
        const slides = [];
        
        // Split content into logical sections
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        
        if (paragraphs.length === 0) {
            return slides;
        }
        
        // First slide - title slide
        slides.push({
            type: 'title',
            title: this.extractTitle(paragraphs[0]),
            subtitle: paragraphs.length > 1 ? paragraphs[1] : '',
            content: '',
            notes: ''
        });
        
        // Remaining slides - content slides
        for (let i = 1; i < paragraphs.length; i++) {
            const slide = this.createContentSlide(paragraphs[i], i);
            if (slide) {
                slides.push(slide);
            }
        }
        
        return slides;
    }

    // Parse individual slide from structured content
    parseIndividualSlide(content, index) {
        const lines = content.split('\n').filter(l => l.trim());
        
        if (lines.length === 0) return null;
        
        let title = '';
        let slideContent = [];
        let notes = '';
        
        // Extract title (first line or explicit title)
        const titleMatch = lines[0].match(/^(?:Title:\s*)?(.+)$/);
        if (titleMatch) {
            title = titleMatch[1].trim();
            lines.shift();
        }
        
        // Extract content and notes
        let inNotes = false;
        
        for (const line of lines) {
            if (line.toLowerCase().includes('notes:') || line.toLowerCase().includes('speaker notes:')) {
                inNotes = true;
                continue;
            }
            
            if (inNotes) {
                notes += line + '\n';
            } else if (line.trim()) {
                slideContent.push(line.trim());
            }
        }
        
        return {
            type: index === 0 ? 'title' : 'content',
            title: title || `Slide ${index + 1}`,
            subtitle: index === 0 && slideContent.length > 0 ? slideContent[0] : '',
            content: index === 0 ? '' : slideContent.join('\n'),
            notes: notes.trim()
        };
    }

    // Parse markdown slide
    parseMarkdownSlide(content, index) {
        const lines = content.split('\n').filter(l => l.trim());
        
        if (lines.length === 0) return null;
        
        let title = '';
        let slideContent = [];
        
        // Find title (# or ## header)
        const titleLine = lines.find(line => line.match(/^#+\s+/));
        if (titleLine) {
            title = titleLine.replace(/^#+\s+/, '').trim();
            // Remove title line from content
            const titleIndex = lines.indexOf(titleLine);
            lines.splice(titleIndex, 1);
        }
        
        // Remaining lines are content
        slideContent = lines.filter(line => line.trim());
        
        return {
            type: index === 0 ? 'title' : 'content',
            title: title || `Slide ${index + 1}`,
            subtitle: index === 0 && slideContent.length > 0 ? slideContent[0] : '',
            content: index === 0 ? '' : slideContent.join('\n'),
            notes: ''
        };
    }

    // Extract title from content
    extractTitle(content) {
        // Look for title-like patterns
        const lines = content.split('\n');
        const firstLine = lines[0].trim();
        
        // If it's short and doesn't end with punctuation, it's likely a title
        if (firstLine.length < 60 && !firstLine.match(/[.!?]$/)) {
            return firstLine;
        }
        
        // Extract first few words
        const words = firstLine.split(' ').slice(0, 6);
        return words.join(' ') + (words.length === 6 ? '...' : '');
    }

    // Create content slide from paragraph
    createContentSlide(content, index) {
        const lines = content.split('\n').filter(l => l.trim());
        
        if (lines.length === 0) return null;
        
        // First line as title, rest as content
        const title = this.extractTitle(lines[0]);
        const slideContent = lines.slice(1).join('\n') || lines[0];
        
        return {
            type: 'content',
            title: title,
            subtitle: '',
            content: slideContent,
            notes: ''
        };
    }

    // Create presentation HTML
    createPresentationHtml(slides, options = {}) {
        const theme = options.theme || 'default';
        const transition = options.transition || 'slide';
        
        let html = '';
        
        slides.forEach((slide, index) => {
            html += this.createSlideHtml(slide, index, theme);
        });
        
        return html;
    }

    // Create individual slide HTML
    createSlideHtml(slide, index, theme) {
        let slideHtml = '<section';
        
        // Add data attributes
        if (slide.notes) {
            slideHtml += ` data-notes="${Utils.escapeHtml(slide.notes)}"`;
        }
        
        slideHtml += '>';
        
        if (slide.type === 'title') {
            // Title slide
            slideHtml += `
                <h1>${Utils.escapeHtml(slide.title)}</h1>
                ${slide.subtitle ? `<p class="subtitle">${Utils.escapeHtml(slide.subtitle)}</p>` : ''}
            `;
        } else {
            // Content slide
            slideHtml += `
                <h2>${Utils.escapeHtml(slide.title)}</h2>
                ${slide.subtitle ? `<h3>${Utils.escapeHtml(slide.subtitle)}</h3>` : ''}
                ${slide.content ? `<div class="content">${this.formatSlideContent(slide.content)}</div>` : ''}
            `;
        }
        
        slideHtml += '</section>';
        
        return slideHtml;
    }

    // Format slide content with basic markdown
    formatSlideContent(content) {
        return content
            .split('\n')
            .map(line => {
                line = line.trim();
                if (!line) return '';
                
                // Handle bullet points
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return `<li>${Utils.escapeHtml(line.substring(2))}</li>`;
                }
                
                // Handle numbered lists
                if (line.match(/^\d+\.\s/)) {
                    return `<li>${Utils.escapeHtml(line.replace(/^\d+\.\s/, ''))}</li>`;
                }
                
                // Regular paragraph
                return `<p>${Utils.escapeHtml(line)}</p>`;
            })
            .join('\n')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>') // Wrap lists
            .replace(/<\/ul>\s*<ul>/g, ''); // Merge consecutive lists
    }

    // Initialize Reveal.js presentation
    async initializeReveal(containerId = 'presentation-container') {
        try {
            if (!this.currentPresentation) {
                throw new Error('No presentation data available');
            }
            
            // Insert slides into container
            const slidesContainer = document.querySelector(`#${containerId} .slides`);
            if (!slidesContainer) {
                throw new Error('Slides container not found');
            }
            
            slidesContainer.innerHTML = this.currentPresentation.html;
            
            // Initialize Reveal.js
            if (this.revealInstance) {
                this.revealInstance.destroy();
            }
            
            this.revealInstance = new Reveal(document.querySelector(`#${containerId}`), {
                hash: true,
                controls: true,
                progress: true,
                center: true,
                transition: this.currentPresentation.options.transition || 'slide',
                plugins: [RevealMarkdown, RevealHighlight]
            });
            
            await this.revealInstance.initialize();
            
            return true;
            
        } catch (error) {
            Utils.handleError(error, 'PresentationGenerator.initializeReveal');
            return false;
        }
    }

    // Export presentation as HTML
    exportAsHtml(title = 'AhamAI Presentation') {
        if (!this.currentPresentation) {
            throw new Error('No presentation to export');
        }
        
        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${Utils.escapeHtml(title)}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/white.css">
    <style>
        .subtitle { font-style: italic; color: #666; }
        .content { text-align: left; }
        .content ul { margin-left: 1em; }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${this.currentPresentation.html}
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
    <script>
        Reveal.initialize({
            hash: true,
            controls: true,
            progress: true,
            center: true,
            transition: 'slide'
        });
    </script>
</body>
</html>`;
        
        return htmlTemplate;
    }

    // Export presentation as PDF (requires print media query)
    async exportAsPdf(filename = 'presentation.pdf') {
        if (!this.currentPresentation) {
            throw new Error('No presentation to export');
        }
        
        try {
            // Use browser's print functionality
            const printWindow = window.open('', '_blank');
            printWindow.document.write(this.exportAsHtml());
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            
            return true;
        } catch (error) {
            Utils.handleError(error, 'PresentationGenerator.exportAsPdf');
            return false;
        }
    }

    // Get presentation statistics
    getPresentationStats() {
        if (!this.currentPresentation) {
            return null;
        }
        
        return {
            slideCount: this.currentPresentation.slides.length,
            titleSlides: this.currentPresentation.slides.filter(s => s.type === 'title').length,
            contentSlides: this.currentPresentation.slides.filter(s => s.type === 'content').length,
            totalWords: this.currentPresentation.slides.reduce((total, slide) => {
                return total + (slide.title + ' ' + slide.content).split(' ').length;
            }, 0),
            createdAt: this.currentPresentation.createdAt,
            estimatedDuration: this.currentPresentation.slides.length * 2 // 2 minutes per slide
        };
    }

    // Navigate presentation
    navigateToSlide(slideNumber) {
        if (this.revealInstance) {
            this.revealInstance.slide(slideNumber);
        }
    }

    // Get current slide
    getCurrentSlide() {
        if (this.revealInstance) {
            const indices = this.revealInstance.getIndices();
            return {
                current: indices.h,
                total: this.revealInstance.getTotalSlides(),
                isFirst: this.revealInstance.isFirstSlide(),
                isLast: this.revealInstance.isLastSlide()
            };
        }
        return null;
    }

    // Toggle fullscreen
    toggleFullscreen() {
        if (this.revealInstance) {
            const element = this.revealInstance.getRevealElement();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                element.requestFullscreen();
            }
        }
    }

    // Clean up
    destroy() {
        if (this.revealInstance) {
            this.revealInstance.destroy();
            this.revealInstance = null;
        }
        this.currentPresentation = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationGenerator;
}