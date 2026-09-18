import React, { useState } from 'react';
import {
  Calculator,
  Camera,
  GraduationCap,
  Layers,
  BarChart2,
  Database,
  Smartphone,
  BookOpen,
  User,
  Sun,
  Moon,
  ShieldCheck,
  FileDown,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  Flame,
  Settings,
} from 'lucide-react';
import { AppTab, UserAccount } from '../types';
import { exportSwiftProjectZip, exportAndroidProjectZip } from '../utils/exportFiles';
import { getGamificationProfile } from '../utils/gamification';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenDocs: () => void;
  onOpenParentReport: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenDocs,
  onOpenParentReport,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [isExportingSwift, setIsExportingSwift] = useState(false);
  const [isExportingAndroid, setIsExportingAndroid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const gamification = getGamificationProfile();

  const handleDownloadSwift = async () => {
    setIsExportingSwift(true);
    try {
      await exportSwiftProjectZip();
    } catch (e) {
      console.warn('Swift export error:', e);
    } finally {
      setIsExportingSwift(false);
    }
  };

  const handleDownloadAndroid = async () => {
    setIsExportingAndroid(true);
    try {
      await exportAndroidProjectZip();
    } catch (e) {
      console.warn('Android export error:', e);
    } finally {
      setIsExportingAndroid(false);
    }
  };

  const navTabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'curriculum', label: 'Curriculum OCR', icon: Camera },
    { id: 'exams', label: 'Exam Prep', icon: GraduationCap },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'dashboard', label: 'Analytics', icon: BarChart2 },
    { id: 'sql', label: 'SQLite DB', icon: Database },
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('calculator')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  MathFormula Studio
                </span>
                <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 -mt-0.5 hidden sm:block">
                Proofs • OCR Syllabi • Mini-Exams
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-zinc-100/80 p-1 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/60">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-800 dark:text-blue-400'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side utilities: Mobile Exports, Docs, Theme, Auth */}
        <div className="flex items-center gap-2">
          {/* Mobile Source Code Export dropdown / buttons */}
          <div className="hidden xl:flex items-center gap-1.5">
            <button
              id="btn-nav-export-swift"
              onClick={handleDownloadSwift}
              disabled={isExportingSwift}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Download standalone Swift Xcode iOS Project"
            >
              <Smartphone className="h-3.5 w-3.5 text-orange-500" />
              <span>{isExportingSwift ? 'Zipping...' : 'Swift iOS (.zip)'}</span>
            </button>
            <button
              id="btn-nav-export-android"
              onClick={handleDownloadAndroid}
              disabled={isExportingAndroid}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Download standalone Kotlin Gradle Android Project"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isExportingAndroid ? 'Zipping...' : 'Android APK (.zip)'}</span>
            </button>
          </div>

          {/* Technical Docs trigger */}
          <button
            onClick={onOpenDocs}
            className="hidden sm:flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Open Technical Component Manual"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
            <span>Docs</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleDarkMode}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Settings Quick Access */}
          <button
            id="btn-navbar-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-400'
                : 'border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
            title="Application & Render Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Account / Sign In */}
          <button
            id="btn-navbar-auth"
            onClick={onOpenAuth}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              currentUser
                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm'
            }`}
          >
            {currentUser ? (
              <>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {currentUser.username.substring(0, 1).toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate">{currentUser.username}</span>
                <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Flame className="h-2.5 w-2.5 text-amber-500" />
                  <span>L{gamification.level}</span>
                </span>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2">
            <button
              onClick={() => {
                handleDownloadSwift();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
            >
              <Smartphone className="h-3.5 w-3.5 text-orange-500" />
              <span>Swift iOS (.zip)</span>
            </button>
            <button
              onClick={() => {
                handleDownloadAndroid();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
              <span>Android APK (.zip)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
