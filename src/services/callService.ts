import { GoogleGenAI, Modality, Type } from '@google/genai';
import { TranscriptEntry, Speaker, CallAnalysis, ResumeAnalysis } from '../types';

export const startLiveCallSession = (
  candidateName: string,
  jobTitle: string,
  companyDepartment: string,
  resumeAnalysis: ResumeAnalysis | null,
  updateTranscript: (entry: TranscriptEntry) => void,
  handleAudioPlayback: (audio: string) => void,
  setConnectionError: (error: string) => void
): Promise<any> => {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    return Promise.reject(new Error('Gemini API key not configured'));
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Build context-aware system instruction
  const resumeContext = resumeAnalysis 
    ? `\n\nCandidate Background:
- Resume Score: ${resumeAnalysis.score}/100
- Key Strengths: ${resumeAnalysis.strengths?.substring(0, 200) || 'Strong candidate'}
- Areas to assess in interview: ${resumeAnalysis.weaknesses?.substring(0, 200) || 'General technical skills'}`
    : '';

  const SYSTEM_INSTRUCTION = `You are a friendly and professional AI hiring assistant calling ${candidateName} to schedule a technical interview.

Job Details:
- Position: ${jobTitle}
- Department: ${companyDepartment}${resumeContext}

Your task:
1. Greet the candidate: "Good [morning/afternoon], am I speaking with ${candidateName}?"
2. Ask if it's a good time to talk
3. If yes, explain: "I'm calling regarding your application for the ${jobTitle} position. We'd like to schedule a technical interview with you."
4. Offer three specific interview slots:
   - "Monday at 10 AM"
   - "Wednesday at 2 PM" 
   - "Friday at 4 PM"
5. Wait for the candidate to confirm one slot
6. Once confirmed, repeat the slot back and thank them
7. End the call politely

Keep responses concise and natural. If the candidate has questions about the role, provide brief, relevant information based on the context provided.`;

  return ai.live.connect({
    model: 'gemini-2.0-flash-exp',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { 
        voiceConfig: { 
          prebuiltVoiceConfig: { voiceName: 'Kore' } 
        } 
      },
      systemInstruction: SYSTEM_INSTRUCTION,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => {
        console.log('Call session opened');
      },
      onmessage: (message: any) => {
        if (message.serverContent?.inputTranscription) {
          const { text, isFinal } = message.serverContent.inputTranscription;
          updateTranscript({ speaker: Speaker.USER, text, isFinal });
        }
        if (message.serverContent?.outputTranscription) {
          const { text, isFinal } = message.serverContent.outputTranscription;
          updateTranscript({ speaker: Speaker.AI, text, isFinal });
        }
        const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audio) {
          handleAudioPlayback(audio);
        }
      },
      onclose: () => {
        console.log('Call session closed');
      },
      onerror: (e: ErrorEvent) => {
        console.error('Live session error:', e);
        setConnectionError('A connection error occurred. Please try again.');
      },
    },
  });
};

export const getPostCallAnalysis = async (
  transcript: TranscriptEntry[]
): Promise<CallAnalysis | null> => {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    return null;
  }

  const fullTranscript = transcript
    .filter(t => t.isFinal)
    .map(t => `${t.speaker}: ${t.text}`)
    .join('\n');

  if (!fullTranscript) return null;

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Based on the following interview scheduling call transcript, provide a detailed analysis.
      
Transcript:
---
${fullTranscript}
---
`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confirmedSlot: {
              type: Type.STRING,
              description: 'The specific date and time confirmed by the candidate. If not confirmed, state "Not Confirmed".'
            },
            summary: {
              type: Type.STRING,
              description: 'A brief, 2-3 sentence summary of the entire conversation.'
            },
            personalityAnalysis: {
              type: Type.STRING,
              description: 'Analyze the candidate\'s tone, confidence, and politeness based on their words. Provide a 2-3 sentence analysis.'
            }
          },
          required: ['confirmedSlot', 'summary', 'personalityAnalysis']
        }
      }
    });

    const jsonText = (response.text || '').trim();
    if (!jsonText) {
      return null;
    }
    return JSON.parse(jsonText) as CallAnalysis;
  } catch (error) {
    console.error('Error getting post-call analysis:', error);
    return null;
  }
};
