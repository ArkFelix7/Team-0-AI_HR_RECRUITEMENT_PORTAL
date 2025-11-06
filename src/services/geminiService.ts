import { GoogleGenAI, Type } from '@google/genai';
import { TranscriptEntry, Analysis, CallAnalysis } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. AI features will not work.');
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ========== RESUME ANALYSIS ==========
export async function analyzeResume(
  resumeText: string,
  jobDescription: string
): Promise<{ score: number; strengths: string; weaknesses: string }> {
  if (!ai) {
    throw new Error('Gemini API not configured');
  }

  const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      score: {
        type: Type.INTEGER,
        description: 'A compatibility score from 0 to 100, where 100 is a perfect match.',
      },
      strengths: {
        type: Type.STRING,
        description: 'A concise summary of why the candidate is a good fit, highlighting key skills and experiences that align with the job description.',
      },
      weaknesses: {
        type: Type.STRING,
        description: 'A list of potential gaps or areas where the candidate\'s profile is weaker in relation to the job requirements.',
      },
    },
    required: ['score', 'strengths', 'weaknesses'],
  };

  const prompt = `
    Job Description:
    ---
    ${jobDescription}
    ---

    Candidate's Resume:
    ---
    ${resumeText}
    ---

    Please provide your analysis in the specified JSON format. The analysis should include:
    1. A compatibility score from 0 to 100, where 100 is a perfect match.
    2. A concise summary of why the candidate is a good fit, highlighting key skills and experiences that align with the job description.
    3. A list of potential gaps or areas where the candidate's profile is weaker in relation to the job requirements.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const jsonString = (response.text || '').trim();
    if (!jsonString) {
      throw new Error('Empty response from AI');
    }
    const result = JSON.parse(jsonString);
    
    return {
      score: Math.min(100, Math.max(0, result.score)),
      strengths: result.strengths,
      weaknesses: result.weaknesses
    };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw new Error('Failed to analyze resume');
  }
}

// ========== CALL ANALYSIS ==========
export async function analyzeCallTranscript(
  transcript: TranscriptEntry[]
): Promise<CallAnalysis> {
  if (!ai) {
    throw new Error('Gemini API not configured');
  }

  const transcriptText = transcript
    .filter(t => t.isFinal !== false)
    .map(t => `${t.speaker}: ${t.text}`)
    .join('\n');

  const callSchema = {
    type: Type.OBJECT,
    properties: {
      confirmedSlot: {
        type: Type.STRING,
        description: 'The scheduled interview date/time mentioned, or "Not confirmed" if none',
      },
      summary: {
        type: Type.STRING,
        description: 'Brief summary of the call in 2-3 sentences',
      },
      personalityAnalysis: {
        type: Type.STRING,
        description: 'Analysis of candidate\'s communication style, responsiveness, and professionalism',
      },
    },
    required: ['confirmedSlot', 'summary', 'personalityAnalysis'],
  };

  const prompt = `Analyze the following phone conversation transcript between an AI scheduler and a candidate.

Transcript:
${transcriptText}

Provide your analysis in the specified JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: callSchema,
      },
    });

    const jsonString = (response.text || '').trim();
    if (!jsonString) {
      throw new Error('Empty response from AI');
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error analyzing call:', error);
    throw new Error('Failed to analyze call transcript');
  }
}

// ========== VIDEO INTERVIEW ANALYSIS ==========
export async function analyzeInterview(
  transcript: TranscriptEntry[],
  candidateName: string,
  jobDescription: string,
  resumeHighlights: string,
  emotionData: string
): Promise<Analysis> {
  if (!ai) {
    throw new Error('Gemini API not configured');
  }

  const transcriptText = transcript
    .map(t => `${t.speaker}: ${t.text}`)
    .join('\n');

  const interviewSchema = {
    type: Type.OBJECT,
    properties: {
      overallImpression: { type: Type.STRING },
      confidence: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
        },
      },
      expressiveness: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
        },
      },
      knowledge: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
        },
      },
      communicationSkills: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
        },
      },
      strengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      areasForImprovement: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      emotionAnalysis: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          dominantEmotion: { type: Type.STRING },
        },
      },
    },
  };

  const prompt = `You are an expert interview analyst. Analyze the following technical interview for ${candidateName}.

Job Description:
${jobDescription}

Resume Highlights:
${resumeHighlights}

Interview Transcript:
${transcriptText}

Emotion Data During Interview:
${emotionData || 'Not available'}

Provide a comprehensive analysis in the specified JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: interviewSchema,
      },
    });

    const jsonString = (response.text || '').trim();
    if (!jsonString) {
      throw new Error('Empty response from AI');
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error analyzing interview:', error);
    throw new Error('Failed to analyze interview');
  }
}

// Export the ai instance for use in other components (like the existing call/interview features)
export { ai };
