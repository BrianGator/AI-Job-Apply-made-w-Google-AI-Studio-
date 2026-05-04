import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY not found in environment. While developing in the cloud environment, this is usually injected automatically. If running locally or on GitHub, you must provide your own key in a .env file.');
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'temporary_key_for_build' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES ---

  app.post('/api/search-jobs', async (req, res) => {
    try {
      const { titles, locations } = req.body;
      const prompt = `Find current job openings on LinkedIn, Indeed, Dice, and ZipRecruiter for the following roles: ${titles.join(', ')} in ${locations.join(', ')}. 
      Focus on remote roles or those specifically in ${locations.filter((l: string) => l.toLowerCase().includes('tampa')).length > 0 ? 'Tampa, FL' : locations.join(', ')}.
      Return a list of jobs with Title, Company, Location, Description Summary, URL, and Source.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                url: { type: Type.STRING },
                source: { type: Type.STRING },
                isRemote: { type: Type.BOOLEAN }
              },
              required: ["title", "company", "url"]
            }
          },
          tools: [{ googleSearch: {} }]
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error('Search jobs error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/tailor-resume', async (req, res) => {
    try {
      const { resume, jobDescription } = req.body;
      const prompt = `You are a professional resume writer and career coach. 
      JOB DESCRIPTION:
      ${jobDescription}
      CURRENT RESUME:
      ${resume}
      TASK:
      Tailor the resume to match the job description. Highlight relevant skills and experiences. 
      Ensure the phrasing matches industry standards for ATS. Return in Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/generate-cover-letter', async (req, res) => {
    try {
      const { resume, jobDescription } = req.body;
      const prompt = `Write a compelling cover letter based on the following resume and job description.
      JOB DESCRIPTION:
      ${jobDescription}
      RESUME:
      ${resume}
      Ensure it is professional, enthusiastic, and under 400 words. Return in Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      res.json({ text: response.text });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/answer-questions', async (req, res) => {
    try {
      const { resume, questions } = req.body;
      const prompt = `Based on this resume: ${resume}
      Please provide professional and concise answers to: ${questions.join('\n- ')}
      Format as a JSON object where keys are the questions and values are the answers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            description: "Mapping of questions to answers"
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
