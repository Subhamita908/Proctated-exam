
import React, { useState, useEffect, useCallback } from 'react';
import { useProctoring } from './hooks/useProctoring';
import ProctorMonitor from './components/ProctorMonitor';
import ExamView from './components/ExamView';
import AdminDashboard from './components/AdminDashboard';
import { ExamStatus, Question, UserRole } from './types';
import { store } from './services/store';
import { gradeSubmission } from './services/geminiService';

const MAX_WARNINGS = 5;

const App: React.FC = () => {
  // Navigation & Auth State
  const [role, setRole] = useState<UserRole>(null);
  const [status, setStatus] = useState<ExamStatus>(ExamStatus.LOGIN);
  const [email, setEmail] = useState('');
  
  // Exam Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [warnings, setWarnings] = useState(0);
  const [lastViolation, setLastViolation] = useState<string | null>(null);
  const [examConfig, setExamConfig] = useState(store.getConfig());

  // --- Login / Auth Logic ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      alert("Please enter a valid email");
      return;
    }

    // Mock Admin Detection
    if (email.toLowerCase().includes('admin')) {
      const allowed = store.loginAdmin(email);
      if (allowed) {
        setRole('ADMIN');
        setStatus(ExamStatus.IDLE); // Admin is "idle" in dashboard
      } else {
        alert("Admin limit reached (Max 5 concurrent). Access denied.");
      }
    } else {
      setRole('STUDENT');
      setExamConfig(store.getConfig());
      setStatus(ExamStatus.IDLE);
    }
  };

  const handleLogout = () => {
    if (role === 'ADMIN') store.logoutAdmin(email);
    setRole(null);
    setStatus(ExamStatus.LOGIN);
    setEmail('');
    setWarnings(0);
  };

  // --- Proctoring Logic ---
  const handleViolation = useCallback((reason: string) => {
    setLastViolation(reason);
    setWarnings(prev => {
      const newCount = prev + 1;
      if (newCount >= MAX_WARNINGS) {
        setStatus(ExamStatus.TERMINATED);
      }
      return newCount;
    });
    setTimeout(() => setLastViolation(null), 3000);
  }, []);

  const { stream, error: proctorError, startProctoring, stopProctoring } = useProctoring({
    isActive: status === ExamStatus.IN_PROGRESS,
    onViolation: handleViolation
  });

  // --- Student Flow ---

  const handleStartExamSetup = async () => {
    setStatus(ExamStatus.SETUP);
    await startProctoring();
  };

  useEffect(() => {
    if (status === ExamStatus.SETUP && stream && !proctorError) {
      loadExamContent();
    }
  }, [status, stream, proctorError]);

  const loadExamContent = () => {
    setStatus(ExamStatus.LOADING_QUESTIONS);
    const qs = store.getQuestions();
    setQuestions(qs);
    setStatus(ExamStatus.IN_PROGRESS);
    
    try {
      document.documentElement.requestFullscreen().catch(() => {});
    } catch(e){}
  };

  const handleSubmitExam = async (answers: Record<string, string>) => {
    setStatus(ExamStatus.COMPLETED);
    stopProctoring();
    try { document.exitFullscreen().catch(() => {}); } catch(e){}

    // --- Dynamic Grading Logic ---
    let totalScore = 0;
    let comments: string[] = [];

    // Parallel Grading for better performance
    const gradePromises = questions.map(async (q) => {
        const code = answers[q.id] || "";
        if (!code.trim()) {
            return { score: 0, feedback: `Q "${q.title}": No code submitted.` };
        }
        return await gradeSubmission(q, code);
    });

    const results = await Promise.all(gradePromises);
    
    results.forEach(r => {
        totalScore += r.score;
        comments.push(r.feedback);
    });

    const finalScore = questions.length > 0 ? Math.round(totalScore / questions.length) : 0;
    const finalFeedback = comments.join('\n\n') || "No questions answered.";

    // Save result to store (simulated DB)
    store.submitResult({
      studentEmail: email,
      score: finalScore,
      feedback: finalFeedback,
      submittedAt: new Date().toISOString(),
      status: finalScore >= 60 ? 'Pass' : 'Fail'
    });
  };

  // --- RENDER ---

  // 1. Terminated Screen
  if (status === ExamStatus.TERMINATED) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/50 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Exam Terminated</h1>
          <p className="text-slate-400 mb-6">Max warnings ({MAX_WARNINGS}) exceeded. Cheating detected.</p>
          <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-white underline">Return</button>
        </div>
      </div>
    );
  }

  // 2. Completed Screen
  if (status === ExamStatus.COMPLETED) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
         <div className="max-w-md w-full bg-slate-900 border border-green-500/50 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Submitted Successfully</h1>
          <p className="text-slate-400 mb-6">Your code has been analyzed by AI. Results have been sent to the administrator.</p>
          <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg">Sign Out</button>
        </div>
      </div>
    );
  }

  // 3. Admin View
  if (role === 'ADMIN') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // 4. Student Exam View
  if (role === 'STUDENT' && status === ExamStatus.IN_PROGRESS) {
    return (
      <>
        <ExamView questions={questions} config={examConfig} onSubmit={handleSubmitExam} />
        <ProctorMonitor stream={stream} warnings={warnings} maxWarnings={MAX_WARNINGS} lastViolation={lastViolation} />
      </>
    );
  }

  // 5. Landing / Login Screen
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
      </div>

      <main className="relative z-10 max-w-2xl w-full p-8">
        
        {/* Header Branding */}
        <div className="text-center mb-12">
           <div className="inline-flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">System Online</span>
           </div>
           <h1 className="text-5xl font-extrabold tracking-tight mb-4">Proctor<span className="text-primary-500">AI</span></h1>
           <p className="text-lg text-slate-400 max-w-lg mx-auto">
             Advanced Assessment Platform by <span className="text-slate-300 font-semibold">Subhamita Deb</span>
           </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          
          {/* LOGIN STATE */}
          {status === ExamStatus.LOGIN && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Institutional Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  * For Admin access, use an email containing "admin" (Limit: 5 concurrent)
                </p>
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all">
                Access Portal
              </button>
            </form>
          )}

          {/* STUDENT DASHBOARD PRE-EXAM */}
          {status === ExamStatus.IDLE && role === 'STUDENT' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <h3 className="text-xl font-bold text-white">{examConfig.title}</h3>
                <div className="flex justify-center gap-4 mt-2 text-sm text-slate-400">
                  <span>⏱ {examConfig.durationMinutes} Minutes</span>
                  <span>🛡 Strict Proctoring</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                   <strong className="text-slate-200 block mb-1">Camera Required</strong>
                   Face monitoring active.
                 </div>
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                   <strong className="text-slate-200 block mb-1">Submission Lock</strong>
                   Submit enabled after {examConfig.minTimeBeforeSubmitMinutes}m.
                 </div>
              </div>
              <button 
                onClick={handleStartExamSetup}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-primary-500/25"
              >
                Start Assessment
              </button>
              <button onClick={handleLogout} className="w-full text-slate-500 text-sm">Cancel</button>
            </div>
          )}

          {/* LOADING STATES */}
          {(status === ExamStatus.SETUP || status === ExamStatus.LOADING_QUESTIONS) && (
             <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                <h3 className="text-xl font-semibold">
                  {status === ExamStatus.SETUP ? "Checking Permissions..." : "Preparing Exam Environment..."}
                </h3>
             </div>
          )}

          {proctorError && (
            <div className="text-center py-6">
               <div className="text-red-500 text-4xl mb-4">🚫</div>
               <h3 className="text-lg font-bold text-white">System Check Failed</h3>
               <p className="text-red-400 text-sm my-2">{proctorError}</p>
               <button onClick={() => setStatus(ExamStatus.IDLE)} className="mt-4 px-6 py-2 bg-slate-800 rounded-lg text-sm">Retry</button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            Designed & Engineered by Subhamita Deb
          </p>
          <p className="text-[10px] text-slate-700 font-mono mt-1">GitHub: Subhamita908</p>
        </div>
      </main>
    </div>
  );
};

export default App;
