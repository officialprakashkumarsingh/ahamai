// Offline AI functionality for AhamAI
class OfflineAI {
    constructor() {
        this.diagramPatterns = this.initializeDiagramPatterns();
        this.presentationTemplates = this.initializePresentationTemplates();
        this.responses = this.initializeResponses();
    }

    // Process message offline
    async processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for diagram requests
        if (this.isDiagramRequest(lowerMessage)) {
            return await this.generateDiagramResponse(message);
        }
        
        // Check for presentation requests
        if (this.isPresentationRequest(lowerMessage)) {
            return await this.generatePresentationResponse(message);
        }
        
        // Generate general response
        return this.generateGeneralResponse(message);
    }

    // Check if message is requesting a diagram
    isDiagramRequest(message) {
        const diagramKeywords = [
            'diagram', 'flowchart', 'chart', 'flow', 'process', 
            'workflow', 'sequence', 'class diagram', 'state diagram',
            'visualization', 'graph', 'tree', 'hierarchy'
        ];
        return diagramKeywords.some(keyword => message.includes(keyword));
    }

    // Check if message is requesting a presentation
    isPresentationRequest(message) {
        const presentationKeywords = [
            'presentation', 'slides', 'slideshow', 'powerpoint',
            'present', 'deck', 'slide deck'
        ];
        return presentationKeywords.some(keyword => message.includes(keyword));
    }

    // Generate diagram response
    async generateDiagramResponse(message) {
        const topic = this.extractTopic(message);
        const diagramType = this.detectDiagramType(message);
        
        let diagramSyntax;
        let description;

        switch (diagramType) {
            case 'software_development':
                diagramSyntax = this.generateSoftwareDevelopmentFlowchart();
                description = "Here's a comprehensive flowchart showing the software development process:";
                break;
            case 'business_process':
                diagramSyntax = this.generateBusinessProcessFlowchart(topic);
                description = `Here's a business process flowchart for ${topic}:`;
                break;
            case 'sequence':
                diagramSyntax = this.generateSequenceDiagram(topic);
                description = `Here's a sequence diagram for ${topic}:`;
                break;
            case 'class':
                diagramSyntax = this.generateClassDiagram(topic);
                description = `Here's a class diagram for ${topic}:`;
                break;
            default:
                diagramSyntax = this.generateGenericFlowchart(topic);
                description = `Here's a flowchart diagram for ${topic}:`;
        }

        return {
            text: description,
            type: 'diagram',
            diagramSyntax: diagramSyntax,
            title: `${topic} Diagram`,
            requiresGeneration: true
        };
    }

    // Generate presentation response
    async generatePresentationResponse(message) {
        const topic = this.extractTopic(message);
        const slides = this.generatePresentationSlides(topic);
        
        return {
            text: `I've created a presentation about ${topic}. Here are the slides:`,
            type: 'presentation',
            slides: slides,
            title: topic,
            requiresGeneration: true
        };
    }

    // Generate general response
    generateGeneralResponse(message) {
        const responses = [
            "I understand you're asking about that topic. While I'm currently working in offline mode, I can help you create diagrams and presentations.",
            "That's an interesting question! I can assist you with creating visual content like flowcharts and presentations.",
            "I'd be happy to help! I specialize in creating diagrams and presentations. Try asking me to create a flowchart or presentation on your topic.",
            "Great question! I can help you visualize information through diagrams and presentations. What would you like me to create?"
        ];
        
        return {
            text: responses[Math.floor(Math.random() * responses.length)],
            type: 'text',
            requiresGeneration: false
        };
    }

    // Extract topic from message
    extractTopic(message) {
        // Remove common words and extract the main topic
        const stopWords = ['create', 'make', 'generate', 'show', 'diagram', 'flowchart', 'presentation', 'about', 'for', 'of', 'the', 'a', 'an'];
        const words = message.toLowerCase().split(' ').filter(word => 
            word.length > 2 && !stopWords.includes(word)
        );
        
        if (words.length > 0) {
            return words.slice(0, 3).join(' '); // Take first few meaningful words
        }
        
        return 'Process';
    }

    // Detect diagram type from message
    detectDiagramType(message) {
        if (message.includes('software') || message.includes('development') || message.includes('coding')) {
            return 'software_development';
        }
        if (message.includes('sequence') || message.includes('interaction')) {
            return 'sequence';
        }
        if (message.includes('class') || message.includes('object') || message.includes('inheritance')) {
            return 'class';
        }
        if (message.includes('business') || message.includes('process') || message.includes('workflow')) {
            return 'business_process';
        }
        return 'generic';
    }

    // Generate software development flowchart
    generateSoftwareDevelopmentFlowchart() {
        return `graph TD
    A[Requirements Analysis] --> B[System Design]
    B --> C[Implementation]
    C --> D[Testing]
    D --> E{Tests Pass?}
    E -->|No| F[Debug & Fix]
    F --> C
    E -->|Yes| G[Code Review]
    G --> H{Review Approved?}
    H -->|No| I[Address Feedback]
    I --> C
    H -->|Yes| J[Integration]
    J --> K[Deployment]
    K --> L[Monitoring]
    L --> M[Maintenance]
    M --> N{New Requirements?}
    N -->|Yes| A
    N -->|No| O[End]
    
    style A fill:#e1f5fe
    style K fill:#c8e6c9
    style O fill:#ffcdd2`;
    }

    // Generate business process flowchart
    generateBusinessProcessFlowchart(topic) {
        return `graph TD
    A[Start: ${topic}] --> B[Identify Requirements]
    B --> C[Plan Strategy]
    C --> D[Allocate Resources]
    D --> E[Execute Process]
    E --> F[Monitor Progress]
    F --> G{Quality Check}
    G -->|Pass| H[Complete Process]
    G -->|Fail| I[Identify Issues]
    I --> J[Implement Corrections]
    J --> E
    H --> K[Document Results]
    K --> L[Review & Improve]
    L --> M[End]
    
    style A fill:#e8f5e8
    style H fill:#fff3e0
    style M fill:#fce4ec`;
    }

    // Generate sequence diagram
    generateSequenceDiagram(topic) {
        return `sequenceDiagram
    participant User
    participant System
    participant Database
    participant Service
    
    User->>System: Request ${topic}
    System->>Database: Query Data
    Database-->>System: Return Results
    System->>Service: Process Request
    Service-->>System: Processing Complete
    System-->>User: Response with ${topic}
    
    Note over User,Service: ${topic} Process Flow`;
    }

    // Generate class diagram
    generateClassDiagram(topic) {
        return `classDiagram
    class ${topic}Manager {
        -id: string
        -name: string
        -status: string
        +create()
        +update()
        +delete()
        +get()
    }
    
    class ${topic}Service {
        +process()
        +validate()
        +transform()
    }
    
    class ${topic}Repository {
        +save()
        +find()
        +update()
        +remove()
    }
    
    ${topic}Manager --> ${topic}Service
    ${topic}Service --> ${topic}Repository`;
    }

    // Generate generic flowchart
    generateGenericFlowchart(topic) {
        return `graph TD
    A[Start: ${topic}] --> B[Initialize]
    B --> C[Process Data]
    C --> D{Valid?}
    D -->|Yes| E[Continue Processing]
    D -->|No| F[Handle Error]
    F --> G[Log Error]
    G --> C
    E --> H[Generate Output]
    H --> I[Validate Output]
    I --> J{Output OK?}
    J -->|Yes| K[Complete]
    J -->|No| L[Retry]
    L --> C
    K --> M[End]
    
    style A fill:#e3f2fd
    style K fill:#e8f5e8
    style M fill:#fce4ec`;
    }

    // Generate presentation slides
    generatePresentationSlides(topic) {
        return [
            {
                title: topic,
                content: `<h1>${topic}</h1><p>A comprehensive overview</p>`,
                type: 'title'
            },
            {
                title: 'Overview',
                content: `<h2>Overview</h2><ul><li>Introduction to ${topic}</li><li>Key concepts and principles</li><li>Benefits and applications</li><li>Implementation strategies</li></ul>`,
                type: 'content'
            },
            {
                title: 'Key Benefits',
                content: `<h2>Key Benefits</h2><ul><li>Improved efficiency and productivity</li><li>Better organization and structure</li><li>Enhanced user experience</li><li>Scalable and maintainable solutions</li></ul>`,
                type: 'content'
            },
            {
                title: 'Implementation',
                content: `<h2>Implementation</h2><ul><li>Planning and preparation</li><li>Step-by-step execution</li><li>Testing and validation</li><li>Deployment and monitoring</li></ul>`,
                type: 'content'
            },
            {
                title: 'Conclusion',
                content: `<h2>Conclusion</h2><p>${topic} provides significant value through improved processes and outcomes. Consider implementing these strategies for optimal results.</p>`,
                type: 'conclusion'
            }
        ];
    }

    // Initialize diagram patterns
    initializeDiagramPatterns() {
        return {
            flowchart: /flow|process|workflow|procedure/i,
            sequence: /sequence|interaction|communication/i,
            class: /class|object|inheritance|structure/i,
            state: /state|status|condition/i,
            er: /entity|relationship|database|schema/i
        };
    }

    // Initialize presentation templates
    initializePresentationTemplates() {
        return {
            business: ['Overview', 'Problem Statement', 'Solution', 'Benefits', 'Implementation', 'ROI'],
            technical: ['Introduction', 'Architecture', 'Components', 'Implementation', 'Testing', 'Deployment'],
            educational: ['Learning Objectives', 'Concepts', 'Examples', 'Practice', 'Assessment', 'Summary']
        };
    }

    // Initialize responses
    initializeResponses() {
        return {
            greeting: [
                "Hello! I'm AhamAI, your advanced AI assistant. I can help you create diagrams, presentations, and more!",
                "Welcome to AhamAI! I'm here to help you with visual content creation and intelligent assistance.",
                "Hi there! I'm AhamAI, ready to assist you with creating professional diagrams and presentations."
            ],
            help: [
                "I can help you create flowcharts, sequence diagrams, presentations, and provide intelligent responses to your questions.",
                "Try asking me to create a diagram or presentation about any topic you're interested in!",
                "I specialize in visual content creation. Ask me to make a flowchart, diagram, or presentation!"
            ]
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineAI;
}