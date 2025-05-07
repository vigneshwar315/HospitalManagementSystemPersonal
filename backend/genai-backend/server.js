const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

const extractDrugsFromText = (text) => {
    const regex = /\b([A-Z][a-z]+(?:mycin|cillin|pril|zole|dipine|olol|caine|sartan|mab|nib)?)\b/g;
    const matches = text.match(regex) || [];
    return [...new Set(matches)];
};

const fetchDrugDetails = async (medicines) => {
    const prompt = `
You are a medical assistant. Return only a JSON array of medicine details.

Example:
[
  {
    "medicine": "Paracetamol",
    "sideEffects": [...],
    "description": "...",
    "precautions": [...],
    "dosage": "..."
  }
]

Now return data for:
${medicines.join(', ')}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("🧠 Gemini raw output:", text);

    const cleanJson = text.replace(/```(json)?/g, '').trim();
    return JSON.parse(cleanJson);
};

app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }

        const data = await pdfParse(req.file.buffer);
        const medicines = extractDrugsFromText(data.text);

        if (medicines.length === 0) {
            return res.status(404).json({ message: 'No medicine names found' });
        }

        const drugDetails = await fetchDrugDetails(medicines);

        // 🛠️ Normalize structure: Gemini might return an object instead of an array
        const finalMedicines = Array.isArray(drugDetails)
            ? drugDetails
            : drugDetails.prescribedMedicines || [];

        if (!finalMedicines.length) {
            return res.status(404).json({ message: 'No medicine details returned' });
        }

        res.json({ medicines: finalMedicines });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({
            error: 'Failed to process the file or fetch drug info',
            message: err.message
        });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        let { medicines } = req.body;

        if (!medicines) {
            return res.status(400).json({ error: 'Please provide medicine name(s)' });
        }

        if (!Array.isArray(medicines)) {
            medicines = [medicines];
        }

        const drugDetails = await fetchDrugDetails(medicines);
        res.json({ medicines: drugDetails });

    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Failed to fetch drug info', message: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
