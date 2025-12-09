
import { Question, AssessmentResult, ExamConfig } from "../types";

const KEYS = {
  QUESTIONS: 'proctorai_questions',
  RESULTS: 'proctorai_results',
  CONFIG: 'proctorai_config',
  ADMIN_SESSIONS: 'proctorai_active_admins'
};

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "Implement LRU Cache",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    difficulty: "Medium",
    category: "Data Structures",
    starterCode: "class LRUCache {\n  constructor(capacity) {\n    \n  }\n\n  get(key) {\n    \n  }\n\n  put(key, value) {\n    \n  }\n}"
  }
];

const DEFAULT_CONFIG: ExamConfig = {
  durationMinutes: 60,
  minTimeBeforeSubmitMinutes: 45,
  title: "Senior Frontend Engineer Assessment"
};

// Helper to load/save
const load = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const save = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const store = {
  // --- Auth & Access ---
  loginAdmin: (email: string): boolean => {
    const activeAdmins = load<string[]>(KEYS.ADMIN_SESSIONS, []);
    if (activeAdmins.includes(email)) return true; // Already logged in
    
    if (activeAdmins.length >= 5) return false;
    
    activeAdmins.push(email);
    save(KEYS.ADMIN_SESSIONS, activeAdmins);
    return true;
  },

  logoutAdmin: (email: string) => {
    let activeAdmins = load<string[]>(KEYS.ADMIN_SESSIONS, []);
    activeAdmins = activeAdmins.filter(e => e !== email);
    save(KEYS.ADMIN_SESSIONS, activeAdmins);
  },

  // --- Questions ---
  getQuestions: (): Question[] => load(KEYS.QUESTIONS, DEFAULT_QUESTIONS),
  
  addQuestion: (q: Question) => {
    const qs = load(KEYS.QUESTIONS, DEFAULT_QUESTIONS);
    qs.push(q);
    save(KEYS.QUESTIONS, qs);
  },
  
  setQuestions: (qs: Question[]) => {
    save(KEYS.QUESTIONS, qs);
  },

  deleteQuestion: (id: string) => {
    let qs = load<Question[]>(KEYS.QUESTIONS, DEFAULT_QUESTIONS);
    qs = qs.filter(q => q.id !== id);
    save(KEYS.QUESTIONS, qs);
  },

  // --- Results ---
  submitResult: (result: AssessmentResult) => {
    const rs = load<AssessmentResult[]>(KEYS.RESULTS, []);
    rs.push(result);
    save(KEYS.RESULTS, rs);
  },

  getResults: (): AssessmentResult[] => load(KEYS.RESULTS, []),

  // --- Config ---
  getConfig: (): ExamConfig => load(KEYS.CONFIG, DEFAULT_CONFIG),
  
  setConfig: (config: Partial<ExamConfig>) => {
    const current = load(KEYS.CONFIG, DEFAULT_CONFIG);
    save(KEYS.CONFIG, { ...current, ...config });
  }
};
