
import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { generateQuestions } from '../services/geminiService';
import { Question, AssessmentResult } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'results' | 'settings'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [config, setConfig] = useState(store.getConfig());
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("Algorithms");
  const [genDifficulty, setGenDifficulty] = useState("Medium");
  const [genLanguage, setGenLanguage] = useState("JavaScript");
  
  // Manual Entry State
  const [showManualForm, setShowManualForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
      title: '', description: '', difficulty: 'Medium', category: 'General', starterCode: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setQuestions(store.getQuestions());
    setResults(store.getResults());
    setConfig(store.getConfig());
  };

  const handleGenerate = async () => {
    if (!genTopic) return;
    setIsGenerating(true);
    const newQs = await generateQuestions(genTopic, genDifficulty, genLanguage, 1);
    newQs.forEach(q => store.addQuestion(q));
    refreshData();
    setIsGenerating(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.title || !newQuestion.description) return;
    
    store.addQuestion({
        ...newQuestion,
        id: `manual-${Date.now()}`,
        difficulty: newQuestion.difficulty as any || 'Medium',
        category: newQuestion.category || 'General',
        starterCode: newQuestion.starterCode || ''
    } as Question);
    
    setShowManualForm(false);
    setNewQuestion({ title: '', description: '', difficulty: 'Medium', category: 'General', starterCode: '' });
    refreshData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
        store.deleteQuestion(id);
        refreshData();
    }
  };

  const handleConfigUpdate = (key: string, value: any) => {
    store.setConfig({ [key]: value });
    refreshData();
  };

  const filteredResults = results.filter(r => 
    r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Admin Header */}
      <nav className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-bold text-lg">Admin<span className="text-indigo-400">Panel</span></span>
        </div>
        <div className="flex gap-4">
          <button onClick={onLogout} className="text-slate-400 hover:text-white text-sm">Logout</button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0">
           <div className="space-y-1">
             {[
               { id: 'questions', label: 'Questions', icon: '📝' },
               { id: 'results', label: 'Gradebook', icon: '📊' },
               { id: 'settings', label: 'Settings', icon: '⚙️' }
             ].map(item => (
               <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                  activeTab === item.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'
                }`}
               >
                 <span>{item.icon}</span>
                 <span className="font-medium">{item.label}</span>
               </button>
             ))}
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          
          {/* QUESTIONS TAB */}
          {activeTab === 'questions' && (
            <div>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h2 className="text-2xl font-bold">Question Bank</h2>
                 <button 
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm border border-slate-600"
                 >
                    {showManualForm ? 'Cancel Manual Entry' : '+ Add Manually'}
                 </button>
               </div>

               {/* Creation Area */}
               <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-8">
                  {showManualForm ? (
                      <form onSubmit={handleManualSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-4">
                          <input 
                            placeholder="Question Title" 
                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg"
                            value={newQuestion.title}
                            onChange={e => setNewQuestion({...newQuestion, title: e.target.value})}
                            required
                          />
                          <div className="flex gap-4">
                              <select 
                                className="bg-slate-950 border border-slate-700 p-3 rounded-lg"
                                value={newQuestion.difficulty}
                                onChange={e => setNewQuestion({...newQuestion, difficulty: e.target.value as any})}
                              >
                                  <option>Easy</option>
                                  <option>Medium</option>
                                  <option>Hard</option>
                              </select>
                              <input 
                                placeholder="Category (e.g. Arrays)" 
                                className="flex-1 bg-slate-950 border border-slate-700 p-3 rounded-lg"
                                value={newQuestion.category}
                                onChange={e => setNewQuestion({...newQuestion, category: e.target.value})}
                              />
                          </div>
                          <textarea 
                            placeholder="Problem Description..." 
                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg h-24"
                            value={newQuestion.description}
                            onChange={e => setNewQuestion({...newQuestion, description: e.target.value})}
                            required
                          />
                          <textarea 
                            placeholder="Starter Code..." 
                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg font-mono text-xs h-24"
                            value={newQuestion.starterCode}
                            onChange={e => setNewQuestion({...newQuestion, starterCode: e.target.value})}
                          />
                          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Save Question</button>
                      </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-slate-400">AI Generator:</span>
                        <input 
                            type="text" 
                            value={genTopic} 
                            onChange={(e) => setGenTopic(e.target.value)}
                            placeholder="Topic (e.g. React Hooks)"
                            className="bg-slate-950 border border-slate-700 px-3 py-2 rounded-lg text-sm w-48"
                        />
                        <select 
                            value={genDifficulty}
                            onChange={(e) => setGenDifficulty(e.target.value)}
                            className="bg-slate-950 border border-slate-700 px-3 py-2 rounded-lg text-sm"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                        <select 
                            value={genLanguage}
                            onChange={(e) => setGenLanguage(e.target.value)}
                            className="bg-slate-950 border border-slate-700 px-3 py-2 rounded-lg text-sm"
                        >
                            <option value="JavaScript">JavaScript</option>
                            <option value="TypeScript">TypeScript</option>
                            <option value="Python">Python</option>
                            <option value="Java">Java</option>
                            <option value="C++">C++</option>
                            <option value="Go">Go</option>
                            <option value="Rust">Rust</option>
                        </select>
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div> : '✨'}
                            Generate Question
                        </button>
                    </div>
                  )}
               </div>
               
               <div className="space-y-4">
                 {questions.map((q, i) => (
                   <div key={q.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-start group hover:border-indigo-500/30 transition-colors">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">#{i + 1}</span>
                          <span className={`text-[10px] px-2 rounded-full border ${q.difficulty === 'Easy' ? 'border-green-500/30 text-green-400' : q.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' : 'border-red-500/30 text-red-400'}`}>{q.difficulty}</span>
                          <span className="text-[10px] px-2 rounded-full border border-slate-700 text-slate-400">{q.category}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-200">{q.title}</h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mt-1">{q.description}</p>
                      </div>
                      <button onClick={() => handleDelete(q.id)} className="text-slate-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                 ))}
                 {questions.length === 0 && <p className="text-slate-500 text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">No questions available. Generate or add one!</p>}
               </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && (
             <div>
               <div className="flex justify-between items-end mb-6">
                 <h2 className="text-2xl font-bold">Student Gradebook</h2>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-64 pl-10 p-2.5 outline-none transition-all focus:w-80" 
                        placeholder="Search student email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
               </div>
               
               <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3">Student</th>
                        <th className="px-6 py-3">Score</th>
                        <th className="px-6 py-3">Submission</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredResults.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-800/50">
                          <td className="px-6 py-4">
                              <div className="font-medium text-white">{r.studentEmail}</div>
                              <div className="text-xs text-slate-500">{new Date(r.submittedAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold text-lg ${r.score >= 70 ? 'text-green-400' : r.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {r.score}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <details className="cursor-pointer group">
                                <summary className="text-xs text-indigo-400 group-hover:text-indigo-300">View Feedback</summary>
                                <div className="mt-2 text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {r.feedback}
                                </div>
                            </details>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                              r.status === 'Pass' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredResults.length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No submissions found.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
             </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
             <div className="max-w-xl">
               <h2 className="text-2xl font-bold mb-6">Exam Configuration</h2>
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">Exam Title</label>
                   <input 
                    type="text" 
                    value={config.title}
                    onChange={(e) => handleConfigUpdate('title', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-400 mb-2">Duration (Minutes)</label>
                     <input 
                      type="number" 
                      value={config.durationMinutes}
                      onChange={(e) => handleConfigUpdate('durationMinutes', parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-400 mb-2">Lock Submit (Minutes)</label>
                     <input 
                      type="number" 
                      value={config.minTimeBeforeSubmitMinutes}
                      onChange={(e) => handleConfigUpdate('minTimeBeforeSubmitMinutes', parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2"
                     />
                   </div>
                 </div>
                 
                 <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                   <h4 className="font-bold text-indigo-400 text-sm mb-1">Access Control</h4>
                   <p className="text-xs text-slate-400">Admin access is limited to 5 concurrent sessions. Data is persisted locally.</p>
                 </div>
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;