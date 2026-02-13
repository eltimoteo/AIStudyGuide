const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function getAvailableModels(apiKey) {
    try {
        const response = await fetch(`${BASE_URL}?key=${apiKey}`);
        if (!response.ok) return [];
        const data = await response.json();
        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));

        // Ensure the reliable flash model is present
        if (!models.includes('gemini-1.5-flash-001')) {
            models.unshift('gemini-1.5-flash-001');
        }
        return models;
    } catch (e) {
        console.error('Failed to list models', e);
        return [];
    }
}

export async function generateStudyGuide(apiKey, model, text) {
    const prompt = `
    You are an expert tutor. Create a comprehensive study guide based on the following text.
    Format the output in clean Markdown.
    Include:
    1. A summary of key concepts.
    2. Detailed explanations of important terms.
    3. Key formulas or dates (if applicable).
    
    Text:
    ${text.substring(0, 30000)} 
    `;

    return await callGemini(apiKey, model, prompt);
}

export async function generateQuiz(apiKey, model, text) {
    const prompt = `
    Create a 5-question multiple choice quiz based on the following text.
    Return the response ONLY as a raw JSON array, without any markdown formatting or code blocks.
    
    Format:
    [
        {
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option B"
        }
    ]

    Text:
    ${text.substring(0, 30000)}
    `;

    const response = await callGemini(apiKey, model, prompt);

    try {
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse quiz JSON", e);
        return [];
    }
}

async function callGemini(apiKey, model, prompt) {
    try {
        // Default to a safe model if none provided
        const safeModel = model || 'gemini-1.5-flash';

        const response = await fetch(`${BASE_URL}/${safeModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;
            throw new Error(`API Error (${response.status}): ${errorMessage}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API Call Failed:', error);
        throw error;
    }
}
