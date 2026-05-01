import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

export async function searchJobs(titles: string[], locations: string[]) {
  const prompt = `Find current job openings on LinkedIn, Indeed, Dice, and ZipRecruiter for the following roles: ${titles.join(', ')} in ${locations.join(', ')}. 
  Focus on remote roles or those specifically in ${locations.filter(l => l.toLowerCase().includes('tampa')).length > 0 ? 'Tampa, FL' : locations.join(', ')}.
  Return a list of jobs with Title, Company, Location, Description Summary, URL, and Source.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
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
      }
    }
  });

  return JSON.parse(response.text);
}

export async function tailorResume(resume: string, jobDescription: string) {
  const prompt = `You are a professional resume writer and career coach. 
  
  JOB DESCRIPTION:
  ${jobDescription}
  
  CURRENT RESUME:
  ${resume}
  
  TASK:
  Tailor the resume to match the job description. Highlight relevant skills and experiences. 
  Ensure the phrasing matches industry standards for ATS (Applicant Tracking Systems).
  Provide the result in Markdown format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });

  return response.text;
}

export async function generateCoverLetter(resume: string, jobDescription: string) {
  const prompt = `Write a compelling cover letter based on the following resume and job description.
  
  JOB DESCRIPTION:
  ${jobDescription}
  
  RESUME:
  ${resume}
  
  Ensure it is professional, enthusiastic, and under 400 words. Return in Markdown.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

export async function answerJobQuestions(resume: string, questions: string[]) {
  const prompt = `Based on this resume:
  ${resume}
  
  Please provide professional and concise answers to the following application questions:
  ${questions.join('\n- ')}
  
  Format as a JSON object where keys are the questions and values are the answers.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        description: "Mapping of questions to answers"
      }
    }
  });

  return JSON.parse(response.text);
}
