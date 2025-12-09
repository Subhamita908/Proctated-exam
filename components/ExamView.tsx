
import React, { useState, useEffect, useRef } from 'react';
import { Question, ExamConfig } from '../types';

interface ExamViewProps {
  questions: Question[];
  config: ExamConfig;
  onSubmit: (answers: Record<string, string>) => void;
}

const ExamView: React.FC<ExamViewProps> = ({ questions, config, onSubmit }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(config.durationMinutes * 60); // Seconds
  const [canSubmit, setCanSubmit] = useState(false);

  // Refs for auto-submission to access latest state inside interval
  const answersRef = useRef(codeMap);
  const onSubmitRef = useRef(onSubmit);

  const currentQuestion = questions[activeTab];

  // Update refs when state/props change
  useEffect(() => {
    answersRef.current = codeMap;
  }, [codeMap]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  // Initialize Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time is up using the ref to get latest answers
          onSubmitRef.current(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check "Submit Button Enable" logic
  useEffect(() => {
    const totalSeconds = config.durationMinutes * 60;
    const minSecondsRequired = config.minTimeBeforeSubmitMinutes * 60;
    const secondsElapsed = totalSeconds - timeLeft;

    if (secondsElapsed >= minSecondsRequired) {
      setCanSubmit(true);
    }
  }, [timeLeft, config]);

  const handleCodeChange = (val: string) => {
    setCodeMap(prev => ({
      ...prev,
      [currentQuestion.id]: val
    }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentCode = codeMap[currentQuestion.id] || currentQuestion.starterCode || '';

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
             </svg>
           </div>
           <div>
             <h1 className="font-bold text-lg tracking-tight leading-none">Proctor<span className="text-primary-500">AI</span></h1>
             <span className="text-[10px] text-slate-500 font-mono">SECURE BROWSER • {config.title}</span>
           </div>
        </div>

        {/* Timer Widget */}
        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors duration-300 ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
        </div>

        <div className="group relative">
          <button 
            onClick={() => onSubmit(codeMap)}
            disabled={!canSubmit}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              canSubmit 
                ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Submit Exam
          </button>
          {!canSubmit && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-xs text-slate-300 rounded-lg shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              <p>Submission disabled.</p>
              <p className="text-slate-400 mt-1">
                You can submit after {config.minTimeBeforeSubmitMinutes} minutes have elapsed.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question List Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Problem Set</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all group relative ${
                  activeTab === idx 
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{idx + 1}. {q.title}</span>
                  {codeMap[q.id] && codeMap[q.id].length > (q.starterCode?.length || 0) && (
                     <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Problem Description */}
        <div className="w-1/3 bg-slate-900/30 border-r border-slate-800 flex flex-col min-w-[350px] overflow-y-auto custom-scrollbar">
          <div className="p-8">
             <div className="flex items-center gap-2 mb-6">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                   currentQuestion.difficulty === 'Easy' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                   currentQuestion.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                   'border-red-500/30 text-red-400 bg-red-500/10'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700 text-slate-400 bg-slate-800">
                  {currentQuestion.category}
                </span>
             </div>
             <h2 className="text-2xl font-bold text-white mb-6 leading-tight">{currentQuestion.title}</h2>
             <div className="prose prose-invert prose-sm text-slate-300 max-w-none">
               <p className="whitespace-pre-wrap leading-relaxed">{currentQuestion.description}</p>
             </div>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
          <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              solution.js
            </span>
            <span className="text-[10px] text-slate-600 font-mono">Auto-saved</span>
          </div>
          <textarea
            value={currentCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-[#0B1120] text-slate-300 font-mono text-sm p-6 resize-none focus:outline-none leading-relaxed selection:bg-primary-500/30"
            placeholder="// Write your solution here..."
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                target.value = target.value.substring(0, start) + "  " + target.value.substring(end);
                target.selectionStart = target.selectionEnd = start + 2;
                handleCodeChange(target.value);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ExamView;
