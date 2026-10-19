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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Code2,
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
  const [mcqAnswerSelected, setMcqAnswerSelected] = useState<number | null>(null);

  const workflowSteps = [
    {
      num: '01',
      title: 'Input Problem & Code',
      badge: 'Step 1: Input',
      desc: 'Enter your experiment aim, algorithm description, and raw source code. The lexer automatically identifies C++, Python, Java, or JavaScript.',
      detail: 'Supports single programming tasks or multi-problem arrays with custom batch and date metadata.',
      icon: Code2,
    },
    {
      num: '02',
      title: 'Automated PDF Compilation',
      badge: 'Step 2: Compile',
      desc: 'WeasyPrint and Jinja2 compile your submission into a standardized academic PDF with institutional headers, page numbers, and syntax highlighting.',
      detail: 'Includes compliant university templates with customizable college logos and roll numbers.',
      icon: FileText,
    },
    {
      num: '03',
      title: 'Vectorized RAG Indexing',
      badge: 'Step 3: Index',
      desc: 'Text is partitioned into 1,000-character semantic chunks, converted into 768-dimensional embeddings, and stored in PostgreSQL pgvector.',
      detail: 'Enables high-precision cosine similarity retrieval over your specific implementation code.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'AI Viva Voce Simulation',
      badge: 'Step 4: Prepare',
      desc: 'Google Gemini acts as an oral lab examiner, asking focused questions regarding time complexity, memory allocation, and edge cases.',
      detail: 'Includes algorithmic heuristic fallbacks so students can prepare even if offline.',
      icon: Sparkles,
    },
    {
      num: '05',
      title: 'Adaptive MCQ Diagnostics',
      badge: 'Step 5: Assess',
      desc: 'Generates 10 to 15 questions balanced across Easy, Medium, and Hard difficulty tiers with instant performance scoring.',
      detail: 'Classifies performance from Beginner to Mastery with actionable conceptual recommendations.',
      icon: GraduationCap,
    },
  ];

  const faqs = [
    {
      q: 'How does LabPilotAI format laboratory reports?',
      a: 'LabPilotAI pairs Jinja2 templating with Pygments lexical analysis and WeasyPrint CSS3 Paged Media. You provide the problem statement, algorithm, code, and terminal output, and the engine automatically generates an institutional PDF with proper headers, running footers, and syntax highlighting.',
    },
    {
      q: 'What is the Viva Voce preparation tutor and how does it work?',
      a: 'Whenever you generate a lab report, LabPilotAI creates 768-dimensional vector embeddings with Google Gemini. In PostgreSQL (pgvector), it performs cosine similarity search to retrieve relevant code passages and conduct an oral viva simulation, asking you the exact technical questions faculty examiners ask.',
    },
    {
      q: 'Which programming languages are supported?',
      a: 'LabPilotAI supports all primary engineering programming languages: C, C++, Java, Python, and JavaScript. Lexical formatting is automatically detected and tokenized.',
    },
    {
      q: 'Can I customize reports for my specific college or university?',
      a: 'Yes. You can select standard academic templates (such as NIT Jalandhar or Minimalist Academic) and upload your college crest logo, roll number, teacher name, and subject code, which are formatted across every page.',
    },
    {
      q: 'How does the Semester Portfolio Binder work?',
      a: 'Throughout the semester, all your lab submissions are stored in your dashboard. With one click, LabPilotAI concatenates all your individual experiment PDFs into a single, cohesive semester record binder ready for final evaluation.',
    },
    {
      q: 'Is my student data and code secure?',
      a: 'All accounts are protected with BCrypt password hashing, JWT authentication, sliding-window rate limiting, and private Cloudflare R2 / S3 storage. Code execution occurs strictly within isolated environments.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-150">
      {/* =========================================================================
          1. SLEEK SOLID NAVBAR
      ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <LabPilotLogo size="md" />
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                LabPilotAI
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                v1.0
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#workflow" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#demo" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Live Demo
            </a>
            <a href="#features" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>

            {token ? (
              <button
                onClick={onNavigateToDashboard || (() => { window.location.href = '/dashboard'; })}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 space-y-3">
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Workflow
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Live Demo
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Features
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              FAQ
            </a>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-col space-y-2">
              {token ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateToDashboard) onNavigateToDashboard();
                    else window.location.href = '/dashboard';
                  }}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 text-center"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('register');
                    }}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 text-center"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (SOLID HIGH-CLASS DESIGN)
      ========================================================================= */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle Solid Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold border border-gray-200 dark:border-gray-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Engineering Lab Automation & Examination Platform</span>
          </div>

          {/* Solid Bold Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.15]">
            Automate Engineering Lab Reports.{' '}
            <span className="text-blue-600 dark:text-blue-500">
              Master Viva Voce with AI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate manual code formatting and guesswork in oral exams. LabPilotAI auto-compiles standardized academic PDFs with Pygments syntax highlighting and creates 768-dimensional RAG vector simulations for real-time exam preparation.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {token ? (
              <button
                onClick={onNavigateToDashboard || (() => { window.location.href = '/dashboard'; })}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <span>Go to Lab Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#workflow"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-current" />
                  <span>How It Works</span>
                </a>
              </>
            )}
          </div>

          {/* Solid 4-Metric Strip */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">100%</div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">Academic Standards</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Compliant report layouts</div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">&lt; 3s</div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">PDF Compilation</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Instant WeasyPrint generation</div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">768-dim</div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">pgvector Embeddings</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Semantic code chunk search</div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">3-Tier</div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">Adaptive Quizzing</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Easy, Medium, Hard tiers</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. 5-STEP WORKFLOW GUIDE (SOLID & CLEAN)
      ========================================================================= */}
      <section id="workflow" className="py-20 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 mb-2">
              Workflow Guide
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              The Engineering Lab Pipeline
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              From raw code in your terminal to institutional PDF submission and exam readiness.
            </p>
          </div>

          {/* Stepper Buttons */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {workflowSteps.map((step, idx) => (
              <button
                key={step.num}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  activeWorkflowStep === idx
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{step.num}.</span>
                <span>{step.title}</span>
              </button>
            ))}
          </div>

          {/* Active Step Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
            {(() => {
              const step = workflowSteps[activeWorkflowStep];
              const StepIcon = step.icon;
              return (
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-6 space-y-4">
                    <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium border border-gray-200 dark:border-gray-700">
                      <StepIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{step.badge}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {step.num}. {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                      <strong className="text-gray-900 dark:text-gray-200">Engineering Note: </strong>
                      {step.detail}
                    </div>
                    <div className="pt-2 flex items-center space-x-3">
                      {activeWorkflowStep > 0 && (
                        <button
                          onClick={() => setActiveWorkflowStep(activeWorkflowStep - 1)}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          ← Previous
                        </button>
                      )}
                      {activeWorkflowStep < workflowSteps.length - 1 && (
                        <button
                          onClick={() => setActiveWorkflowStep(activeWorkflowStep + 1)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          Next: {workflowSteps[activeWorkflowStep + 1].title} →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Code / Visual Box */}
                  <div className="md:col-span-6 bg-gray-900 rounded-xl p-4 border border-gray-800 text-gray-200 font-mono text-xs">
                    {activeWorkflowStep === 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between pb-1 border-b border-gray-800 text-[11px] text-gray-400">
                          <span>experiment_03.cpp</span>
                          <span className="text-emerald-400">C++ Lexer</span>
                        </div>
                        <pre className="text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
{`#include <iostream>
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
                      </div>
                    )}

                    {activeWorkflowStep === 1 && (
                      <div className="space-y-2">
                        <div className="flex justify-between pb-1 border-b border-gray-800 text-[11px] text-gray-400">
                          <span>Standard_Template.pdf</span>
                          <span className="text-blue-400">WeasyPrint</span>
                        </div>
                        <div className="bg-white text-gray-900 p-3 rounded space-y-1.5 text-[10px]">
                          <div className="text-center font-bold text-xs text-blue-700 border-b pb-1">
                            DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
                          </div>
                          <div className="flex justify-between text-gray-600 text-[9px]">
                            <span>Student: Plash Sharma</span>
                            <span>Roll: 23103042</span>
                          </div>
                          <div className="bg-gray-100 p-1.5 rounded font-mono text-[9px]">
                            Aim: Implement QuickSort and verify average time complexity.
                          </div>
                        </div>
                      </div>
                    )}

                    {activeWorkflowStep === 2 && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between pb-1 border-b border-gray-800 text-[11px] text-gray-400">
                          <span>PostgreSQL pgvector</span>
                          <span className="text-purple-400">768 Dimensions</span>
                        </div>
                        <div className="text-gray-400 text-[10px]">Vector chunk:</div>
                        <div className="p-2 bg-gray-800 rounded font-mono text-[10px] text-purple-300">
                          [0.0241, -0.0892, 0.1542, -0.0123, 0.0984, ... 768 dims]
                        </div>
                        <div className="text-emerald-400 text-[11px]">
                          Cosine Similarity Index: Cosine Distance &lt; 0.18
                        </div>
                      </div>
                    )}

                    {activeWorkflowStep === 3 && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between pb-1 border-b border-gray-800 text-[11px] text-gray-400">
                          <span>Viva AI Session</span>
                          <span className="text-pink-400">Gemini</span>
                        </div>
                        <div className="p-2.5 rounded bg-gray-800 text-blue-300 text-[11px]">
                          <strong>Examiner:</strong> "What is the worst-case time complexity of QuickSort, and why?"
                        </div>
                        <div className="p-2.5 rounded bg-gray-800 text-gray-200 text-[11px]">
                          <strong>You:</strong> "O(N^2) when the pivot divides elements maximally unevenly, such as on an already sorted array."
                        </div>
                      </div>
                    )}

                    {activeWorkflowStep === 4 && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between pb-1 border-b border-gray-800 text-[11px] text-gray-400">
                          <span>Diagnostic Assessment</span>
                          <span className="text-amber-400">Tier: Hard</span>
                        </div>
                        <div className="text-gray-200 text-[11px]">
                          What is the space complexity of in-place QuickSort on the call stack?
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                          <div className="p-1.5 bg-emerald-950 border border-emerald-700 text-emerald-200 rounded">✓ O(log N) average</div>
                          <div className="p-1.5 bg-gray-800 rounded text-gray-400">O(1)</div>
                          <div className="p-1.5 bg-gray-800 rounded text-gray-400">O(N) always</div>
                          <div className="p-1.5 bg-gray-800 rounded text-gray-400">O(N log N)</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. LIVE PRODUCT DEMO TABS (SOLID STYLING)
      ========================================================================= */}
      <section id="demo" className="py-20 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Live Product Demonstrations
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Select an interface below to inspect the actual system outputs.
            </p>
          </div>

          {/* Clean Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'pdf'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Academic PDF
              </button>
              <button
                onClick={() => setActiveTab('viva')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'viva'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Viva AI Prep
              </button>
              <button
                onClick={() => setActiveTab('mcq')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'mcq'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Adaptive Quiz
              </button>
              <button
                onClick={() => setActiveTab('binder')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'binder'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Semester Binder
              </button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    NIT Jalandhar Academic Laboratory Report
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Compliant Academic Format
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 font-mono text-xs space-y-3">
                  <div className="text-center border-b border-gray-200 dark:border-gray-800 pb-2">
                    <div className="font-bold text-sm text-blue-600 dark:text-blue-400 font-sans">
                      DR. B. R. AMBEDKAR NATIONAL INSTITUTE OF TECHNOLOGY JALANDHAR
                    </div>
                    <div className="text-xs text-gray-500 font-sans">Department of Computer Science & Engineering</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-b border-gray-200 dark:border-gray-800 pb-2">
                    <div><strong>Student:</strong> Plash Sharma</div>
                    <div><strong>Roll No:</strong> 23103042</div>
                    <div><strong>Subject:</strong> DSA Lab (CSX-204)</div>
                    <div><strong>Date:</strong> 19 Oct 2026</div>
                  </div>
                  <div className="space-y-1 font-sans">
                    <div className="font-bold text-xs text-gray-900 dark:text-white uppercase">1. Aim</div>
                    <p className="text-gray-600 dark:text-gray-300 text-xs">
                      Implement Binary Search Tree (BST) operations: Insertion, Deletion, and In-Order Traversal.
                    </p>
                  </div>
                  <div className="space-y-1 font-sans">
                    <div className="font-bold text-xs text-gray-900 dark:text-white uppercase">2. Terminal Output</div>
                    <div className="p-2 bg-black text-emerald-400 font-mono rounded text-[11px]">
                      BST In-Order Traversal: 12 25 30 45 60 78 99
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'viva' && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="font-bold text-gray-900 dark:text-white">
                    Conversational Viva Voce Oral Examiner
                  </div>
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    RAG Grounded (pgvector)
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    <strong className="text-blue-600 dark:text-blue-400 block mb-1">Examiner Question:</strong>
                    "When deleting a node with two children in a BST, you used the in-order successor. What is the impact on tree balance if you consistently choose the successor over the predecessor?"
                  </div>
                  <div className="p-3.5 rounded-lg bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">Your Answer:</strong>
                    "Consistently choosing the in-order successor gradually causes the right subtrees to shrink faster than the left, introducing left-heavy skewness. Alternating between predecessor and successor maintains a better balance."
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-200">
                    <strong>Evaluation:</strong> Full Marks (10/10) • Demonstrated mastery of tree balance dynamics.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mcq' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    Adaptive Diagnostic Question
                  </div>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Tier: Hard
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  What is the worst-case time complexity of searching an element in a Binary Search Tree with N nodes?
                </p>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { text: 'A) O(1) constant time', isCorrect: false },
                    { text: 'B) O(log N) logarithmic', isCorrect: false },
                    { text: 'C) O(N) when tree is skewed', isCorrect: true },
                    { text: 'D) O(N log N) linearithmic', isCorrect: false },
                  ].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setMcqAnswerSelected(i)}
                      className={`p-3 rounded-lg text-left font-medium border transition-colors ${
                        mcqAnswerSelected === i
                          ? opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                            : 'bg-red-50 dark:bg-red-950 border-red-500 text-red-800 dark:text-red-200'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
                {mcqAnswerSelected !== null && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
                    <strong>Explanation:</strong> In a degenerate (skewed) binary search tree, every node has only one child, behaving identically to a linked list where search traversal takes O(N).
                  </div>
                )}
              </div>
            )}

            {activeTab === 'binder' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    Semester PDF Binder Compilation
                  </div>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    PyPDF2 Concatenation
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'Exp 01', name: 'Array Operations & Dynamic Memory Allocation', status: 'Included' },
                    { id: 'Exp 02', name: 'Stack Implementation via Linked List (LIFO)', status: 'Included' },
                    { id: 'Exp 03', name: 'Circular Queue and Priority Queue Algorithms', status: 'Included' },
                    { id: 'Exp 04', name: 'Binary Search Tree Traversals & Deletions', status: 'Included' },
                    { id: 'Exp 05', name: 'Graph Breadth-First & Depth-First Search', status: 'Included' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <strong className="text-blue-600 dark:text-blue-400">{item.id}:</strong>
                        <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
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
        </div>
      </section>

      {/* =========================================================================
          5. FEATURES GRID (CLEAN & SOLID)
      ========================================================================= */}
      <section id="features" className="py-20 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Engineered for Academic Rigor
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Core capabilities built specifically for computer science and engineering coursework.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Multi-Language Tokenization</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Pygments identifies C, C++, Java, Python, and JavaScript, generating clean lexical spans with custom CSS styling and zero syntax loss.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Institutional PDF Standards</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                WeasyPrint CSS Paged Media formats running headers, footers, institutional crests, and student roll numbers formatted for grading.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">pgvector Semantic RAG</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                768-dimensional vector chunks empower Google Gemini to probe your exact logic without hallucination or generic textbook responses.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Adaptive Diagnostic Quizzes</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Dynamic 10-question tests spanning Easy, Medium, and Hard tiers diagnose your strengths and pinpoint algorithms requiring review.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">One-Click Semester Binder</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Assembles all experiments into a single paginated master PDF file for end-of-semester faculty inspection and archival.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Hardened Platform Security</h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                BCrypt password hashing, OAuth2 JWT bearer tokens, sliding-window rate limiting, and private Cloudflare R2 cloud storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FAQ ACCORDION
      ========================================================================= */}
      <section id="faq" className="py-20 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Answers to common questions regarding LabPilotAI features and workflows.
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between space-x-4 focus:outline-none"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. HIGH-CLASS SOLID BOTTOM CTA
      ========================================================================= */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gray-900 text-white p-8 sm:p-12 text-center border border-gray-800">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to Upgrade Your Engineering Lab Workflow?
            </h2>
            <p className="mt-3 text-sm text-gray-300 max-w-xl mx-auto">
              Join students saving hours on manual lab formatting and preparing for oral viva exams with complete confidence.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              {token ? (
                <button
                  onClick={onNavigateToDashboard || (() => { window.location.href = '/dashboard'; })}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors text-sm"
                >
                  Open Your Dashboard →
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors text-sm"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-white bg-gray-800 hover:bg-gray-750 border border-gray-700 transition-colors text-sm"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
      ========================================================================= */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 bg-white dark:bg-gray-950 text-xs text-gray-500 dark:text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <LabPilotLogo size="sm" />
            <span className="font-bold text-gray-900 dark:text-white">LabPilotAI</span>
            <span>• Automated Academic Documentation &amp; AI Examination</span>
          </div>

          <div className="flex items-center space-x-5">
            <a
              href="https://github.com/Plash-Sharma/LabPilotAI"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span>MIT License</span>
            <span>© 2026 LabPilotAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
