// Diagram generator for AhamAI using Mermaid.js
class DiagramGenerator {
    constructor() {
        this.mermaidInitialized = false;
        this.currentDiagram = null;
        this.diagramCounter = 0;
    }

    // Initialize Mermaid
    async initializeMermaid() {
        if (this.mermaidInitialized) {
            return;
        }

        try {
            // Check if Mermaid is available
            if (typeof mermaid === 'undefined') {
                console.warn('Mermaid not available, using fallback diagram generation');
                this.mermaidInitialized = false;
                return false;
            }
            
            // Configure Mermaid
            mermaid.initialize({
                ...CONFIG.MERMAID_CONFIG,
                startOnLoad: false,
                securityLevel: 'loose'
            });
            
            this.mermaidInitialized = true;
            console.log('Mermaid initialized successfully');
            return true;
        } catch (error) {
            console.warn('Mermaid initialization failed, using fallback:', error);
            this.mermaidInitialized = false;
            return false;
        }
    }

    // Generate diagram from AI response
    async generateDiagram(content, options = {}) {
        try {
            Utils.performance.mark('diagram-generation-start');
            
            const mermaidReady = await this.initializeMermaid();
            
            // Parse diagram content
            const diagramData = this.parseDiagramContent(content);
            
            if (!diagramData.syntax) {
                throw new Error('No valid diagram syntax found in content');
            }
            
            let svgContent;
            
            if (mermaidReady && this.mermaidInitialized) {
                // Validate Mermaid syntax
                const isValid = await this.validateMermaidSyntax(diagramData.syntax);
                if (!isValid) {
                    // Try to fix common issues
                    diagramData.syntax = this.fixCommonSyntaxIssues(diagramData.syntax);
                }
                
                // Generate unique ID for this diagram
                const diagramId = `diagram-${++this.diagramCounter}-${Utils.generateId()}`;
                
                // Render diagram with Mermaid
                svgContent = await this.renderMermaidDiagram(diagramData.syntax, diagramId);
            } else {
                // Fallback: generate simple text-based diagram
                svgContent = this.generateFallbackDiagram(diagramData);
            }
            
            // Store current diagram
            this.currentDiagram = {
                id: `diagram-${++this.diagramCounter}`,
                syntax: diagramData.syntax,
                type: diagramData.type,
                title: diagramData.title,
                description: diagramData.description,
                svgContent: svgContent,
                options: options,
                createdAt: Date.now()
            };
            
            Utils.performance.measure('diagram-generated', 'diagram-generation-start');
            
            return {
                success: true,
                diagramId: this.currentDiagram.id,
                syntax: diagramData.syntax,
                type: diagramData.type,
                title: diagramData.title,
                svgContent: svgContent
            };
            
        } catch (error) {
            Utils.handleError(error, 'DiagramGenerator.generateDiagram');
            return {
                success: false,
                error: error.message,
                diagramId: null,
                syntax: '',
                type: 'unknown',
                title: '',
                svgContent: ''
            };
        }
    }

    // Parse diagram content from AI response
    parseDiagramContent(content) {
        // Remove the [DIAGRAM] indicator if present
        let cleanContent = content.replace(/^\[DIAGRAM\]\s*/, '');
        
        // Extract title and description
        let title = '';
        let description = '';
        let syntax = '';
        
        // Look for title
        const titleMatch = cleanContent.match(/^(?:Title|Diagram):\s*(.+)$/m);
        if (titleMatch) {
            title = titleMatch[1].trim();
            cleanContent = cleanContent.replace(titleMatch[0], '').trim();
        }
        
        // Look for description
        const descMatch = cleanContent.match(/^(?:Description|About):\s*(.+)$/m);
        if (descMatch) {
            description = descMatch[1].trim();
            cleanContent = cleanContent.replace(descMatch[0], '').trim();
        }
        
        // Extract Mermaid syntax
        syntax = this.extractMermaidSyntax(cleanContent);
        
        // Determine diagram type
        const type = this.detectDiagramType(syntax);
        
        return {
            title: title || this.generateTitleFromType(type),
            description: description,
            syntax: syntax,
            type: type
        };
    }

    // Extract Mermaid syntax from content
    extractMermaidSyntax(content) {
        // Look for code blocks with mermaid
        const codeBlockMatch = content.match(/```mermaid\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }
        
        // Look for code blocks without language specifier
        const genericCodeBlock = content.match(/```\s*([\s\S]*?)\s*```/);
        if (genericCodeBlock) {
            const syntax = genericCodeBlock[1].trim();
            if (this.isMermaidSyntax(syntax)) {
                return syntax;
            }
        }
        
        // Look for diagram syntax without code blocks
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        // Try to find Mermaid diagram start
        const mermaidStartIndex = lines.findIndex(line => 
            line.startsWith('graph ') || 
            line.startsWith('flowchart ') ||
            line.startsWith('sequenceDiagram') ||
            line.startsWith('classDiagram') ||
            line.startsWith('stateDiagram') ||
            line.startsWith('erDiagram') ||
            line.startsWith('journey') ||
            line.startsWith('gantt') ||
            line.startsWith('pie') ||
            line.startsWith('gitGraph')
        );
        
        if (mermaidStartIndex !== -1) {
            return lines.slice(mermaidStartIndex).join('\n');
        }
        
        // Fallback: try to generate diagram from description
        return this.generateDiagramFromDescription(content);
    }

    // Check if text contains Mermaid syntax
    isMermaidSyntax(text) {
        const mermaidKeywords = [
            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
            'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph',
            '-->', '--->', '===>', '-.', '==', '--'
        ];
        
        return mermaidKeywords.some(keyword => text.includes(keyword));
    }

    // Detect diagram type from syntax
    detectDiagramType(syntax) {
        if (syntax.includes('sequenceDiagram')) return 'sequence';
        if (syntax.includes('classDiagram')) return 'class';
        if (syntax.includes('stateDiagram')) return 'state';
        if (syntax.includes('erDiagram')) return 'er';
        if (syntax.includes('journey')) return 'journey';
        if (syntax.includes('gantt')) return 'gantt';
        if (syntax.includes('pie')) return 'pie';
        if (syntax.includes('gitGraph')) return 'git';
        if (syntax.includes('flowchart') || syntax.includes('graph')) return 'flowchart';
        
        return 'unknown';
    }

    // Generate title from diagram type
    generateTitleFromType(type) {
        const titles = {
            flowchart: 'Flowchart Diagram',
            sequence: 'Sequence Diagram',
            class: 'Class Diagram',
            state: 'State Diagram',
            er: 'Entity Relationship Diagram',
            journey: 'User Journey Map',
            gantt: 'Gantt Chart',
            pie: 'Pie Chart',
            git: 'Git Graph',
            unknown: 'Diagram'
        };
        
        return titles[type] || 'Diagram';
    }

    // Generate diagram from description (simple flowchart)
    generateDiagramFromDescription(description) {
        // This is a simple fallback that creates a basic flowchart
        const steps = description.split(/[.\n]/).filter(step => step.trim().length > 0);
        
        if (steps.length === 0) {
            return 'graph TD\n    A[Start] --> B[End]';
        }
        
        let syntax = 'graph TD\n';
        const nodes = [];
        
        steps.forEach((step, index) => {
            const nodeId = String.fromCharCode(65 + index); // A, B, C, etc.
            const cleanStep = step.trim().substring(0, 50); // Limit length
            nodes.push(`    ${nodeId}[${cleanStep}]`);
            
            if (index > 0) {
                const prevNodeId = String.fromCharCode(65 + index - 1);
                nodes.push(`    ${prevNodeId} --> ${nodeId}`);
            }
        });
        
        return syntax + nodes.join('\n');
    }

    // Validate Mermaid syntax
    async validateMermaidSyntax(syntax) {
        try {
            // Use Mermaid's parse function to validate
            await mermaid.parse(syntax);
            return true;
        } catch (error) {
            console.warn('Mermaid syntax validation failed:', error);
            return false;
        }
    }

    // Fix common syntax issues
    fixCommonSyntaxIssues(syntax) {
        let fixed = syntax;
        
        // Fix missing diagram type
        if (!this.isMermaidSyntax(fixed)) {
            fixed = 'graph TD\n' + fixed;
        }
        
        // Fix node syntax issues
        fixed = fixed.replace(/\[([^\]]+)\]/g, (match, content) => {
            // Remove special characters that might break Mermaid
            const cleanContent = content.replace(/[<>]/g, '');
            return `[${cleanContent}]`;
        });
        
        // Fix arrow syntax
        fixed = fixed.replace(/-->/g, ' --> ');
        fixed = fixed.replace(/--->/g, ' ---> ');
        
        // Fix indentation
        const lines = fixed.split('\n');
        const firstLine = lines[0];
        const restLines = lines.slice(1).map(line => {
            if (line.trim() && !line.startsWith('    ')) {
                return '    ' + line.trim();
            }
            return line;
        });
        
        return [firstLine, ...restLines].join('\n');
    }

    // Render Mermaid diagram
    async renderMermaidDiagram(syntax, diagramId) {
        try {
            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.id = diagramId;
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.visibility = 'hidden';
            document.body.appendChild(tempContainer);
            
            // Render the diagram
            const { svg } = await mermaid.render(diagramId, syntax);
            
            // Clean up temporary container
            document.body.removeChild(tempContainer);
            
            return svg;
            
        } catch (error) {
            Utils.handleError(error, 'DiagramGenerator.renderMermaidDiagram');
            throw new Error(`Failed to render diagram: ${error.message}`);
        }
    }

    // Display diagram in container
    displayDiagram(containerId = 'diagram-container') {
        if (!this.currentDiagram) {
            throw new Error('No diagram to display');
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        
        // Clear container and add diagram
        container.innerHTML = `
            <div class="diagram-header">
                <h3>${Utils.escapeHtml(this.currentDiagram.title)}</h3>
                ${this.currentDiagram.description ? 
                    `<p class="diagram-description">${Utils.escapeHtml(this.currentDiagram.description)}</p>` : 
                    ''
                }
            </div>
            <div class="diagram-content">
                ${this.currentDiagram.svgContent}
            </div>
        `;
        
        // Add some styling to the SVG
        const svg = container.querySelector('svg');
        if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
        }
    }

    // Export diagram as SVG
    exportAsSvg(filename = 'diagram.svg') {
        if (!this.currentDiagram) {
            throw new Error('No diagram to export');
        }
        
        Utils.downloadFile(
            this.currentDiagram.svgContent,
            filename,
            'image/svg+xml'
        );
    }

    // Export diagram as PNG
    async exportAsPng(filename = 'diagram.png') {
        if (!this.currentDiagram) {
            throw new Error('No diagram to export');
        }
        
        try {
            // Create a canvas and draw the SVG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create an image from SVG
            const img = new Image();
            const svgBlob = new Blob([this.currentDiagram.svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width || 800;
                    canvas.height = img.height || 600;
                    
                    // Fill white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw the image
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to blob and download
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const downloadUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(downloadUrl);
                            URL.revokeObjectURL(url);
                            resolve(true);
                        } else {
                            reject(new Error('Failed to create PNG'));
                        }
                    }, 'image/png');
                };
                
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load SVG'));
                };
                
                img.src = url;
            });
            
        } catch (error) {
            Utils.handleError(error, 'DiagramGenerator.exportAsPng');
            throw new Error(`Failed to export PNG: ${error.message}`);
        }
    }

    // Get diagram examples for different types
    getDiagramExamples() {
        return {
            flowchart: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
            
            sequence: `sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request
    B-->>A: Response`,
            
            class: `classDiagram
    class Animal {
        +String name
        +int age
        +speak()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`,
            
            pie: `pie title Pet Ownership
    "Dogs" : 45
    "Cats" : 35
    "Birds" : 15
    "Fish" : 5`,
            
            gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1: 2024-01-01, 30d
    Task 2: after task1, 20d`
        };
    }

    // Get diagram statistics
    getDiagramStats() {
        if (!this.currentDiagram) {
            return null;
        }
        
        return {
            id: this.currentDiagram.id,
            type: this.currentDiagram.type,
            title: this.currentDiagram.title,
            syntaxLength: this.currentDiagram.syntax.length,
            createdAt: this.currentDiagram.createdAt,
            hasDescription: !!this.currentDiagram.description
        };
    }

    // Generate fallback diagram when Mermaid is not available
    generateFallbackDiagram(diagramData) {
        const { title, type, syntax } = diagramData;
        
        // Create a simple HTML-based diagram representation
        const fallbackHTML = `
            <div class="fallback-diagram" style="
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border: 2px solid #e1e5e9;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                font-family: Inter, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
                <h3 style="
                    color: #24292f;
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 600;
                ">${title}</h3>
                <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 16px 0;
                    border-left: 4px solid #0366d6;
                ">
                    <h4 style="
                        color: #656d76;
                        margin: 0 0 12px 0;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">Diagram Type: ${type}</h4>
                    <pre style="
                        background: #f6f8fa;
                        border-radius: 6px;
                        padding: 12px;
                        margin: 0;
                        font-size: 12px;
                        color: #24292f;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        text-align: left;
                    ">${syntax}</pre>
                </div>
                <p style="
                    color: #656d76;
                    font-size: 12px;
                    margin: 16px 0 0 0;
                    font-style: italic;
                ">Interactive diagram generation requires Mermaid.js</p>
            </div>
        `;
        
        return fallbackHTML;
    }

    // Clear current diagram
    clearDiagram() {
        this.currentDiagram = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagramGenerator;
}