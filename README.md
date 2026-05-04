# ApplyFlow.AI | Career Trajectory Optimization

ApplyFlow.AI is a powerful career assistant designed to streamline your job search and application workflow. By combining the latest in AI search grounding with sophisticated language models, ApplyFlow.AI ensures your professional materials are perfectly aligned with the roles you want.

## Key Features Implemented
- **Live Job Searching**: Powered by Gemini 1.5 Flash with real-time web grounding to find the latest opportunities.
- **AI Resume Tailoring**: Instant analysis and rewriting of your resume to match specific job descriptions.
- **Smart Cover Letters**: Custom cover letters generated in seconds based on your experience and target role.
- **Application Q&A Assistant**: Automatically drafts answers to tricky application questions using your resume content.
- **Full-Stack Security**: All AI processing happens on a secure Express backend to protect your API keys and data.

## Project Structure & Tasks
- `/server.ts`: Express backend handling API requests and AI integrations.
- `/src/components`: UI components for the search, resume, and application tools.
- `/src/services`: Frontend service layer for API communication.
- `/src/App.tsx`: Main application dashboard and state orchestration.
- `/Dev-Summary.txt`: Detailed technical breakdown of the architecture.
- `/Requirements.txt`: Original project scope and goals.

## How to use
1. **Environment Awareness**:
   - In the **Cloud Development Environment**, the `GEMINI_API_KEY` is provided automatically. You do not need to create a `.env` file or set any secrets to see the app in action.
   - For **External Use** (GitHub/Local):
     - Rename `.env.example` to `.env`.
     - Add your own `GEMINI_API_KEY` to the `.env` file.
2. **Installation**:
   - Run `npm install` to install dependencies.
3. **Development**:
   - Run `npm run dev` to start the development server (runs on port 3000).
4. **Production**:
   - Run `npm run build` to create a production bundle.
   - Run `npm start` to serve the application using the Express server.
5. **Usage**:
   - Enter your target job titles and locations in the "Search" tab.
   - Paste your current resume and a job description in the "Tailor" tab to optimize your documents.
   - Use the "Q&A" section to get help with specific application questions.
