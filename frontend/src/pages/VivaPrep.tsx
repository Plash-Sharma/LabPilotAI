import { useEffect, useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { api, Submission, VivaChatMessage } from '../api/client';
import {
  Sparkles,
  SendHorizontal,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Code2,
  Lightbulb,
  Zap,
  Target,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { CustomSelect } from '../components/CustomSelect';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DEFAULT_STARTER_PROMPTS = [
  {
    icon: Lightbulb,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    title: 'Predicted Viva Questions',
    prompt: 'What viva questions can my professor or examiner ask from this lab report?',
  },
  {
    icon: Zap,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    title: 'Complexity & Big-O',
    prompt: 'Analyze the time and space complexity of my implemented code in detail.',
  },
  {
    icon: Target,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
    title: 'Interactive Mock Quiz',
    prompt: 'Quiz me with an oral viva question on this lab and evaluate my answer.',
  },
  {
    icon: ShieldAlert,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    title: 'Critical Edge Cases',
    prompt: 'What critical edge cases and failure modes should I prepare for in my code?',
  },
];

// Lightweight Markdown Renderer for ChatGPT-like formatted answers
function FormattedMessageContent({ content }: { content: string }) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Split by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'code' | 'text'; lang?: string; content: string; id?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'text',
      content: match[2].trim(),
      id: `code-${match.index}`,
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  // If no code blocks found, fallback to pure text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return (
    <div className="space-y-3 leading-relaxed text-sm">
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return (
            <div key={pIdx} className="my-3 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 shadow-md">
              <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 border-b border-gray-800 text-xs text-gray-400">
                <span className="font-mono uppercase text-[11px] font-semibold text-blue-400 flex items-center">
                  <Code2 className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {part.lang}
                </span>
                <button
                  onClick={() => part.id && handleCopyCode(part.content, part.id)}
                  className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-[11px]"
                >
                  {copiedCodeId === part.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-gray-100 bg-gray-950 leading-normal">
                <code>{part.content}</code>
              </pre>
            </div>
          );
        }

        // Format normal text with markdown headers, bold, bullet points
        const lines = part.content.split('\n');
        return (
          <div key={pIdx} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-2" />;

              // Headings
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-base font-bold text-gray-900 dark:text-white mt-3 mb-1">
                    {trimmed.replace('### ', '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-1">
                    {trimmed.replace('## ', '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={lIdx} className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
                    {trimmed.replace('# ', '')}
                  </h2>
                );
              }

              // Blockquotes
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-4 border-blue-500 pl-3 py-1 text-gray-700 dark:text-gray-300 italic bg-blue-50/50 dark:bg-gray-800/50 rounded-r-lg my-1.5"
                  >
                    {renderInlineMarkdown(trimmed.replace(/^>\s*/, ''))}
                  </blockquote>
                );
              }

              // Bullet points
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start space-x-2 ml-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {renderInlineMarkdown(trimmed.slice(2))}
                    </span>
                  </div>
                );
              }

              // Numbered lists
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start space-x-2 ml-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs mt-0.5">{numMatch[1]}.</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {renderInlineMarkdown(numMatch[2])}
                    </span>
                  </div>
                );
              }

              // Paragraph
              return (
                <p key={lIdx} className="text-gray-800 dark:text-gray-200">
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Converts LaTeX mathematical expressions into clean text / unicode symbols
function cleanLatexMath(latex: string): string {
  let s = latex.trim();
  // Strip enclosing $$ or $
  if (s.startsWith('$$') && s.endsWith('$$')) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith('$') && s.endsWith('$')) {
    s = s.slice(1, -1).trim();
  }

  return s
    .replace(/\\mathcal\{([A-Za-z])\}/g, '$1')
    .replace(/\\mathbb\{([A-Za-z])\}/g, '$1')
    .replace(/\\mathbf\{([A-Za-z0-9]+)\}/g, '$1')
    .replace(/\\mathit\{([A-Za-z0-9]+)\}/g, '$1')
    .replace(/\\mathrm\{([A-Za-z0-9]+)\}/g, '$1')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\to/g, '→')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftarrow/g, '⇐')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\le(q)?/g, '≤')
    .replace(/\\ge(q)?/g, '≥')
    .replace(/\\ne(q)?/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\approx/g, '≈')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅')
    .replace(/\\infty/g, '∞')
    .replace(/\\pm/g, '±')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\Theta/g, 'Θ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}')
    .replace(/\\_/g, '_')
    .replace(/\\/g, ''); // strip any remaining stray backslashes
}

// Inline markdown helper (**bold**, *italic*, `code`, and clean math variables without dollar signs)
function renderInlineMarkdown(text: string) {
  // First clean any block math $$...$$
  let cleaned = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => cleanLatexMath(math));

  const parts = [];
  // Match inline math $...$, bold **...**, italic *...*, code `...`
  const regex = /(\$[^$\n]+\$|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleaned.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
      const mathCleaned = cleanLatexMath(token);
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 text-xs font-mono rounded bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-semibold"
        >
          {mathCleaned}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-gray-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-gray-800 dark:text-gray-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 text-xs font-mono rounded bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 font-semibold"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < cleaned.length) {
    parts.push(cleaned.substring(lastIndex));
  }
  return parts.length > 0 ? parts : cleaned;
}

export default function VivaPrep() {
  const location = useLocation();
  const toast = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const cached = api.getCachedSubmissions();
    return cached ? cached.filter(s => s.status === 'ready') : [];
  });
  const [selectedSubId, setSelectedSubId] = useState<string>(() => {
    const routeSubId = location.state?.submissionId;
    const cached = api.getCachedSubmissions()?.filter(s => s.status === 'ready') || [];
    return routeSubId && cached.some(s => s.id === routeSubId) ? routeSubId : '';
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'What viva questions can my professor ask?',
    'Analyze the time and space complexity of my code',
    'Quiz me with an oral exam question',
  ]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Submissions
  useEffect(() => {
    api.getSubmissions()
      .then(subs => {
        const readySubs = subs.filter(s => s.status === 'ready');
        setSubmissions(readySubs);

        const routeSubId = location.state?.submissionId;
        if (routeSubId && readySubs.some(s => s.id === routeSubId)) {
          setSelectedSubId(routeSubId);
        } else {
          // Do not auto-select first file; user must select from dropdown
          setSelectedSubId('');
        }
      })
      .catch(console.error);
  }, [location.state]);

  // Reset chat when switching submission
  useEffect(() => {
    if (selectedSubId) {
      setMessages([]);
      setSuggestedPrompts([
        'What viva questions can my professor ask?',
        'Analyze the time and space complexity of my code',
        'Quiz me with an oral exam question',
      ]);
    }
  }, [selectedSubId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectedSubmission = submissions.find(s => s.id === selectedSubId);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    if (!selectedSubId) {
      toast.info('Please select a lab report / file from the dropdown above to begin.', 'Select Lab Report');
      return;
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    // Prepare history payload for API
    const historyPayload: VivaChatMessage[] = newMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await api.chatWithViva(selectedSubId, text, historyPayload);
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, assistantMsg]);
      if (res.suggested_prompts && res.suggested_prompts.length > 0) {
        setSuggestedPrompts(res.suggested_prompts);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: "I'm having trouble connecting to the viva preparation service right now. Please ensure your backend is running and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setSuggestedPrompts([
      'What viva questions can my professor ask?',
      'Analyze the time and space complexity of my code',
      'Quiz me with an oral exam question',
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Header / Lab Selector Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm mb-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Viva AI Tutor & Oral Examiner</h1>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chat interactively with AI trained on your lab's aim, source code, and execution outputs.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-full sm:w-80">
              <CustomSelect
                value={selectedSubId}
                onChange={setSelectedSubId}
                options={submissions
                  .filter((sub, idx, self) => idx === self.findIndex(s => (s.filename || s.id).trim().toLowerCase() === (sub.filename || sub.id).trim().toLowerCase()))
                  .map(sub => ({
                    value: sub.id,
                    label: sub.filename || sub.subject_of_lab || 'Lab Report',
                    description: [sub.subject_of_lab, sub.date_of_lab].filter(Boolean).join(' • ') || undefined,
                    badge: sub.batch_name ? `Batch: ${sub.batch_name}` : undefined,
                    icon: FileText,
                  }))}
                placeholder="Select Lab Report / File"
                emptyMessage="No lab reports found. Create one first!"
              />
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {selectedSubmission && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-gray-900 dark:text-white">File Name:</span>
              <span className="text-gray-700 dark:text-gray-200 font-medium">{selectedSubmission.filename || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-gray-900 dark:text-white">Teacher Name:</span>
              <span className="text-gray-700 dark:text-gray-200 font-medium">{selectedSubmission.teacher_name || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-gray-900 dark:text-white">Date:</span>
              <span className="text-gray-700 dark:text-gray-200 font-medium">{selectedSubmission.date_of_lab || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                How can I help you ace your Viva?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md">
                I have full context of your submitted experiment, code, and output results. Ask questions, request mock viva practice, or explore time complexity.
              </p>

              {/* Starter Prompt Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {DEFAULT_STARTER_PROMPTS.map((starter, idx) => {
                  const Icon = starter.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(starter.prompt)}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50/60 dark:bg-gray-850 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm group"
                    >
                      <div className="flex items-center space-x-2.5 mb-1.5">
                        <div className={`p-1.5 rounded-lg border ${starter.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {starter.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {starter.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-5 py-4 shadow-sm transition-colors ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-bl-none text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-gray-200/50 dark:border-gray-700/50 text-[11px] opacity-75">
                      <span className="font-semibold">
                        {msg.role === 'user' ? 'You' : 'LabPilot AI Examiner'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span>{msg.timestamp}</span>
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => handleCopyMessage(msg.content, msg.id)}
                            className="hover:text-blue-500 transition-colors"
                            title="Copy reply"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <FormattedMessageContent content={msg.content} />
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-white shrink-0 mt-1">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 mt-1 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 font-medium">Examining lab & thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggested Prompts & Floating Chat Input Dock */}
        <div className="p-4 bg-gray-50/80 dark:bg-gray-850/80 border-t border-gray-200 dark:border-gray-800">
          {/* Quick Suggestions Chips */}
          {suggestedPrompts.length > 0 && !loading && (
            <div className="mb-3 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center mr-1">
                <Sparkles className="w-3 h-3 mr-1 text-blue-500" /> Suggested:
              </span>
              {suggestedPrompts.slice(0, 3).map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1 text-xs rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs hover:shadow-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* ChatGPT Style Input Container */}
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                // Auto expand textarea height
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={loading || !selectedSubId}
              placeholder={
                selectedSubId
                  ? "Ask anything about your lab, code, complexity, or mock viva... (Enter to send)"
                  : "Select a lab report above to start viva prep..."
              }
              className="flex-1 max-h-32 px-4 py-3 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
            />
            <div className="pr-2 pl-1 py-2 flex items-center">
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading || !selectedSubId}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20"
                title="Send query"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </div>
          </form>

          <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
            LabPilot AI combines oral examination standards with your experiment's source code and outputs.
          </p>
        </div>
      </div>
    </div>
  );
}
