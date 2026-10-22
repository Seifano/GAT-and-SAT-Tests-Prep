import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parser with generous limit for document text & large exam papers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// AI Question Extraction & Auto-Classification Endpoint
app.post('/api/ai/extract-questions', async (req: Request, res: Response) => {
  try {
    const { text, exam = 'Auto' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No text provided for question extraction.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.'
      });
    }

    const ai = new GoogleGenAI();

    const systemInstruction = `You are an expert psychometric test parser and curriculum classifier specializing in:
1. Digital SAT (College Board USA):
   - Sections: "Math", "Reading & Writing"
   - Math Skills: "Algebra", "Advanced Math", "Problem-Solving & Data Analysis", "Geometry & Trigonometry"
   - Reading & Writing Skills: "Craft & Structure", "Information & Ideas", "Standard English Conventions", "Expression of Ideas"

2. GAT / Qudurat (Saudi Arabia ETEC / Qiyas):
   - Sections: "Quantitative", "Verbal"
   - Quantitative Skills: "Arithmetic & Algebra", "Geometry", "Comparison", "Data Analysis", "Word Problems"
   - Verbal Skills: "Verbal Analogy", "Sentence Completion", "Reading Comprehension", "Contextual Error", "Relationship"

3. NAFS National Assessments (Saudi Arabia Ministry of Education & ETEC):
   - Sections: "Reading - Grade 6", "Mathematics - Grade 6", "Science - Grade 6", "Reading - Grade 9", "Mathematics - Grade 9", "Science - Grade 9"
   - Skills: "Main Idea & Themes", "Author's Purpose & Perspective", "Inference & Conclusion", "Vocabulary & Context", "Numbers & Operations", "Patterns & Algebra", "Geometry & Measurement", "Data & Probability", "Life Science", "Physical Science", "Earth & Space"

INSTRUCTIONS:
- Analyze the provided text from test files (PDF, Word, or plain text).
- Extract every multiple choice question.
- If a question has an attached reading passage, article, or stimulus text, extract it into the 'passage' field.
- Extract exactly 4 options (A, B, C, D). If fewer are present, infer standard plausible options.
- Determine the correct answer index: 0 for A, 1 for B, 2 for C, 3 for D.
- Provide a clear, step-by-step educational explanation in 'explain'.
- Accurately classify the target 'exam' (${exam === 'Auto' ? 'auto-detect SAT, GAT, or NAFS' : `target: ${exam}`}), the 'section', and the specific 'skill' according to the official curriculum taxonomies above.
- Return a JSON object with a list of extracted questions.`;

    const prompt = `Extract and classify all test questions from the following text document content:

${text.slice(0, 75000)}

${exam !== 'Auto' ? `Target Exam: ${exam}` : 'Auto-detect target exam (SAT, GAT, or NAFS)'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedExam: {
              type: Type.STRING,
              description: 'The overall exam identified (SAT, GAT, or NAFS)'
            },
            summary: {
              type: Type.STRING,
              description: 'Brief summary of what questions were extracted'
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: {
                    type: Type.STRING,
                    description: 'The question text and problem statement'
                  },
                  passage: {
                    type: Type.STRING,
                    description: 'Reading passage or contextual stimulus (optional)'
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'The 4 multiple choice answer options (A, B, C, D)'
                  },
                  answer: {
                    type: Type.INTEGER,
                    description: '0-based index of correct option: 0=A, 1=B, 2=C, 3=D'
                  },
                  explain: {
                    type: Type.STRING,
                    description: 'Step-by-step explanation of the solution rationale'
                  },
                  exam: {
                    type: Type.STRING,
                    description: 'SAT, GAT, or NAFS'
                  },
                  section: {
                    type: Type.STRING,
                    description: 'Specific exam section (e.g. Math, Reading & Writing, Quantitative, Verbal)'
                  },
                  skill: {
                    type: Type.STRING,
                    description: 'Specific curriculum skill according to syllabus taxonomy'
                  }
                },
                required: ['prompt', 'options', 'answer', 'explain', 'exam', 'section', 'skill']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const questions = Array.isArray(parsedJson.questions) ? parsedJson.questions : [];

    return res.json({
      success: true,
      count: questions.length,
      detectedExam: parsedJson.detectedExam || exam,
      summary: parsedJson.summary || `Extracted ${questions.length} questions`,
      questions
    });
  } catch (error: any) {
    console.error('Error extracting questions with Gemini AI:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to extract questions with Gemini AI'
    });
  }
});

// Mount Vite middleware in development or serve static assets in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AHS Exams Prepline server listening on http://0.0.0.0:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
