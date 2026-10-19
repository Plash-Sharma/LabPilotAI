import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LabPilotLogo } from '../components/LabPilotLogo';
import {
  FileText,
  Sparkles,
  Cpu,
  Layers,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Code2,
  Download,
  Sun,
  Moon,
  Menu,
  X,
  Play,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigateToDashboard?: () => void;
}

export default function LandingPage({ onOpenAuth, onNavigateToDashboard }: LandingPageProps) {
  const { token } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'pdf' | 'viva' | 'mcq' | 'binder'>('pdf');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive MCQ demo state
  const [mcqAnswerSelected, setMcqAnswerSelected] = useState<number | null>(null);

  const workflowSteps = [
    {
      num: '01',
      title: 'Input Problem & Code',
      badge: 'Lexical Input',
      desc: 'Enter experiment aim, algorithm description, and raw source code. Pygments dynamically detects C++, Python, Java, or JavaScript.',
      detail: 'Supports multi-problem JSON arrays or single experiments with custom batch names and dates.',
      icon: Code2,
      accent: 'from-blue-500 to-cyan-500',
    },
    {
      num: '02',
      title: 'Automated PDF Compilation',
      badge: 'Jinja2 & WeasyPrint',
      desc: 'Institutional CSS Paged Media generates standard academic PDF records with college crests, syntax-highlighted code, and execution tables.',
      detail: 'Conforms to university lab formats (e.g., NIT Jalandhar default or minimal layout).',
      icon: FileText,
      accent: 'from-blue-600 to-indigo-600',
    },
    {
      num: '03',
      title: 'Vectorized RAG Indexing',
      badge: 'pgvector & Gemini',
      desc: 'Text is partitioned into 1,000-character semantic chunks, converted into 768-dimensional embeddings, and indexed in PostgreSQL.',
      detail: 'Enables instant semantic cosine retrieval over your unique lab submission code.',
      icon: Cpu,
      accent: 'from-indigo-500 to-purple-600',
    },
    {
      num: '04',
      title: 'AI Viva Voce Simulation',
      badge: 'Conversational Exam',
      desc: 'Gemini AI acts as a demanding lab examiner, testing algorithm edge cases, space-time complexity, and memory management.',
      detail: 'Features rule-based fallback heuristics to ensure continuous oral exam prep anytime.',
      icon: Sparkles,
      accent: 'from-purple-500 to-pink-500',
    },
    {
      num: '05',
      title: 'Adaptive MCQ Diagnostics',
      badge: 'Skill Assessment',
      desc: 'Generates 10-15 non-repeating questions balanced across 3 difficulty tiers (Easy/Medium/Hard) with instant scoring and mastery analytics.',
      detail: 'Classifies performance from Beginner to Mastery with actionable conceptual recommendations.',
      icon: GraduationCap,
      accent: 'from-pink-500 to-rose-500',
    },
  ];

  const faqs = [
    {
      q: 'How does LabPilotAI format laboratory reports?',
      a: 'LabPilotAI uses Jinja2 templating, Pygments lexical analysis, and WeasyPrint CSS3 Paged Media. You provide the problem statement, algorithm, code, and output, and the engine automatically formats it with college headers, running footers, proper page breaks, and tokenized syntax highlighting.',
    },
    {
      q: 'What is the Viva Voce preparation tutor and how does it work?',
      a: 'Whenever you generate a lab submission, LabPilotAI extracts its semantic content and creates 768-dimensional vector embeddings with Google Gemini. In PostgreSQL (pgvector), it performs cosine similarity search to retrieve relevant code passages and conduct an interactive oral viva simulation, asking you the exact questions a lab professor would ask.',
    },
    {
      q: 'Which programming languages are supported?',
      a: 'LabPilotAI supports all popular engineering programming languages including C, C++, Java, Python, and JavaScript. Lexical highlighting is applied automatically via Pygments.',
    },
    {
      q: 'Can I customize the reports for my specific college or university?',
      a: 'Yes! You can choose built-in academic templates (such as NIT Jalandhar or Minimalist Academic) and upload your college crest logo, roll number, teacher name, and subject code, which are embedded across every generated page.',
    },
    {
      q: 'How does the Semester Portfolio Binder work?',
      a: 'Throughout the semester, all your submissions are organized in your dashboard. With one click, LabPilotAI uses PyPDF2 to concatenate all your individual experiment PDFs into a single, cohesive semester record binder ready for final lab evaluation.',
    },
    {
      q: 'Is my student data and code secure?',
      a: 'All accounts are protected with BCrypt password hashing, JWT authentication, sliding-window rate limiting, and private Cloudflare R2 / S3 storage. Code execution occurs strictly within isolated environments.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-blue-500 selection:text-white transition-colors duration-150 overflow-x-hidden">
      {/* =========================================================================
          1. STICKY GLASSMORPHIC NAVBAR
      ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LabPilotLogo size="md" />
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                LabPilotAI
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                v1.0
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#workflow" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Workflow
            </a>
            <a href="#demo" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Interactive Demo
            </a>
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Tech Stack
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons & Theme Toggle */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
              aria-label="Toggle dark/light mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>

            {token ? (
              <button
                onClick={onNavigateToDashboard || (() => { window.location.href = '/dashboard'; })}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-2 pb-6 space-y-3">
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Workflow
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Interactive Demo
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Features
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Tech Stack
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              FAQ
            </a>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col space-y-2">
              {token ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateToDashboard) onNavigateToDashboard();
                    else window.location.href = '/dashboard';
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 text-center"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('register');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 text-center shadow-md shadow-blue-500/25"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
      ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Glowing Background Radial Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-cyan-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-sm mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Built for Computer Science & Engineering Labs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="hidden sm:inline">Google Gemini & pgvector</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.12]">
            Automate Lab Records.{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Master Viva Voce with AI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate hours of manual code formatting and guessing oral exam questions. LabPilotAI auto-compiles standardized academic PDFs with Pygments syntax highlighting and generates 768-dimensional RAG vector simulations for personalized exam preparation.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            {token ? (
              <button
                onClick={onNavigateToDashboard || (() => { window.location.href = '/dashboard'; })}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
              >
                <span>Launch Your Lab Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
                >
                  <span>Start Creating Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="#workflow"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl text-base font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 transition-all"
                >
                  <Play className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-current" />
                  <span>See How It Works</span>
                </a>
              </>
            )}
          </div>

          {/* Micro trust cues */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Institutional Template Ready</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Multi-Language Syntax Highlighting</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Zero Credit Card Required</span>
            </span>
          </div>

          {/* 4-Stat Metric Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">100%</div>
              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">Academic Standard</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Compliant cover pages & styling</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">&lt; 3s</div>
              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">Instant Compilation</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Automated WeasyPrint engine</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">768-dim</div>
              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">pgvector Embeddings</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Semantic code chunk retrieval</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">3-Tier</div>
              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">Adaptive Quizzing</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Easy, Medium, Hard mastery</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. INTERACTIVE 5-STEP WORKFLOW WALKTHROUGH
      ========================================================================= */}
      <section id="workflow" className="py-20 bg-gray-50/60 dark:bg-gray-900/40 border-y border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span>Step-by-Step Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              The Complete Engineering Lab Workflow
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              See how LabPilotAI transitions seamlessly from your code editor directly to submission-ready academic documentation and viva prep.
            </p>
          </div>

          {/* Stepper Selection Pills */}
          <div className="flex overflow-x-auto pb-4 sm:pb-0 gap-2 sm:gap-3 justify-start sm:justify-center no-scrollbar mb-8">
            {workflowSteps.map((step, idx) => (
              <button
                key={step.num}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeWorkflowStep === idx
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/50'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span className="opacity-75">{step.num}.</span>
                <span>{step.title}</span>
              </button>
            ))}
          </div>

          {/* Interactive Step Card Showcase */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden transition-all">
            <div className="p-6 sm:p-8 md:p-10">
              {(() => {
                const step = workflowSteps[activeWorkflowStep];
                const StepIcon = step.icon;
                return (
                  <div className="grid md:grid-cols-12 gap-8 items-center">
                    {/* Left: Description */}
                    <div className="md:col-span-6 space-y-4">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
                        <StepIcon className="w-4 h-4" />
                        <span>{step.badge}</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {step.num}. {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                        {step.desc}
                      </p>
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-gray-200">Engineering Note: </span>
                        {step.detail}
                      </div>
                      <div className="pt-2 flex items-center space-x-3">
                        {activeWorkflowStep > 0 && (
                          <button
                            onClick={() => setActiveWorkflowStep(activeWorkflowStep - 1)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            ← Previous Step
                          </button>
                        )}
                        {activeWorkflowStep < workflowSteps.length - 1 && (
                          <button
                            onClick={() => setActiveWorkflowStep(activeWorkflowStep + 1)}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                          >
                            Next: {workflowSteps[activeWorkflowStep + 1].title} →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Live Mockup / Code Preview */}
                    <div className="md:col-span-6 bg-gray-900 rounded-2xl p-5 border border-gray-800 text-gray-100 shadow-inner font-mono text-xs overflow-hidden">
                      {activeWorkflowStep === 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-[11px] text-gray-400">
                            <span>experiment_03.cpp</span>
                            <span className="text-emerald-400">● C++ Lexer Active</span>
                          </div>
                          <pre className="text-emerald-300 overflow-x-auto leading-relaxed">
{`// QuickSort Algorithm Implementation
#include <iostream>
#include <vector>
using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}`}
                          </pre>
                          <div className="pt-2 text-[11px] text-gray-400 border-t border-gray-800">
                            ✓ Aim, Algorithm, & Terminal execution output captured
                          </div>
                        </div>
                      )}

                      {activeWorkflowStep === 1 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-[11px] text-gray-400">
                            <span>NITJ_Standard_Template.pdf</span>
                            <span className="text-blue-400">● WeasyPrint Ready</span>
                          </div>
                          <div className="p-3 bg-white text-gray-900 rounded-lg shadow space-y-2 text-[10px]">
                            <div className="text-center border-b pb-1">
                              <div className="font-bold text-xs text-blue-700">Dr. B. R. AMBEDKAR NATIONAL INSTITUTE OF TECHNOLOGY</div>
                              <div className="text-[9px] text-gray-500">Department of Computer Science & Engineering</div>
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-600">
                              <span>Student: Plash Sharma</span>
                              <span>Roll No: 23103042</span>
                            </div>
                            <div className="bg-gray-100 p-1.5 rounded font-mono text-[9px]">
                              Aim: Implement QuickSort and analyze average time complexity.
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            ✓ Formatted with institutional header, tokenized code, and table outputs.
                          </div>
                        </div>
                      )}

                      {activeWorkflowStep === 2 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-[11px] text-gray-400">
                            <span>pgvector_index</span>
                            <span className="text-purple-400">● 768-dim Vectors</span>
                          </div>
                          <div className="space-y-1.5 text-[11px] text-gray-300">
                            <div className="text-gray-400">Chunk ID: sub_9f81a7b</div>
                            <div className="p-2 bg-gray-800/80 rounded font-mono text-[10px] text-purple-300">
                              [0.0241, -0.0892, 0.1542, -0.0123, 0.0984, ... 768 dimensions]
                            </div>
                            <div className="text-emerald-400 text-[11px]">
                              Cosine Similarity Threshold: 0.82
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-400 border-t border-gray-800 pt-2">
                            ✓ Document indexed in PostgreSQL for immediate contextual grounding.
                          </div>
                        </div>
                      )}

                      {activeWorkflowStep === 3 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-[11px] text-gray-400">
                            <span>Viva AI Examiner</span>
                            <span className="text-pink-400">● Gemini Conversational</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-lg bg-blue-950/70 border border-blue-900 text-[11px] text-blue-200">
                              <span className="font-bold text-blue-400">Examiner AI: </span>
                              "In your partition function, what happens if the input array is already sorted? What is the recurrence relation?"
                            </div>
                            <div className="p-2.5 rounded-lg bg-gray-800/90 text-[11px] text-gray-200">
                              <span className="font-bold text-emerald-400">You: </span>
                              "It degrades to O(N^2) because the partition is maximally unbalanced. We can fix it by using randomized pivot selection."
                            </div>
                          </div>
                          <div className="text-[11px] text-emerald-400">
                            ✓ Feedback: Excellent answer! Graded: Mastery (10/10).
                          </div>
                        </div>
                      )}

                      {activeWorkflowStep === 4 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-[11px] text-gray-400">
                            <span>Adaptive MCQ Quiz</span>
                            <span className="text-amber-400">● 10 Questions</span>
                          </div>
                          <div className="p-2.5 bg-gray-800/90 rounded-lg space-y-1.5 text-[11px]">
                            <div className="text-amber-300 font-semibold">Tier: Hard • Recurrence Relations</div>
                            <div className="text-gray-200">What is the space complexity of in-place QuickSort on the call stack?</div>
                            <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                              <div className="p-1 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded">✓ O(log N) average</div>
                              <div className="p-1 bg-gray-700/60 rounded text-gray-400">O(1)</div>
                              <div className="p-1 bg-gray-700/60 rounded text-gray-400">O(N) always</div>
                              <div className="p-1 bg-gray-700/60 rounded text-gray-400">O(N log N)</div>
                            </div>
                          </div>
                          <div className="text-[11px] text-emerald-400">
                            ✓ Instant analytical diagnosis and concept mastery scoring.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. INTERACTIVE PRODUCT DEMO TABS
      ========================================================================= */}
      <section id="demo" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Interactive Product Showcase
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              Click through the tabs below to explore each core subsystem in action.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'pdf'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Academic PDF Report
              </button>
              <button
                onClick={() => setActiveTab('viva')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'viva'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                AI Viva Voce Prep
              </button>
              <button
                onClick={() => setActiveTab('mcq')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'mcq'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Adaptive MCQ Quiz
              </button>
              <button
                onClick={() => setActiveTab('binder')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'binder'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Semester PDF Binder
              </button>
            </div>
          </div>

          {/* Tab 1: Academic PDF Report */}
          {activeTab === 'pdf' && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    PDF
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">NIT Jalandhar Academic Laboratory Report</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Data Structures & Algorithms Laboratory • CS-203</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Ready to Download
                </span>
              </div>

              {/* Document Mock */}
              <div className="space-y-4 font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-950 p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="text-center border-b border-gray-300 dark:border-gray-800 pb-3">
                  <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    DR. B. R. AMBEDKAR NATIONAL INSTITUTE OF TECHNOLOGY JALANDHAR
                  </div>
                  <div className="text-xs text-gray-500">Department of Computer Science & Engineering</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-gray-200 dark:border-gray-800">
                  <div><strong>Student Name:</strong> Plash Sharma</div>
                  <div><strong>Roll Number:</strong> 23103042</div>
                  <div><strong>Subject:</strong> DSA Lab (CSX-204)</div>
                  <div><strong>Date:</strong> 19 Oct 2026</div>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-xs uppercase text-blue-600 dark:text-blue-400 font-sans">
                    1. Aim of the Experiment:
                  </div>
                  <p className="font-sans text-xs text-gray-600 dark:text-gray-300">
                    To implement Binary Search Tree (BST) operations: Insertion, Deletion, and In-Order Traversal.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-xs uppercase text-blue-600 dark:text-blue-400 font-sans">
                    2. Source Code (C++):
                  </div>
                  <div className="bg-gray-900 text-gray-200 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
{`struct Node {
    int key;
    Node *left, *right;
    Node(int item) : key(item), left(nullptr), right(nullptr) {}
};`}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-xs uppercase text-blue-600 dark:text-blue-400 font-sans">
                    3. Terminal Output:
                  </div>
                  <div className="bg-black text-emerald-400 p-2.5 rounded-xl font-mono text-[11px]">
                    BST In-Order Traversal: 12 25 30 45 60 78 99
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI Viva Voce Prep */}
          {activeTab === 'viva' && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">Conversational Viva Voce Oral Examiner</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Grounded via pgvector on your Binary Search Tree submission</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  Live RAG Active
                </span>
              </div>

              <div className="space-y-4">
                {/* Examiner Question */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    AI
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-sm text-gray-800 dark:text-gray-200 max-w-xl">
                    <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Examiner Question:</p>
                    "Looking at your deletion logic, when deleting a node with two children, you replaced it with its in-order successor. Could you have used the in-order predecessor instead, and does that alter the tree height properties?"
                  </div>
                </div>

                {/* Student Answer */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="p-4 rounded-2xl rounded-tr-none bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 max-w-xl">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Your Answer:</p>
                    "Yes, both the in-order predecessor (maximum in left subtree) and in-order successor (minimum in right subtree) maintain BST ordering properties. Swapping between them dynamically actually prevents the tree from becoming left-heavy or right-heavy over repeated deletions."
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    You
                  </div>
                </div>

                {/* AI Evaluation */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Evaluation Score: 10 / 10 (Mastery)</span>
                  </div>
                  <p>Spot-on conceptual understanding of BST structural invariants and balancing dynamics.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Adaptive MCQ Quiz */}
          {activeTab === 'mcq' && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                    MCQ
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">Adaptive Diagnostic Assessment</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Question 4 of 10 • Tier: Hard</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  Real-time Grading
                </span>
              </div>

              <div className="space-y-4">
                <p className="font-medium text-gray-900 dark:text-white text-base">
                  What is the worst-case time complexity of searching an element in a Binary Search Tree with N nodes?
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { text: 'A) O(1) constant time', isCorrect: false },
                    { text: 'B) O(log N) logarithmic', isCorrect: false },
                    { text: 'C) O(N) when tree is skewed', isCorrect: true },
                    { text: 'D) O(N log N) linearithmic', isCorrect: false },
                  ].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setMcqAnswerSelected(i)}
                      className={`p-3.5 rounded-xl text-left text-sm font-medium border transition-all ${
                        mcqAnswerSelected === i
                          ? opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                {mcqAnswerSelected !== null && (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <div className="font-semibold">Explanation:</div>
                    <p>
                      In a degenerate (skewed) binary search tree, every node has only one child, behaving identically to a linked list where search traversal takes O(N). Balanced BSTs (AVL / Red-Black) guarantee O(log N).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Semester PDF Binder */}
          {activeTab === 'binder' && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">End-of-Semester PDF Binder Compilation</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Merges 12 semester experiments with a single click</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  PyPDF2 Batch Merge
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'Exp 01', name: 'Array Operations & Dynamic Memory Allocation', status: 'Included' },
                  { id: 'Exp 02', name: 'Stack Implementation via Linked List (LIFO)', status: 'Included' },
                  { id: 'Exp 03', name: 'Circular Queue and Priority Queue Algorithms', status: 'Included' },
                  { id: 'Exp 04', name: 'Binary Search Tree Traversals & Deletions', status: 'Included' },
                  { id: 'Exp 05', name: 'Graph Breadth-First & Depth-First Search', status: 'Included' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{item.id}:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{item.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          5. BENTO-BOX FEATURE GRID
      ========================================================================= */}
      <section id="features" className="py-20 bg-gray-50/60 dark:bg-gray-900/40 border-y border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Engineered for Academic Rigor & Performance
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              Every component is tailored to solve the exact challenges students face in computer science laboratory coursework.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Multi-Language Tokenization</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Pygments identifies C, C++, Java, Python, and JavaScript, generating clean lexical spans with custom CSS styling and zero syntax loss.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Institutional PDF Standards</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                WeasyPrint CSS Paged Media formats running headers, footers, institutional crests, and student roll numbers formatted for grading.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">pgvector Semantic RAG</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                768-dimensional vector chunks empower Google Gemini to probe your exact logic without hallucination or generic textbook responses.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Adaptive Diagnostic Quizzes</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Dynamic 10-question tests spanning Easy, Medium, and Hard tiers diagnose your strengths and pinpoint algorithms requiring review.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">One-Click Semester Binder</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Assembles all experiments into a single paginated master PDF file for end-of-semester faculty inspection and archival.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hardened Platform Security</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                BCrypt password hashing, OAuth2 JWT bearer tokens, sliding-window rate limiting, and zero-egress Cloudflare R2 cloud storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. ARCHITECTURE & TECH STACK TRANSPARENCY
      ========================================================================= */}
      <section id="architecture" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Production Technology Stack
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Engineered with modern, type-safe, asynchronous cloud technologies for speed and reliability.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">React 18 + TS</div>
              <div className="text-xs text-gray-500 mt-1">Vite & Tailwind CSS 4</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">FastAPI 0.110</div>
              <div className="text-xs text-gray-500 mt-1">Python 3.12 & AsyncIO</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="font-bold text-purple-600 dark:text-purple-400 text-sm">PostgreSQL 16</div>
              <div className="text-xs text-gray-500 mt-1">pgvector 768-dim Vectors</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">Google Gemini</div>
              <div className="text-xs text-gray-500 mt-1">Flash 2.5 & Embeddings</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ========================================================================= */}
      <section id="faq" className="py-20 bg-gray-50/60 dark:bg-gray-900/40 border-t border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Everything you need to know about using LabPilotAI for your coursework.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between space-x-4 focus:outline-none"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. HIGH-CONVERSION BOTTOM CALL TO ACTION
      ========================================================================= */}
      <section className="py-20 bg-gradient-to-b from-transparent to-blue-600/5 dark:to-blue-950/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative p-8 sm:p-12 md:p-16 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-2xl overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Ready to Upgrade Your Engineering Lab Workflow?
              </h2>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                Join students saving hours every semester on manual formatting and walking into viva examinations with total confidence.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                {token ? (
                  <button
                    onClick={onNavigateToDashboard || (() => { window.location.href = '/dashboard'; })}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-blue-600 bg-white hover:bg-gray-100 shadow-lg transition-all"
                  >
                    Open Your Dashboard →
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onOpenAuth('register')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-blue-600 bg-white hover:bg-gray-100 shadow-lg transition-all"
                    >
                      Create Free Account
                    </button>
                    <button
                      onClick={() => onOpenAuth('login')}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-700/60 hover:bg-blue-700 border border-blue-400/40 transition-all"
                    >
                      Sign In to Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FOOTER
      ========================================================================= */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-10 bg-white dark:bg-gray-950 text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <LabPilotLogo size="sm" />
            <span className="font-bold text-gray-900 dark:text-white">LabPilotAI</span>
            <span>• Automated Academic Documentation & Adaptive AI Examination</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/Plash-Sharma/LabPilotAI"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              GitHub Repository
            </a>
            <span>MIT License</span>
            <span>© 2026 LabPilotAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
