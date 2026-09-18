import { GoogleGenAI, ThinkingLevel } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface FormulaSolveResult {
  formulaName: string;
  expression: string;
  result: string;
  latex: string;
  category: string;
  summary: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    explanation: string;
    mathExpression: string;
    tip?: string;
  }>;
  alternativeForms?: string[];
  keyConcepts?: string[];
}

export async function solveMathFormula(
  formulaName: string,
  expression: string,
  variables: Record<string, string | number>,
  useHighThinking = false
): Promise<FormulaSolveResult> {
  const ai = getAi();
  const modelName = useHighThinking ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';

  const prompt = `You are a master mathematics professor and formula calculator engine.
Calculate the following math formula / problem step-by-step:
Formula/Topic: ${formulaName || 'General Math Formula'}
Input Expression / Equation: ${expression}
Variable Values provided: ${JSON.stringify(variables)}

You MUST provide a rigorous mathematical calculation with an exhaustive, pedagogically clear step-by-step breakdown.
Return your answer strictly in valid JSON format matching this structure:
{
  "formulaName": "Name of the formula or concept",
  "expression": "Cleaned up standard formula expression",
  "result": "Final calculated numerical or symbolic answer",
  "latex": "Full LaTeX representation of the final answer or main identity",
  "category": "Algebra | Calculus | Geometry | Physics | Statistics | Financial | Trigonometry",
  "summary": "Brief 1-2 sentence explanation of the result and its physical/mathematical meaning",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Clear title for step 1",
      "explanation": "Intuitive textual explanation of why this step is performed",
      "mathExpression": "LaTeX or clean math expression for this step",
      "tip": "Helpful conceptual rule or memory trick (optional)"
    }
  ],
  "alternativeForms": ["alternate simplification or notation"],
  "keyConcepts": ["Relevant theorem or rule used"]
}`;

  try {
    const config: any = {
      responseMimeType: 'application/json',
      systemInstruction:
        'You are an expert math formula solver and tutor. Always return well-formed JSON only, no markdown ticks around it if possible, and ensure calculations are mathematically accurate.',
    };

    if (useHighThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config,
    });

    const text = response.text || '{}';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn(`Attempt with ${modelName} failed, falling back to gemini-3.8-flash:`, err);
    // Fallback to gemini-3.8-flash without high thinking
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const text = fallbackResponse.text || '{}';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

export interface CurriculumPlanResult {
  ocrText: string;
  curriculumTitle: string;
  gradeLevel: string;
  subject: string;
  keyUnits: string[];
  diagnosticQuiz: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    topic: string;
  }>;
  suggestedWeeklyPlan: Array<{
    week: number;
    theme: string;
    goals: string[];
    recommendedExercises: string[];
  }>;
  masteryScoreEstimate: number; // score out of 10
}

export async function processCurriculumImage(
  base64Data: string,
  mimeType: string,
  schoolInfo?: { school?: string; grade?: string; book?: string }
): Promise<CurriculumPlanResult> {
  const ai = getAi();

  const prompt = `Analyze this uploaded/scanned syllabus or curriculum photo.
First, perform precise Optical Character Recognition (OCR) to extract all text, chapters, syllabus topics, and exercise listings.
Metadata context:
School: ${schoolInfo?.school || 'Unspecified'}
Grade: ${schoolInfo?.grade || 'High School'}
Book/Curriculum: ${schoolInfo?.book || 'Standard Textbook'}

Then:
1. Provide the complete extracted OCR text.
2. Formulate exactly 10 comprehensive diagnostic questions (a 10-question evaluation test) tailored precisely to this curriculum content.
3. Generate a structured 4-week student study plan and course roadmap with weekly goals and practice recommendations.
4. Estimate an initial baseline mastery score (out of 10) for someone starting this curriculum.

Return strictly valid JSON format:
{
  "ocrText": "Full text recognized from the image",
  "curriculumTitle": "Curriculum / Syllabus Title",
  "gradeLevel": "Recognized Grade or Level",
  "subject": "Mathematics topic (e.g., Pre-Calculus, Linear Algebra, AP Calculus BC)",
  "keyUnits": ["Unit 1", "Unit 2", "Unit 3"],
  "diagnosticQuiz": [
    {
      "id": 1,
      "question": "Math question testing core prerequisite",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Why Option A is correct",
      "topic": "Specific chapter or unit"
    }
  ],
  "suggestedWeeklyPlan": [
    {
      "week": 1,
      "theme": "Theme title",
      "goals": ["Goal 1", "Goal 2"],
      "recommendedExercises": ["Exercise 1", "Exercise 2"]
    }
  ],
  "masteryScoreEstimate": 7.5
}`;

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType || 'image/jpeg',
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [imagePart, { text: prompt }],
    },
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

export interface MiniExam {
  title: string;
  grade: string;
  chapter: string;
  book?: string;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    formulaRequired?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
}

export async function generateMiniExam(params: {
  grade: string;
  chapter: string;
  book?: string;
  school?: string;
  questionCount?: number;
}): Promise<MiniExam> {
  const ai = getAi();
  const count = params.questionCount || 5;

  const prompt = `Generate a rigorous mini mathematics exam for student exam preparation:
Grade Level: ${params.grade}
Chapter / Topic: ${params.chapter}
Textbook: ${params.book || 'Standard High School/College Math'}
School: ${params.school || 'General'}
Question Count: ${count}

Include varied difficulty (Easy, Medium, Hard). Each question must have 4 multiple-choice options, correct answer index (0-3), detailed step-by-step explanation, and the formula required.

Return strictly valid JSON:
{
  "title": "${params.chapter} Mini-Exam",
  "grade": "${params.grade}",
  "chapter": "${params.chapter}",
  "book": "${params.book || 'Standard'}",
  "questions": [
    {
      "id": 1,
      "question": "Question text with clear values",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 1,
      "explanation": "Detailed breakdown of the mathematical solution",
      "formulaRequired": "Name or formula (e.g. Quadratic Formula)",
      "difficulty": "Medium"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function gradeExamAndGiveFeedback(
  examTitle: string,
  grade: string,
  chapter: string,
  userResponses: Array<{ question: string; selectedOption: string; isCorrect: boolean; topic?: string }>
) {
  const ai = getAi();
  const correctCount = userResponses.filter((r) => r.isCorrect).length;
  const scorePercent = Math.round((correctCount / userResponses.length) * 100);

  const prompt = `Analyze this student's exam performance:
Exam: ${examTitle} (${grade}, ${chapter})
Score: ${correctCount}/${userResponses.length} (${scorePercent}%)
Responses: ${JSON.stringify(userResponses)}

Provide personalized guidance, an assessment of strengths, weaknesses, a targeted improvement plan, and notes suitable for a parent report.

Return JSON:
{
  "scorePercent": ${scorePercent},
  "gradeBand": "A+ / A / B / C / Needs Review",
  "strengths": ["Strong understanding of X"],
  "weaknesses": ["Needs practice on Y"],
  "targetedStudyAdvice": "Concrete 2-3 sentence advice",
  "recommendedFormulasToReview": ["Formula 1", "Formula 2"],
  "parentSummary": "Warm, constructive summary written for parents about student performance and path to mastery."
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text || '{}';
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function chatMathTutor(
  messages: Array<{ role: 'user' | 'assistant'; text?: string; content?: string }>,
  context?: { grade?: string; chapter?: string; activeFormula?: string }
) {
  const ai = getAi();
  const formattedContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text || m.content || '' }],
  }));

  const systemInstruction = `You are "Hypatia", a world-class, encouraging, and pedagogically brilliant Math Tutor AI Assistant.
Context:
Student Grade: ${context?.grade || 'High School / College'}
Current Focus: ${context?.chapter || 'General Mathematics'}
Active Formula: ${context?.activeFormula || 'None'}

Rules:
1. Guide the student with Socratic questioning, gentle hints, and clear intuition before just giving away answers.
2. Use LaTeX formatting for mathematical expressions like $E = mc^2$ or $\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$.
3. When explaining steps, break them down into digestible logic blocks.
4. Always remain positive, patient, encouraging, and clear.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: formattedContents,
    config: {
      systemInstruction,
    },
  });

  return response.text || '';
}
