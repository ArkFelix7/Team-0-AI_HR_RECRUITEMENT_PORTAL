import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { TranscriptEntry, Speaker, ResumeAnalysis, Job } from '../types';
import { analyzeInterview } from '../services/geminiService';
import { saveVideoInterview, saveInterviewAnalysis } from '../services/supabaseService';

// LiveSession type definition
interface LiveSession {
  close: () => void;
  sendRealtimeInput: (input: { media: { data: string; mimeType: string } }) => void;
}

// Declare faceapi for emotion detection
declare const faceapi: any;

// Helper functions for audio encoding/decoding
const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

interface InterviewSchedulerProps {
  candidateId: string;
  candidateName: string;
  jobDetails: Job;
  resumeAnalysis: ResumeAnalysis | null | undefined;
  onComplete: () => void;
}

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  candidateId,
  candidateName,
  jobDetails,
  resumeAnalysis,
  onComplete
}) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  
  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const mixingContextRef = useRef<AudioContext | null>(null);
  const recordingDestinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const hasEndedRef = useRef(false);
  const isLiveRef = useRef(isLive);

  const emotionHistoryRef = useRef<any[]>([]);
  const faceApiIntervalRef = useRef<number | null>(null);
  const modelsLoaded = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isInitializedRef = useRef(false); // Prevent double initialization
  const analysisTimeoutRef = useRef<number | null>(null); // Timeout for analysis

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  const stopFaceApi = () => {
    if (faceApiIntervalRef.current) {
      clearInterval(faceApiIntervalRef.current);
      faceApiIntervalRef.current = null;
    }
  };

  const processEmotionData = (): string => {
    if (emotionHistoryRef.current.length === 0) {
      return "No facial expression data was collected.";
    }

    const emotionCounts: Record<string, number> = {};
    let validDetections = 0;

    emotionHistoryRef.current.forEach(detection => {
      if (detection && detection.expressions) {
        const expressions = detection.expressions;
        let dominantEmotion: string | null = null;
        let maxScore = 0;

        for (const [emotion, score] of Object.entries(expressions)) {
          if ((score as number) > maxScore) {
            maxScore = score as number;
            dominantEmotion = emotion;
          }
        }
        
        if (dominantEmotion && maxScore > 0.5) {
          validDetections++;
          emotionCounts[dominantEmotion] = (emotionCounts[dominantEmotion] || 0) + 1;
        }
      }
    });

    if (validDetections === 0) {
      return "Could not confidently detect distinct facial expressions.";
    }

    const overallDominantEmotion = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);
    
    const percentages = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([emotion, count]) => {
        const capitalized = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        return `${capitalized} (${((count / validDetections) * 100).toFixed(0)}%)`;
      }).join(', ');
    
    const capitalizedDominant = overallDominantEmotion.charAt(0).toUpperCase() + overallDominantEmotion.slice(1);
    
    return `The dominant emotion detected was '${capitalizedDominant}'. Breakdown: ${percentages}.`;
  };

  const stopStreaming = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (mixingContextRef.current && mixingContextRef.current.state !== 'closed') {
      for (const source of audioSourcesRef.current.values()) {
        try {
          source.stop();
        } catch (e) {
          // Ignore
        }
      }
      audioSourcesRef.current.clear();
      mixingContextRef.current.close();
    }
  }, []);

  const endInterview = useCallback(async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    
    console.log('Ending interview...');
    stopFaceApi();
    setIsLive(false);
    setIsConnecting(false);
    setIsAnalyzing(true);

    // Set a timeout fallback to ensure modal closes even if processing fails
    analysisTimeoutRef.current = window.setTimeout(() => {
      console.error('Analysis timeout - forcing modal close');
      setIsAnalyzing(false);
      stopStreaming();
      onComplete();
    }, 60000); // 60 second timeout

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    const interviewEndTime = new Date();
    const durationSeconds = interviewStartTime 
      ? Math.floor((interviewEndTime.getTime() - interviewStartTime.getTime()) / 1000)
      : 0;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log('Stopping media recorder...');
      
      mediaRecorderRef.current.addEventListener('stop', async () => {
        console.log('Media recorder stopped, processing data...');
        
        try {
          const recordingBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          console.log(`Recording blob size: ${recordingBlob.size} bytes`);
          
          const emotionSummary = processEmotionData();
          console.log('Emotion summary:', emotionSummary);
          
          // Save video interview
          console.log('Saving video interview to database...');
          const videoInterview = await saveVideoInterview(candidateId, {
            video_blob: recordingBlob,
            video_duration_seconds: durationSeconds,
            transcript,
            emotion_data: emotionSummary,
            interview_started_at: interviewStartTime?.toISOString() || new Date().toISOString(),
            interview_ended_at: interviewEndTime.toISOString(),
          });

          if (videoInterview) {
            console.log('Video interview saved, ID:', videoInterview.id);
            
            // Get AI analysis
            const resumeHighlights = resumeAnalysis 
              ? `Score: ${resumeAnalysis.score}/100. Strengths: ${resumeAnalysis.strengths}`
              : 'No resume analysis available';

            console.log('Analyzing interview with AI...');
            const analysis = await analyzeInterview(
              transcript,
              candidateName,
              jobDetails.description,
              resumeHighlights,
              emotionSummary
            );

            // Save analysis
            if (analysis) {
              console.log('Analysis received, saving to database...');
              await saveInterviewAnalysis(videoInterview.id, candidateId, {
                overall_impression: analysis.overallImpression,
                confidence_score: analysis.confidence.score,
                confidence_reasoning: analysis.confidence.reasoning,
                expressiveness_score: analysis.expressiveness.score,
                expressiveness_reasoning: analysis.expressiveness.reasoning,
                knowledge_score: analysis.knowledge.score,
                knowledge_reasoning: analysis.knowledge.reasoning,
                communication_score: analysis.communicationSkills.score,
                communication_reasoning: analysis.communicationSkills.reasoning,
                strengths: analysis.strengths,
                areas_for_improvement: analysis.areasForImprovement,
                emotion_summary: analysis.emotionAnalysis.summary,
                dominant_emotion: analysis.emotionAnalysis.dominantEmotion,
              });
              console.log('Analysis saved successfully!');
            } else {
              console.warn('No analysis returned from AI');
            }
          } else {
            console.error('Failed to save video interview');
          }

          console.log('Interview processing complete, closing modal...');
          
          // Clear the timeout since we completed successfully
          if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
            analysisTimeoutRef.current = null;
          }
          
          setIsAnalyzing(false);
          stopStreaming();
          onComplete();
        } catch (error) {
          console.error('Error during interview processing:', error);
          
          // Clear the timeout
          if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
            analysisTimeoutRef.current = null;
          }
          
          setError('Failed to save interview. Please try again.');
          setIsAnalyzing(false);
          stopStreaming();
          // Still call onComplete to close the modal
          setTimeout(() => onComplete(), 2000);
        }
      }, { once: true });
      
      mediaRecorderRef.current.stop();
    } else {
      console.log('No recording to process, closing modal...');
      
      // Clear the timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      
      setIsAnalyzing(false);
      stopStreaming();
      onComplete();
    }
  }, [candidateId, candidateName, jobDetails, resumeAnalysis, interviewStartTime, transcript, onComplete, stopStreaming]);

  useEffect(() => {
    // Prevent double initialization
    if (isInitializedRef.current) {
      console.log('Interview already initialized, skipping...');
      return;
    }
    
    isInitializedRef.current = true;
    console.log('Starting interview initialization...');

    const startInterview = async () => {
      setInterviewStartTime(new Date());
      setIsConnecting(true);
      setError(null);

      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!API_KEY) {
        setError("Gemini API key not configured");
        setIsConnecting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        mediaStreamRef.current = stream;
        console.log('Got media stream');

        mixingContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const mixingContext = mixingContextRef.current;
        
        recordingDestinationNodeRef.current = mixingContext.createMediaStreamDestination();
        const recordingDestinationNode = recordingDestinationNodeRef.current;

        const userMicSource = mixingContext.createMediaStreamSource(stream);
        userMicSource.connect(recordingDestinationNode);

        const combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...recordingDestinationNode.stream.getAudioTracks()
        ]);

        if (videoRef.current) {
          const videoEl = videoRef.current;
          videoEl.srcObject = stream;
          
          const startFaceDetection = async () => {
            try {
              if (!modelsLoaded.current) {
                const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
                modelsLoaded.current = true;
              }
        
              if (faceApiIntervalRef.current) clearInterval(faceApiIntervalRef.current);
              
              faceApiIntervalRef.current = window.setInterval(async () => {
                if (videoEl && !videoEl.paused && isLiveRef.current) {
                  const detections = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
                  if (detections) {
                    emotionHistoryRef.current.push(detections);
                  }
                }
              }, 1500);
            } catch (e) {
              console.error("Failed to initialize face detection:", e);
            }
          };
          videoEl.addEventListener('playing', startFaceDetection);
        }

        mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
        recordedChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.start();
        
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const resumeContext = resumeAnalysis 
          ? `Resume Score: ${resumeAnalysis.score}/100. Strengths: ${resumeAnalysis.strengths}. Areas to assess: ${resumeAnalysis.weaknesses}`
          : 'No resume analysis available';

        const systemInstruction = `You are Alex, an expert AI technical interviewer. You're conducting a screening interview with ${candidateName} for the ${jobDetails.title} position.

Job Description:
${jobDetails.description}

Candidate Background:
${resumeContext}

Your task:
1. Greet ${candidateName} warmly and introduce yourself
2. Mention you've reviewed their resume
3. Ask 3-4 technical questions relevant to the job and their background
4. CRITICAL: Wait for complete answers before responding. Allow 1-2 seconds of silence after they stop speaking
5. Be encouraging and professional
6. End by thanking them and explaining next steps

Keep the interview conversational and natural. Begin now.`;
        
        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.0-flash-exp',
          config: {
            systemInstruction,
            responseModalities: [Modality.AUDIO],
            speechConfig: { 
              voiceConfig: { 
                prebuiltVoiceConfig: { voiceName: 'Kore' } 
              } 
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              console.log('Gemini Live session opened');
              setIsConnecting(false);
              setIsLive(true);
            },
            onmessage: async (message: any) => {
              if (message.serverContent?.inputTranscription) {
                const textChunk = message.serverContent.inputTranscription.text;
                currentInputTranscription += textChunk;
                
                setTranscript(prev => {
                  const lastEntry = prev.length > 0 ? prev[prev.length - 1] : null;
                  if (lastEntry && lastEntry.speaker === Speaker.USER) {
                    return [...prev.slice(0, -1), { ...lastEntry, text: currentInputTranscription }];
                  } else {
                    return [...prev, { speaker: Speaker.USER, text: currentInputTranscription, isFinal: false }];
                  }
                });
              }

              if (message.serverContent?.outputTranscription) {
                const textChunk = message.serverContent.outputTranscription.text;
                currentOutputTranscription += textChunk;

                setTranscript(prev => {
                  const lastEntry = prev.length > 0 ? prev[prev.length - 1] : null;
                  if (lastEntry && lastEntry.speaker === Speaker.AI) {
                    return [...prev.slice(0, -1), { ...lastEntry, text: currentOutputTranscription }];
                  } else {
                    return [...prev, { speaker: Speaker.AI, text: currentOutputTranscription, isFinal: false }];
                  }
                });
              }

              if (message.serverContent?.turnComplete) {
                currentInputTranscription = '';
                currentOutputTranscription = '';
              }

              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioData && mixingContextRef.current && recordingDestinationNodeRef.current) {
                const audioContext = mixingContextRef.current;
                const recordingDest = recordingDestinationNodeRef.current;
                
                // Check if audio context is still valid
                if (audioContext.state === 'suspended') {
                  await audioContext.resume();
                }
                
                try {
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                  
                  const audioBuffer = await decodeAudioData(decode(audioData), audioContext);
                  const source = audioContext.createBufferSource();
                  source.buffer = audioBuffer;
                  
                  source.connect(audioContext.destination);
                  source.connect(recordingDest);

                  source.addEventListener('ended', () => {
                    audioSourcesRef.current.delete(source);
                  });
                  
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  audioSourcesRef.current.add(source);
                  console.log('Playing audio chunk');
                } catch (err) {
                  console.error('Error playing audio:', err);
                }
              }
              
              const interrupted = message.serverContent?.interrupted;
              if (interrupted) {
                for (const source of audioSourcesRef.current.values()) {
                  source.stop();
                  audioSourcesRef.current.delete(source);
                }
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              if (!hasEndedRef.current) {
                endInterview();
              }
            },
            onerror: (e: ErrorEvent) => {
              console.error(e);
              setError('A connection error occurred.');
              endInterview();
            },
          },
        });

        sessionRef.current = await sessionPromise;
        
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const inputAudioContext = inputAudioContextRef.current;
        mediaStreamSourceRef.current = inputAudioContext.createMediaStreamSource(stream);
        scriptProcessorRef.current = inputAudioContext.createScriptProcessor(4096, 1, 1);

        scriptProcessorRef.current.onaudioprocess = (event: AudioProcessingEvent) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          const pcmBlob = {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
          };
          sessionPromise.then((session: LiveSession) => session.sendRealtimeInput({ media: pcmBlob }));
        };
        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
        scriptProcessorRef.current.connect(inputAudioContext.destination);

      } catch (err) {
        console.error('Failed to start interview:', err);
        setError('Failed to start interview. Check permissions and connection.');
        setIsConnecting(false);
        stopStreaming();
      }
    };

    startInterview();

    return () => {
      console.log('Component unmounting, cleaning up...');
      
      // Clear analysis timeout if it exists
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      
      // Only cleanup if interview hasn't already ended
      if (!hasEndedRef.current) {
        console.log('Cleaning up active interview');
        stopFaceApi();
        stopStreaming();
        if (sessionRef.current) {
          sessionRef.current.close();
          sessionRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIndicator = () => {
    if (isConnecting) {
      return (
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
          <span>Connecting...</span>
        </div>
      );
    }
    if (isLive) {
      return (
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span>Live</span>
        </div>
      );
    }
    if (isAnalyzing) {
      return <span>Analyzing Interview...</span>;
    }
    return <span>Interview Ended</span>;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-[9999]">
      <div className="w-full max-w-7xl h-[90vh] flex flex-col lg:flex-row gap-4">
        {/* Transcript Panel */}
        <div className="flex-grow lg:w-2/3 flex flex-col bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-900/50 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">AI Technical Interview</h2>
            <div className="text-sm font-medium text-gray-300">{getStatusIndicator()}</div>
          </div>
          <div ref={transcriptContainerRef} className="flex-grow p-6 space-y-4 overflow-y-auto">
            {transcript.length === 0 && (
              <p className="text-center text-gray-500 py-8">Waiting for interview to start...</p>
            )}
            {transcript.map((entry, index) => (
              <div key={index} className={`flex items-start gap-3 ${entry.speaker === Speaker.USER ? 'justify-end' : ''}`}>
                {entry.speaker === Speaker.AI && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                    🤖
                  </div>
                )}
                <div className={`max-w-xl p-3 rounded-lg ${entry.speaker === Speaker.USER ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-white'}`}>
                  <p className="text-sm">{entry.text}</p>
                </div>
                {entry.speaker === Speaker.USER && (
                  <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
                    👤
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Video and Controls Panel */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-700">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
              {candidateName}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex-grow flex flex-col justify-center items-center">
            {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
            {!isAnalyzing ? (
              <>
                <button
                  onClick={endInterview}
                  disabled={!isLive}
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-400"
                >
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </button>
                <p className="mt-2 text-gray-400">End Interview</p>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
                <p className="text-gray-300">Analyzing interview with AI...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;
