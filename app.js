import { generateStudyGuide, generateQuiz, getAvailableModels } from './api.js';
import { createClient, signInWithGoogle, signOut, getCurrentUser, saveStudyMaterial, getStudyMaterials } from './supabase.js';

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const generateBtn = document.getElementById('generateBtn');
const uploadSection = document.getElementById('uploadSection');
const loadingState = document.getElementById('loadingState');
const contentSection = document.getElementById('contentSection');
const studyGuideContent = document.getElementById('studyGuideContent');
const quizContainer = document.getElementById('quizContainer');

// UI - Navigation & Layout
const dashboardSection = document.getElementById('dashboardSection');
const authBtn = document.getElementById('authBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const backToUploadBtn = document.getElementById('backToUploadBtn');
const saveContentBtn = document.getElementById('saveContentBtn');
const savedItemsGrid = document.getElementById('savedItemsGrid');

// UI - Settings
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const toggleApiKeyBtn = document.getElementById('toggleApiKeyVisibility');
const supabaseUrlInput = document.getElementById('supabaseUrl');
const supabaseKeyInput = document.getElementById('supabaseKey');

// UI - Login
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const googleSignInBtn = document.getElementById('googleSignInBtn');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const fileInfo = document.getElementById('fileInfo');

// State
let pdfText = '';
let currentQuiz = [];
let userAnswers = {};
let supabase = null;
let currentUser = null;
let currentTitle = 'Untitled Study Guide'; // Set this when parsing file

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Setup listeners FIRST so buttons work immediately
    setupEventListeners();

    // Then load data
    try {
        await loadSettings();
    } catch (e) {
        console.error('Failed to load settings:', e);
    }

    try {
        await initSupabase();
    } catch (e) {
        console.error('Failed to init Supabase:', e);
    }
});

function setupEventListeners() {
    // Auth & Navigation
    authBtn.addEventListener('click', handleAuthClick);
    dashboardBtn.addEventListener('click', showDashboard);
    backToUploadBtn.addEventListener('click', showHome);
    saveContentBtn.addEventListener('click', handleSaveContent);

    // Login
    closeLogin.addEventListener('click', () => loginModal.classList.add('hidden'));
    if (googleSignInBtn) googleSignInBtn.addEventListener('click', handleLogin);

    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', saveSettings);
    toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    apiKeyInput.addEventListener('change', refreshModels);

    // File Upload (existing)
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Generation (existing)
    generateBtn.addEventListener('click', handleGenerate);

    // Navigation (existing)
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

// Supabase Handling
async function initSupabase() {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');

    if (url && key) {
        try {
            supabase = createClient(url, key);
            currentUser = await getCurrentUser(supabase);
            updateAuthUI();

            // Only show toast if user just saved settings (contextual check would be better, but this works for now)
            if (currentUser) {
                showToast(`Connected as ${currentUser.email}`);
            } else {
                console.log('Supabase initialized, no user session.');
                // Show feedback so user knows it worked
                showToast('Database Configured! Please Login.');
            }
        } catch (e) {
            console.error('Supabase Init Failed', e);
            showToast(`Supabase Connection Failed: ${e.message}`);
        }
    }
}

function updateAuthUI() {
    authBtn.classList.remove('hidden');

    if (currentUser) {
        authBtn.textContent = 'Logout';
        dashboardBtn.classList.remove('hidden');
        if (!contentSection.classList.contains('hidden')) {
            saveContentBtn.classList.remove('hidden');
        }
    } else {
        authBtn.textContent = 'Login';
        dashboardBtn.classList.add('hidden');
        saveContentBtn.classList.add('hidden');
    }
}

function handleAuthClick() {
    if (currentUser) {
        handleLogout();
    } else {
        loginModal.classList.remove('hidden');
    }
}

async function handleLogin() {
    const btn = document.getElementById('googleSignInBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div> Redirecting...';

    try {
        await signInWithGoogle(supabase);
        // Supabase will redirect, so no need to show toast/close modal unless it fails immediately
    } catch (e) {
        showToast(`Login failed: ${e.message}`);
        btn.disabled = false;
        btn.innerHTML = `
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style="width: 20px; height: 20px;">
            Sign in with Google
        `;
    }
}

async function handleLogout() {
    await signOut(supabase);
    currentUser = null;
    showHome();
    updateAuthUI();
    showToast('Logged out');
}

async function handleSaveContent() {
    if (!currentUser) return;

    saveContentBtn.disabled = true;
    saveContentBtn.textContent = 'Saving...';

    try {
        // Simple Markdown construction for saving
        const studyGuide = studyGuideContent.innerHTML; // Note: Saving HTML for simplicity in this demo

        await saveStudyMaterial(supabase, currentTitle, 'file.pdf', studyGuide, currentQuiz);
        showToast('Saved to your dashboard!');
    } catch (e) {
        showToast(`Save failed: ${e.message}`);
    } finally {
        saveContentBtn.disabled = false;
        saveContentBtn.textContent = 'Save';
    }
}

async function showDashboard() {
    uploadSection.classList.add('hidden');
    contentSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');

    savedItemsGrid.innerHTML = '<div class="spinner"></div>';

    try {
        const items = await getStudyMaterials(supabase);
        renderDashboardItems(items);
    } catch (e) {
        savedItemsGrid.innerHTML = `<p>Error loading items: ${e.message}</p>`;
    }
}

function renderDashboardItems(items) {
    if (items.length === 0) {
        savedItemsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No saved study guides yet.</p>';
        return;
    }

    savedItemsGrid.innerHTML = items.map(item => `
        <div class="item-card" onclick="loadItem('${item.id}')">
            <h3>${item.title || 'Untitled'}</h3>
            <span class="item-date">${new Date(item.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');

    // Attach event listeners manually if needed, or use global
    window.loadItem = (id) => {
        const item = items.find(i => i.id === id);
        if (item) restoreSession(item);
    };
}

function restoreSession(item) {
    dashboardSection.classList.add('hidden');
    contentSection.classList.remove('hidden');

    studyGuideContent.innerHTML = item.study_guide_content;
    currentQuiz = item.quiz_data;
    renderQuiz(currentQuiz);

    // Reset view
    switchTab('studyGuide');
}

function showHome() {
    dashboardSection.classList.add('hidden');
    contentSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
}

// File Handling
async function handleFileDrop(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        processFile(file);
    } else {
        showToast('Please upload a PDF file.');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

async function processFile(file) {
    // UI Update
    fileInfo.textContent = `Selected: ${file.name}`;
    currentTitle = file.name.replace('.pdf', ''); // Set title for saving

    generateBtn.disabled = true;
    generateBtn.textContent = 'Processing PDF...';

    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfText = await extractTextFromPDF(arrayBuffer);

        if (pdfText.length < 50) {
            throw new Error('Could not extract enough text from this PDF.');
        }

        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Study Material';
        showToast('PDF processed successfully!');
    } catch (error) {
        console.error(error);
        fileInfo.textContent = 'Error processing PDF';
        showToast('Error reading PDF. Please try another file.');
        generateBtn.textContent = 'Generate Study Material';
    }
}

async function extractTextFromPDF(arrayBuffer) {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Limit to first 20 pages to avoid hitting token limits for this demo
    // You can adjust this based on needs
    const maxPages = Math.min(pdf.numPages, 20);

    for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

// Generation Logic
async function handleGenerate() {
    const apiKey = localStorage.getItem('gemini_api_key');
    const model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';

    if (!apiKey) {
        settingsModal.classList.remove('hidden');
        showToast('Please enter your Gemini API Key first.');
        return;
    }

    uploadSection.classList.add('hidden');
    loadingState.classList.remove('hidden');

    try {
        // Serial requests to avoid rate limits
        showToast('Generating Study Guide...');
        const guide = await generateStudyGuide(apiKey, model, pdfText);
        renderStudyGuide(guide);

        showToast('Generating Quiz...');
        // Add a small delay to be safe
        await new Promise(r => setTimeout(r, 1000));
        const quiz = await generateQuiz(apiKey, model, pdfText);
        renderQuiz(quiz);
        currentQuiz = quiz;

        loadingState.classList.add('hidden');
        contentSection.classList.remove('hidden');

        // Show save button if logged in
        updateAuthUI();

    } catch (error) {
        console.error(error);
        loadingState.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        showToast(`Generation failed: ${error.message}`);
    }
}

// Rendering
function renderStudyGuide(markdown) {
    // Simple markdown to HTML converter for specific elements
    // In a real app, use a library like marked.js
    let html = markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\s*<ul>/g, '') // Merge adjacent lists
        .replace(/\n\n/g, '<br>');

    studyGuideContent.innerHTML = html;
}

function renderQuiz(quizData) {
    quizContainer.innerHTML = '';
    userAnswers = {};

    quizData.forEach((q, index) => {
        const questionEl = document.createElement('div');
        questionEl.className = 'quiz-question';
        questionEl.innerHTML = `
            <p class="question-text">${index + 1}. ${q.question}</p>
            <div class="options-grid" id="q${index}-options"></div>
        `;

        const optionsContainer = questionEl.querySelector('.options-grid');
        q.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.onclick = () => selectOption(index, option, btn);
            optionsContainer.appendChild(btn);
        });

        quizContainer.appendChild(questionEl);
    });

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit Quiz';
    submitBtn.style.marginTop = '24px';
    submitBtn.onclick = evaluateQuiz;
    quizContainer.appendChild(submitBtn);
}

// User Interaction
function selectOption(questionIndex, selectedOption, btnElement) {
    userAnswers[questionIndex] = selectedOption;

    // Visual update
    const container = document.getElementById(`q${questionIndex}-options`);
    Array.from(container.children).forEach(child => child.classList.remove('selected'));
    btnElement.classList.add('selected');
}

function evaluateQuiz() {
    let score = 0;

    currentQuiz.forEach((q, index) => {
        const selected = userAnswers[index];
        const correct = q.answer;
        const container = document.getElementById(`q${index}-options`);
        const buttons = Array.from(container.children);

        // Disable buttons
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correct) {
                btn.classList.add('correct');
            } else if (btn.textContent === selected && selected !== correct) {
                btn.classList.add('incorrect');
            }
        });

        if (selected === correct) score++;
    });

    const percentage = Math.round((score / currentQuiz.length) * 100);
    showQuizResults(percentage);
}

function showQuizResults(percentage) {
    document.getElementById('quizResults').classList.remove('hidden');
    document.getElementById('scoreValue').textContent = `${percentage}%`;
    document.getElementById('retryQuizBtn').onclick = () => {
        renderQuiz(currentQuiz);
        document.getElementById('quizResults').classList.add('hidden');
        document.querySelector('.quiz-container').scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to results
    document.getElementById('quizResults').scrollIntoView({ behavior: 'smooth' });
}

// Settings & Utilities
async function loadSettings() {
    const key = localStorage.getItem('gemini_api_key');
    const savedModel = localStorage.getItem('gemini_model');
    const supUrl = localStorage.getItem('supabase_url');
    const supKey = localStorage.getItem('supabase_key');

    if (key) {
        apiKeyInput.value = key;
        await refreshModels();
    }

    if (savedModel && modelSelect.querySelector(`option[value="${savedModel}"]`)) {
        modelSelect.value = savedModel;
    }

    if (supUrl) supabaseUrlInput.value = supUrl;
    if (supKey) supabaseKeyInput.value = supKey;
}

async function refreshModels() {
    const key = apiKeyInput.value.trim();
    if (!key) return;

    const models = await getAvailableModels(key);
    if (models.length > 0) {
        modelSelect.innerHTML = models.map(m =>
            `<option value="${m}">${m}</option>`
        ).join('');

        // Restore selection if possible
        const saved = localStorage.getItem('gemini_model');
        if (saved && models.includes(saved)) {
            modelSelect.value = saved;
        }

        showToast(`Loaded ${models.length} available AI models.`);
    } else {
        modelSelect.innerHTML = '<option value="">No models found</option>';
        showToast('No compatible models found for this API key.');
    }
}

function saveSettings() {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    let supUrl = supabaseUrlInput.value.trim();
    const supKey = supabaseKeyInput.value.trim();

    if (key) {
        localStorage.setItem('gemini_api_key', key);
        localStorage.setItem('gemini_model', model);
    }

    if (supUrl && supKey) {
        // Auto-fix URL: Add https:// if missing
        if (!supUrl.startsWith('http://') && !supUrl.startsWith('https://')) {
            supUrl = 'https://' + supUrl;
            supabaseUrlInput.value = supUrl; // Update UI to reflect change
        }

        // Basic validation
        try {
            new URL(supUrl);
        } catch (e) {
            showToast('Invalid URL format. Please check the Supabase URL.');
            return; // Stop saving
        }

        localStorage.setItem('supabase_url', supUrl);
        localStorage.setItem('supabase_key', supKey);

        showToast('Saving...');

        // Re-init if they changed
        initSupabase().then(() => {
            settingsModal.classList.add('hidden');
            // Success handled in initSupabase
        });
        return;
    }

    settingsModal.classList.add('hidden');
    showToast('Settings saved!');
}

function toggleApiKeyVisibility() {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
}

function switchTab(tabId) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === tabId);
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
