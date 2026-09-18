import React, { useState, useEffect } from 'react';
import { AppTab, CalculationResult, UserAccount, AppSettings } from './types';
import { Navbar } from './components/Navbar';
import { FormulaCalculator } from './components/FormulaCalculator';
import { CurriculumScanner } from './components/CurriculumScanner';
import { ExamPreparation } from './components/ExamPreparation';
import { FlashcardsView } from './components/FlashcardsView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SqlDatabaseInspector } from './components/SqlDatabaseInspector';
import { HelpSection } from './components/HelpSection';
import { SettingsView } from './components/SettingsView';
import { ChatbotTutor } from './components/ChatbotTutor';
import { AuthModal } from './components/AuthModal';
import { DocsModal } from './components/DocsModal';
import { ParentReportModal } from './components/ParentReportModal';
import { AiAuthGate } from './components/AiAuthGate';
import { getStoredCalculations, saveCalculation, syncCalculationsWithServer } from './utils/storage';
import { getStoredSettings } from './utils/settingsStorage';
import { Bot, HelpCircle } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('mfs_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [calculations, setCalculations] = useState<CalculationResult[]>(getStoredCalculations());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mfs_theme') === 'dark';
  });
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isParentReportOpen, setIsParentReportOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // Selected formula from flashcards to open in calculator
  const [activeCalculatorFormula, setActiveCalculatorFormula] = useState<
    { name: string; expression: string } | undefined
  >(undefined);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const userAccount: UserAccount = {
          id: fbUser.uid,
          username: fbUser.email?.split('@')[0] || 'student',
          email: fbUser.email || undefined,
          fullName: fbUser.displayName || undefined,
          school: 'Westwood Academy',
          grade: 'Grade 11 (AP Calculus)',
          textbook: 'Stewart Calculus 9e',
        };
        setCurrentUser(userAccount);
        localStorage.setItem('mfs_current_user', JSON.stringify(userAccount));
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mfs_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mfs_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync calculations with server on mount & refresh list
  useEffect(() => {
    const loadAndSync = async () => {
      const local = getStoredCalculations();
      setCalculations(local);
      try {
        const synced = await syncCalculationsWithServer();
        setCalculations(synced);
      } catch (e) {
        console.warn('Sync warning:', e);
      }
    };
    loadAndSync();
  }, [currentUser]);

  const handleSaveCalculation = (calc: CalculationResult) => {
    const updated = saveCalculation(calc);
    setCalculations(updated);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('mfs_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mfs_current_user');
  };

  const handleOpenChatWithTopic = (prompt?: string) => {
    setChatInitialPrompt(prompt);
    setIsChatOpen(true);
  };

  const handleOpenCalculatorWithFormula = (name: string, expression: string) => {
    setActiveCalculatorFormula({ name, expression });
    setActiveTab('calculator');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (newSettings.theme === 'dark') {
      setIsDarkMode(true);
    } else if (newSettings.theme === 'light') {
      setIsDarkMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-blue-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-50 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenDocs={() => setIsDocsModalOpen(true)}
        onOpenParentReport={() => setIsParentReportOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Tab View Stage */}
      <main className="flex-1 pb-16">
        {activeTab === 'calculator' && (
          <FormulaCalculator
            userId={currentUser?.id}
            onSaveToHistory={handleSaveCalculation}
            initialFormula={activeCalculatorFormula}
          />
        )}

        {activeTab === 'curriculum' && (
          <>
            {currentUser ? (
              <CurriculumScanner userId={currentUser.id} />
            ) : (
              <AiAuthGate
                toolName="Curriculum OCR Scanner & 10-Q Plan"
                description="Our OCR pipeline uses Gemini Vision to read syllabus photos, create a diagnostic 10-question test, and produce a personalized 4-week study plan synchronized to your profile."
                features={[
                  'Live Camera Snapshot and Syllabus Image Upload',
                  'Gemini Multimodal OCR syllabus extraction',
                  '10-Question Diagnostic Evaluation Test',
                  'Personalized 4-Week Student Course Plan',
                  'Progressive Mastery Scoring (Out of 10)',
                ]}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onGoToCalculator={() => setActiveTab('calculator')}
              />
            )}
          </>
        )}

        {activeTab === 'exams' && (
          <>
            {currentUser ? (
              <ExamPreparation
                userId={currentUser.id}
                onOpenChatWithTopic={handleOpenChatWithTopic}
                onExamCompleted={() => {
                  // reload calculations or exams
                }}
              />
            ) : (
              <AiAuthGate
                toolName="Targeted Exam Prep & Mini-Exams"
                description="Synthesize adaptive assessments targeted to your school curriculum (AP, IB, Cambridge), textbook, grade, and chapter with instant AI grading and misconception analysis."
                features={[
                  'Board targeted: AP College Board, IB, Cambridge, CBSE',
                  'Textbook aligned: Stewart Calculus, Larson, OpenStax',
                  'Instant Step-by-Step AI Grading & Weakness Analysis',
                  'Direct Integration with AI Math Tutor for Remediation',
                  'Permanent Exam Score Records in SQLite Database',
                ]}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onGoToCalculator={() => setActiveTab('calculator')}
              />
            )}
          </>
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView onOpenCalculatorWithFormula={handleOpenCalculatorWithFormula} />
        )}

        {activeTab === 'dashboard' && (
          <ProgressDashboard
            user={currentUser}
            calculations={calculations}
            onOpenParentReport={() => setIsParentReportOpen(true)}
            onOpenCalculation={(calc) => {
              setActiveCalculatorFormula({ name: calc.title, expression: calc.expression });
              setActiveTab('calculator');
            }}
          />
        )}

        {activeTab === 'sql' && <SqlDatabaseInspector />}

        {activeTab === 'help' && (
          <HelpSection
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenChat={(prompt) => handleOpenChatWithTopic(prompt)}
            onOpenDocs={() => setIsDocsModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenParentReport={() => setIsParentReportOpen(true)}
            onOpenDocs={() => setIsDocsModalOpen(true)}
            onClearHistory={() => {
              localStorage.removeItem('mfs_offline_calculations_v1');
              setCalculations([]);
            }}
            historyCount={calculations.length}
          />
        )}
      </main>

      {/* Floating AI Math Helper Trigger Button */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            id="btn-floating-help"
            onClick={() => setActiveTab('help')}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 shadow-lg hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            title="Open Help Center"
          >
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </button>
          <button
            id="btn-floating-tutor"
            onClick={() => handleOpenChatWithTopic()}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
          >
            <Bot className="h-4 w-4" />
            <span>AI Math Tutor</span>
          </button>
        </div>
      )}

      {/* Floating Chatbot Tutor Window */}
      <ChatbotTutor
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialPrompt={chatInitialPrompt}
        userId={currentUser?.id}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Technical Docs Modal */}
      <DocsModal isOpen={isDocsModalOpen} onClose={() => setIsDocsModalOpen(false)} />

      {/* Official Parent Progress Report Modal */}
      <ParentReportModal
        isOpen={isParentReportOpen}
        onClose={() => setIsParentReportOpen(false)}
        user={currentUser}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white/70 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>MathFormula Studio</strong> &bull; Step-by-Step Proofs &bull; OCR Syllabi &bull; Relational SQLite
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <button onClick={() => setActiveTab('help')} className="hover:underline cursor-pointer">
              Help Center &amp; FAQs
            </button>
            <button onClick={() => setIsDocsModalOpen(true)} className="hover:underline cursor-pointer">
              Technical Manual
            </button>
            <button onClick={() => setIsParentReportOpen(true)} className="hover:underline cursor-pointer">
              Parent Dossier
            </button>
            <button onClick={() => setActiveTab('settings')} className="hover:underline cursor-pointer">
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
