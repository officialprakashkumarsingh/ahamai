# AhamAI - Advanced AI Assistant 🤖✨

A cutting-edge ChatGPT-like web application powered by Google's Gemini 2.5-flash model, featuring advanced capabilities like real-time search, presentation generation, diagram creation, and intelligent tool selection.

![AhamAI Logo](https://img.shields.io/badge/AhamAI-Advanced%20AI%20Assistant-blue?style=for-the-badge&logo=robot)

## 🌟 Features

### 🤖 **Advanced AI Conversations**
- Powered by Google Gemini 2.5-flash model
- Context-aware conversations with memory retention
- Intelligent responses with personality and depth
- Error handling and graceful fallbacks

### 📊 **Presentation Generation**
- Automatic slide creation from AI responses
- Professional Reveal.js-powered presentations
- Multiple themes and export options
- Fullscreen presentation mode
- Export as HTML or PDF

### 📈 **Diagram Creation**
- Dynamic diagram generation using Mermaid.js
- Support for flowcharts, sequence diagrams, class diagrams, and more
- SVG and PNG export capabilities
- Automatic syntax validation and correction

### 🔍 **Real-time Search Integration**
- Wikipedia API integration for factual information
- DuckDuckGo search for current web information
- Intelligent source selection based on query type
- Enhanced AI responses using search results

### 🎨 **Modern User Interface**
- Clean, professional design with neutral white/grey theme
- Fully responsive - works perfectly on desktop, tablet, and mobile
- Smooth animations and transitions
- Keyboard shortcuts and accessibility features
- Dark/light theme toggle support

### ⚡ **Performance & Experience**
- Zero backend required - runs entirely in the browser
- Local conversation history and preferences
- Typing animations for natural conversation flow
- Real-time character counting and input validation
- Copy messages and regenerate responses

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/officialprakashkumarsingh/ahamai.git
   cd ahamai
   ```

2. **Open in browser:**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

3. **Start chatting:**
   - Type your message in the input field
   - Press Enter or click the send button
   - Enjoy intelligent conversations with advanced features!

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI Model**: Google Gemini 2.5-flash
- **Presentations**: Reveal.js
- **Diagrams**: Mermaid.js
- **APIs**: Wikipedia API, DuckDuckGo Instant Answer API
- **Styling**: CSS Grid, Flexbox, Custom Properties
- **Fonts**: Inter (Google Fonts)

## 📁 Project Structure

```
ahamai/
├── index.html              # Main application entry point
├── styles.css              # Complete responsive styling
├── js/
│   ├── config.js          # Configuration and API settings
│   ├── utils.js           # Utility functions and helpers
│   ├── gemini-api.js      # Gemini AI integration
│   ├── external-tools.js  # Wikipedia/DuckDuckGo integration
│   ├── presentation-generator.js # Reveal.js presentation creation
│   ├── diagram-generator.js # Mermaid.js diagram generation
│   ├── ui-manager.js      # UI interactions and state management
│   └── app.js             # Main application orchestrator
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🎯 Usage Examples

### 💬 **Basic Conversations**
```
User: "Explain quantum computing in simple terms"
AI: Provides detailed explanation with context awareness
```

### 📊 **Create Presentations**
```
User: "Create a presentation about renewable energy"
AI: Generates professional slides with title, content, and structure
Result: Interactive presentation opens in modal
```

### 📈 **Generate Diagrams**
```
User: "Show me a flowchart for the software development process"
AI: Creates Mermaid.js diagram with proper syntax
Result: Professional diagram with export options
```

### 🔍 **Search and Research**
```
User: "What's the latest news about artificial intelligence?"
AI: Automatically searches DuckDuckGo and provides current information
```

### 📚 **Wikipedia Integration**
```
User: "Tell me about the history of the Internet"
AI: Fetches Wikipedia data and provides comprehensive response
```

## ⚙️ Configuration

The application is configured through `js/config.js`:

- **API Keys**: Gemini API key and other service configurations
- **Features**: Toggle features on/off via feature flags
- **Themes**: Customize color schemes and presentation themes
- **Limits**: Set message length, conversation history limits
- **Tools**: Configure external tool integration

## 🌍 Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 80+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Customization

### Adding New Themes
Edit the `PRESENTATION_THEMES` in `config.js`:
```javascript
PRESENTATION_THEMES: {
  myTheme: {
    background: '#your-color',
    primary: '#your-primary',
    secondary: '#your-secondary',
    accent: '#your-accent'
  }
}
```

### Custom Diagram Types
Extend `diagram-generator.js` to support additional Mermaid diagram types.

### New External Tools
Add integrations in `external-tools.js` for additional data sources.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini**: For providing the powerful AI model
- **Reveal.js**: For the presentation framework
- **Mermaid.js**: For diagram generation capabilities
- **Wikipedia**: For the knowledge API
- **DuckDuckGo**: For search functionality

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/officialprakashkumarsingh/ahamai/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Made with ❤️ by [Prakash Kumar Singh](https://github.com/officialprakashkumarsingh)**

*AhamAI - Where Intelligence Meets Innovation* 🚀