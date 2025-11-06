import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptEntry, Speaker, CallAnalysis, ResumeAnalysis, Job } from '../types';
import { startLiveCallSession, getPostCallAnalysis } from '../services/callService';
import { saveCallSession } from '../services/supabaseService';

// Type definition for LiveSession (from @google/genai)
type LiveSession = {
  close: () => void;
  sendRealtimeInput: (input: any) => void;
};

enum CallState {
  IDLE,
  CONNECTING,
  ACTIVE,
  ANALYZING,
  ENDED,
  ERROR,
}

// Audio utility functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface CallSchedulerProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string | null | undefined;
  candidatePhone: string | null | undefined;
  jobDetails: Job;
  resumeAnalysis: ResumeAnalysis | null | undefined;
  onComplete: () => void;
  onCancel: () => void;
}

const CallScheduler: React.FC<CallSchedulerProps> = ({
  candidateId,
  candidateName,
  candidateEmail: _candidateEmail, // Reserved for future use
  candidatePhone: _candidatePhone, // Reserved for future use
  jobDetails,
  resumeAnalysis,
  onComplete,
  onCancel
}) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const userSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recorderDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const updateTranscript = useCallback((newEntry: TranscriptEntry) => {
    setTranscript(prev => {
      if (!newEntry.text?.trim()) {
        return prev;
      }

      const lastEntry = prev.length > 0 ? prev[prev.length - 1] : null;

      if (lastEntry && lastEntry.speaker === newEntry.speaker && !lastEntry.isFinal) {
        const newText = newEntry.isFinal ? newEntry.text : lastEntry.text + newEntry.text;
        const updatedEntry = { 
          ...lastEntry, 
          text: newText, 
          isFinal: newEntry.isFinal 
        };
        return [...prev.slice(0, -1), updatedEntry];
      } else {
        return [...prev, newEntry];
      }
    });
  }, []);

  const handleAudioPlayback = useCallback(async (base64Audio: string) => {
    if (!outputAudioContextRef.current) return;
    const audioBuffer = await decodeAudioData(
      decode(base64Audio), 
      outputAudioContextRef.current, 
      24000, 
      1
    );
    
    nextStartTimeRef.current = Math.max(
      nextStartTimeRef.current, 
      outputAudioContextRef.current.currentTime
    );
    
    const source = outputAudioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContextRef.current.destination);

    if (recorderDestinationRef.current) {
      source.connect(recorderDestinationRef.current);
    }

    source.addEventListener('ended', () => {
      audioSourcesRef.current.delete(source);
    });
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
    audioSourcesRef.current.add(source);
  }, []);

  const startCall = async () => {
    setCallState(CallState.CONNECTING);
    setErrorMessage('');
    setTranscript([]);
    setAnalysis(null);
    setCallStartTime(new Date());
    
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 16000 
      });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 24000 
      });
      const outputContext = outputAudioContextRef.current;
      
      // Setup Recording
      recorderDestinationRef.current = outputContext.createMediaStreamDestination();
      const userSource = outputContext.createMediaStreamSource(stream);
      userSourceNodeRef.current = userSource;
      userSource.connect(recorderDestinationRef.current);

      mediaRecorderRef.current = new MediaRecorder(recorderDestinationRef.current.stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();

      const sessionPromise = startLiveCallSession(
        candidateName,
        jobDetails.title,
        jobDetails.department,
        resumeAnalysis,
        updateTranscript,
        handleAudioPlayback,
        (err: string) => {
          setErrorMessage(err);
          setCallState(CallState.ERROR);
        }
      );
      
      sessionPromise.then((session: LiveSession) => {
        sessionRef.current = session;
        setCallState(CallState.ACTIVE);
      }).catch((e: any) => {
        console.error("Failed to start session", e);
        setErrorMessage("Could not connect to the AI. Please check your API key and permissions.");
        setCallState(CallState.ERROR);
      });
      
      const source = inputAudioContextRef.current.createMediaStreamSource(stream);
      mediaStreamSourceRef.current = source;
      const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          int16[i] = inputData[i] * 32768;
        }
        const pcmBlob = {
          data: encode(new Uint8Array(int16.buffer)),
          mimeType: 'audio/pcm;rate=16000',
        };
        sessionPromise.then((session: LiveSession) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContextRef.current.destination);
      
    } catch (error) {
      console.error('Error starting call:', error);
      setErrorMessage('Microphone access denied. Please allow microphone permissions.');
      setCallState(CallState.ERROR);
    }
  };
  
  const stopCall = useCallback(async () => {
    mediaRecorderRef.current?.stop();
    setCallState(CallState.ANALYZING);

    const callEndTime = new Date();
    const durationSeconds = callStartTime 
      ? Math.floor((callEndTime.getTime() - callStartTime.getTime()) / 1000)
      : 0;

    sessionRef.current?.close();
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    userSourceNodeRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    sessionRef.current = null;
    mediaStreamRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    userSourceNodeRef.current = null;
    nextStartTimeRef.current = 0;
    audioSourcesRef.current.clear();
    mediaRecorderRef.current = null;
    recorderDestinationRef.current = null;
    
    const finalTranscript = transcript.map(t => ({...t, isFinal: true}));
    const analysisResult = await getPostCallAnalysis(finalTranscript);
    setAnalysis(analysisResult);

    // Save to database
    if (analysisResult) {
      // Convert audio URL back to blob for upload
      let audioBlob: Blob | undefined;
      if (recordedAudioUrl) {
        try {
          const response = await fetch(recordedAudioUrl);
          audioBlob = await response.blob();
        } catch (err) {
          console.error('Error converting audio URL to blob:', err);
        }
      }

      await saveCallSession(candidateId, {
        call_audio_blob: audioBlob,
        call_duration_seconds: durationSeconds,
        confirmed_slot: analysisResult.confirmedSlot,
        call_summary: analysisResult.summary,
        personality_analysis: analysisResult.personalityAnalysis,
        transcript: finalTranscript,
        call_started_at: callStartTime?.toISOString() || new Date().toISOString(),
        call_ended_at: callEndTime.toISOString(),
      });
    }

    setCallState(CallState.ENDED);
  }, [transcript, candidateId, callStartTime]);

  const handleComplete = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-cyan-400">AI Call Scheduler</h2>
              <p className="text-sm text-gray-400">Calling {candidateName} for {jobDetails.title}</p>
            </div>
            {callState === CallState.IDLE && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-6 overflow-y-auto">
          {callState === CallState.IDLE && (
            <IdleScreen 
              candidateName={candidateName}
              jobTitle={jobDetails.title}
              resumeScore={resumeAnalysis?.score || 0}
              onStart={startCall}
            />
          )}
          
          {callState === CallState.ERROR && (
            <ErrorScreen message={errorMessage} onRetry={startCall} onCancel={onCancel} />
          )}
          
          {callState === CallState.CONNECTING && (
            <StatusScreen message="Connecting call..." />
          )}
          
          {callState === CallState.ACTIVE && (
            <ActiveCallScreen transcript={transcript} onStop={stopCall} />
          )}
          
          {callState === CallState.ANALYZING && (
            <StatusScreen message="Analyzing call..." />
          )}
          
          {callState === CallState.ENDED && (
            <ResultsScreen 
              analysis={analysis}
              transcript={transcript}
              recordedAudioUrl={recordedAudioUrl}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const IdleScreen: React.FC<{ 
  candidateName: string; 
  jobTitle: string; 
  resumeScore: number; 
  onStart: () => void 
}> = ({ candidateName, jobTitle, resumeScore, onStart }) => (
  <div className="flex flex-col items-center justify-center text-center py-8">
    <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
      <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    </div>
    
    <h3 className="text-2xl font-bold mb-2">Ready to Schedule Interview</h3>
    <p className="text-gray-400 mb-6 max-w-md">
      The AI will make a voice call to {candidateName} to schedule their technical interview for the <span className="text-cyan-400">{jobTitle}</span> position.
    </p>
    
    <div className="bg-gray-700/50 rounded-lg p-4 mb-6 max-w-md w-full">
      <h4 className="font-semibold mb-2">Candidate Context</h4>
      <div className="text-sm text-gray-300 space-y-1">
        <p>• Resume Score: <span className="text-cyan-400 font-bold">{resumeScore}/100</span></p>
        <p>• Position: {jobTitle}</p>
        <p>• The AI will offer 3 interview time slots</p>
      </div>
    </div>
    
    <button
      onClick={onStart}
      className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg"
    >
      Start Call
    </button>
  </div>
);

const ErrorScreen: React.FC<{ message: string; onRetry: () => void; onCancel: () => void }> = ({ 
  message, 
  onRetry, 
  onCancel 
}) => (
  <div className="flex flex-col items-center justify-center text-center py-8">
    <div className="text-6xl mb-4">⚠️</div>
    <h3 className="text-xl font-semibold text-red-500 mb-4">Call Failed</h3>
    <p className="text-gray-300 mb-8 max-w-sm">{message}</p>
    <div className="flex gap-4">
      <button
        onClick={onRetry}
        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg"
      >
        Try Again
      </button>
      <button
        onClick={onCancel}
        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
      >
        Cancel
      </button>
    </div>
  </div>
);

const StatusScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mb-6"></div>
    <p className="text-lg text-gray-300">{message}</p>
  </div>
);

const ActiveCallScreen: React.FC<{ transcript: TranscriptEntry[]; onStop: () => void }> = ({ 
  transcript, 
  onStop 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={scrollRef}
        className="flex-grow bg-gray-900/50 rounded-lg p-4 overflow-y-auto mb-4 space-y-4 min-h-[400px] max-h-[500px]"
      >
        {transcript.length === 0 && (
          <p className="text-center text-gray-500 py-8">Waiting for conversation to start...</p>
        )}
        {transcript.map((entry, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              entry.speaker === Speaker.AI ? 'justify-start' : 'justify-end'
            }`}
          >
            {entry.speaker === Speaker.AI && (
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                🤖
              </div>
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-xl ${
                entry.speaker === Speaker.AI
                  ? 'bg-gray-700 text-white rounded-tl-none'
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}
            >
              <p className={`${!entry.isFinal ? 'opacity-70 italic' : ''}`}>
                {entry.text}
              </p>
            </div>
            {entry.speaker === Speaker.USER && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                👤
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={onStop}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          End Call
        </button>
      </div>
    </div>
  );
};

const ResultsScreen: React.FC<{
  analysis: CallAnalysis | null;
  transcript: TranscriptEntry[];
  recordedAudioUrl: string | null;
  onComplete: () => void;
}> = ({ analysis, transcript, recordedAudioUrl, onComplete }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-center text-cyan-400">Call Complete ✓</h3>
    
    {analysis && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-700/50 p-4 rounded-lg col-span-2">
          <h4 className="font-semibold text-lg mb-2">📅 Confirmed Slot</h4>
          <p className="text-cyan-300 text-2xl font-mono">{analysis.confirmedSlot}</p>
        </div>
        
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">📝 Summary</h4>
          <p className="text-gray-300 text-sm">{analysis.summary}</p>
        </div>
        
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">🎭 Personality</h4>
          <p className="text-gray-300 text-sm">{analysis.personalityAnalysis}</p>
        </div>
      </div>
    )}
    
    {recordedAudioUrl && (
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">🎙️ Call Recording</h4>
        <audio controls className="w-full">
          <source src={recordedAudioUrl} type="audio/webm" />
        </audio>
      </div>
    )}
    
    <div className="bg-gray-900/50 p-4 rounded-lg max-h-48 overflow-y-auto">
      <h4 className="font-semibold mb-3">📄 Transcript</h4>
      <div className="space-y-2 text-sm">
        {transcript.filter(t => t.isFinal).map((entry, index) => (
          <p key={index} className="text-gray-400">
            <span className={`font-bold ${
              entry.speaker === Speaker.AI ? 'text-cyan-400' : 'text-blue-400'
            }`}>
              {entry.speaker}:
            </span>{' '}
            {entry.text}
          </p>
        ))}
      </div>
    </div>
    
    <div className="flex justify-center">
      <button
        onClick={onComplete}
        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full"
      >
        Complete & Save
      </button>
    </div>
  </div>
);

export default CallScheduler;
