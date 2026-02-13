# StudyGenius - AI Study Guide & Quiz Generator

A modern, responsive web application that turns your text book PDFs into comprehensive study guides and interactive quizzes using Google's Gemini AI.

## Features
- 📄 **PDF Parsers**: Drag and drop textbook chapters directly in the browser.
- 🤖 **AI Powered**: Uses Gemini 1.5 Flash for instant summarization and question generation.
- 📝 **Study Guides**: Generates structured notes with key concepts and definitions.
- 🧠 **Interactive Quizzes**: Test your knowledge with instant feedback and scoring.
- 🎨 **Premium UI**: Beautiful, responsive design with dark mode and glassmorphism.
- 🔒 **Privacy Focused**: Your API key is stored locally in your browser and never sent to our servers (other than to Google's API).

## How to Use

### 1. Get a Gemini API Key
You will need a free API key from Google to use this app.
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API key.
3. Copy the key.

### 2. Run Locally
Because this app uses modern JavaScript modules, you cannot simply double-click `index.html`. You need a local server.

**Using Python (Pre-installed on Mac):**
1. Open Terminal.
2. Navigate to the project folder:
   ```bash
   cd /Users/timothyhuang/Desktop/AIStudyGuide
   ```
3. Start a simple server:
   ```bash
   python3 -m http.server
   ```
4. Open your browser to `http://localhost:8000`.

### 3. Deploy to GitHub Pages
To make this available to others:
1. Create a new repository on GitHub.
2. Push these files to the repository.
3. Go to `Settings` > `Pages`.
4. Select the `main` branch as the source.
5. Your site will be live at `https://<your-username>.github.io/<your-repo-name>/`.

## Technical Details
- **Frontend**: Vanilla HTML/CSS/JS (Lightweight & Fast)
- **PDF Processing**: `pdf.js` (Client-side parsing)
- **AI Model**: Gemini 1.5 Flash via REST API
