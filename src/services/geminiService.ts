export async function searchJobs(titles: string[], locations: string[]) {
  const response = await fetch('/api/search-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titles, locations }),
  });
  if (!response.ok) throw new Error('Failed to search jobs');
  return response.json();
}

export async function tailorResume(resume: string, jobDescription: string) {
  const response = await fetch('/api/tailor-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, jobDescription }),
  });
  if (!response.ok) throw new Error('Failed to tailor resume');
  const data = await response.json();
  return data.text;
}

export async function generateCoverLetter(resume: string, jobDescription: string) {
  const response = await fetch('/api/generate-cover-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, jobDescription }),
  });
  if (!response.ok) throw new Error('Failed to generate cover letter');
  const data = await response.json();
  return data.text;
}

export async function answerJobQuestions(resume: string, questions: string[]) {
  const response = await fetch('/api/answer-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, questions }),
  });
  if (!response.ok) throw new Error('Failed to answer questions');
  return response.json();
}
