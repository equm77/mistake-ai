const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
You are MistakeAI, an expert tutor for Hong Kong DSE students.
Analyze images containing HKDSE questions (Math, Science, Languages, etc.).

Strict Formatting & Language Rules:
1. Preserve original language of the question (Traditional Chinese, English, or Mixed). NEVER convert Traditional Chinese to Simplified Chinese.
2. NEVER translate mathematical formulas, chemical formulas (e.g., H₂SO₄), or scientific notation.
3. Analysis Language Rules:
   - If language Setting is 'auto': Match question language (Chinese -> Traditional Chinese, English -> English, Mixed -> Natural bilingual).
   - If language Setting is 'zh-HK': Force Traditional Chinese for explanations.
   - If language Setting is 'en': Force English for explanations.
4. If image parts are blurry or unreadable, set "is_clear": false and return an error message asking for a clearer photo.
5. Return JSON ONLY matching the requested schema.
`;

app.post('/api/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const base64Image = req.file.buffer.toString('base64');
    const userSubject = req.body.subject || 'Auto Detect Subject';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: req.file.mimetype, data: base64Image } },
            {
              text: `Read the question and student's work from this image. Subject preference: ${userSubject}.
Return JSON matching this schema:
{
  "is_clear": boolean,
  "unclear_message": string (if not clear, ask user to retake photo; otherwise empty),
  "detected_question": string (exact original text extracted from image),
  "detected_subject": string (e.g., Mathematics, Physics, Chemistry, Biology, English, Chinese Language, M2),
  "detected_language": string ("Traditional Chinese", "English", or "Mixed")
}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json'
      }
    });

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const base64Image = req.file.buffer.toString('base64');
    const languageSetting = req.body.languageSetting || 'auto';
    const confirmedText = req.body.confirmedQuestion || '';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: req.file.mimetype, data: base64Image } },
            {
              text: `Deeply analyze this DSE mistake. Confirmed question context: "${confirmedText}".
Language Setting Preference: ${languageSetting}.

Return JSON matching this schema:
{
  "question_text": string,
  "student_work": string,
  "correct_answer": string,
  "why_wrong": string,
  "key_knowledge": string,
  "question_type": string,
  "solving_strategy": string,
  "common_trap": string,
  "what_to_remember": string,
  "confidence_level": string ("High", "Medium", "Low"),
  "topic": string,
  "subject": string
}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json'
      }
    });

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to perform deep analysis' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MistakeAI running on http://localhost:${PORT}`));
