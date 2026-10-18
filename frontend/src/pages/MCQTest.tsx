import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  api,
  Submission,
  MCQTest,
  MCQAttempt,
} from '../api/client';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Target,
  Trash2,
  Download,
  FileText,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useToast } from '../contexts/ToastContext';
import { CustomSelect } from '../components/CustomSelect';

export function getDisplayAim(sub: Submission | null | undefined): string {
  if (!sub) return '';
  if (sub.aim && sub.aim !== 'MULTI_PROBLEM') {
    return sub.aim;
  }
  try {
    const parsed = JSON.parse(sub.code);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const questions = parsed.map((p: any) => p.question?.trim()).filter(Boolean);
      if (questions.length > 0) {
        return questions.length === 1
          ? questions[0]
          : questions.map((q: string, i: number) => `P${i + 1}: ${q}`).join(' | ');
      }
    }
  } catch {
    // not JSON
  }
  return sub.subject_of_lab ? `${sub.subject_of_lab} Experiment` : 'Laboratory Practical';
}

export default function MCQTestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const urlSubId = searchParams.get('subId');
  const urlTestId = searchParams.get('testId');
  const urlMode = searchParams.get('mode'); // 'take' | 'report'

  // URL or state param for preselecting submission
  const stateSubId = urlSubId || (location.state as any)?.submissionId;

  const [currentUser, setCurrentUser] = useState<any>(() => api.getCachedMe());
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const cached = api.getCachedSubmissions();
    return cached ? cached.filter((s) => s.status === 'ready') : [];
  });
  const [selectedSubId, setSelectedSubId] = useState<string>(() => {
    const targetId = urlSubId || stateSubId;
    const cached = api.getCachedSubmissions()?.filter((s) => s.status === 'ready') || [];
    return targetId && cached.some((s) => s.id === targetId) ? targetId : '';
  });
  const [numQuestions, setNumQuestions] = useState<number>(10);

  // Active state
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTest, setCurrentTest] = useState<MCQTest | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<MCQAttempt | null>(null);
  const [pastTests, setPastTests] = useState<MCQTest[]>([]);
  const [deleteTestTarget, setDeleteTestTarget] = useState<string | null>(null);
  const [isDeletingTest, setIsDeletingTest] = useState<boolean>(false);

  // Taking test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  // Load ready submissions and current user profile
  useEffect(() => {
    api.getMe().then(setCurrentUser).catch(() => {});
    api.getSubmissions()
      .then((subs) => {
        const ready = subs.filter((s) => s.status === 'ready');
        setSubmissions(ready);
        const targetId = urlSubId || stateSubId;
        if (targetId && ready.some((s) => s.id === targetId)) {
          setSelectedSubId(targetId);
        } else {
          // Do not auto-select first file; user must select from dropdown
          setSelectedSubId('');
        }
      })
      .catch((err) => console.error('Failed to load submissions:', err));
  }, []);

  // When selected submission changes, load previous tests for it
  useEffect(() => {
    if (selectedSubId) {
      api.getSubmissionMCQTests(selectedSubId)
        .then(setPastTests)
        .catch((err) => console.error('Failed to load tests:', err));
    } else {
      setPastTests([]);
    }
  }, [selectedSubId]);

  // Synchronize component state with URL search params (enables browser Back/Forward navigation)
  useEffect(() => {
    if (urlSubId && urlSubId !== selectedSubId) {
      setSelectedSubId(urlSubId);
    } else if (!urlSubId && selectedSubId && !stateSubId) {
      setSelectedSubId('');
    }

    // If no testId or mode, return to the base selection & past tests screen of that lab PDF
    if (!urlTestId || !urlMode) {
      if (currentTest || currentAttempt) {
        setCurrentTest(null);
        setCurrentAttempt(null);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
      }
      return;
    }

    if (urlMode === 'report' && urlTestId) {
      if (currentAttempt && currentTest?.id === urlTestId) return;

      setLoading(true);
      Promise.all([
        api.getMCQTest(urlTestId),
        api.getMCQTestAttempts(urlTestId),
      ])
        .then(async ([test, attempts]) => {
          setCurrentTest(test);
          if (attempts && attempts.length > 0) {
            const fullAttempt = await api.getMCQAttempt(attempts[0].id);
            setCurrentAttempt(fullAttempt);
          } else {
            setCurrentAttempt(null);
            toast.info('No submitted evaluation report found for this test session yet.', 'No Report Found');
          }
        })
        .catch((err) => {
          toast.error(`Failed to load test report: ${err.message || err.toString()}`);
        })
        .finally(() => setLoading(false));
    } else if (urlMode === 'take' && urlTestId) {
      if (currentTest?.id === urlTestId && !currentAttempt) return;

      setLoading(true);
      setCurrentAttempt(null);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      api.getMCQTest(urlTestId)
        .then((test) => {
          setCurrentTest(test);
        })
        .catch((err) => {
          toast.error(`Failed to load test: ${err.message || err.toString()}`);
        })
        .finally(() => setLoading(false));
    }
  }, [urlSubId, urlTestId, urlMode]);

  const handleGenerateTest = async () => {
    if (!selectedSubId) return;
    setLoading(true);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const test = await api.generateMCQTest(selectedSubId, numQuestions);
      setCurrentTest(test);
      setCurrentAttempt(null);
      // Refresh past tests list
      api.getSubmissionMCQTests(selectedSubId).then(setPastTests).catch(console.error);
      toast.success('MCQ test generated successfully! Best of luck.', 'Test Ready');
      navigate(`/mcq?subId=${selectedSubId}&testId=${test.id}&mode=take`);
    } catch (err: any) {
      toast.error(`Failed to generate MCQ test: ${err.message || 'Please check API connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitTest = async () => {
    if (!currentTest) return;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount === 0) {
      toast.info('Please answer at least one question before submitting.', 'Test Incomplete');
      return;
    }

    setSubmitting(true);
    try {
      const attempt = await api.submitMCQTest(currentTest.id, selectedAnswers);
      setCurrentAttempt(attempt);
      toast.success(`Scored ${attempt.percentage}% (${attempt.score}/${attempt.total_questions} correct). Evaluation ready!`, 'Test Graded');
      if (selectedSubId) {
        api.getSubmissionMCQTests(selectedSubId).then(setPastTests).catch(console.error);
      }
      navigate(`/mcq?subId=${selectedSubId}&testId=${currentTest.id}&mode=report`);
    } catch (err: any) {
      toast.error(`Failed to submit test: ${err.message || 'Error grading test'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTestReport = (testId: string) => {
    navigate(`/mcq?subId=${selectedSubId}&testId=${testId}&mode=report`);
  };

  const handleRetakePastTest = (testId: string) => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    navigate(`/mcq?subId=${selectedSubId}&testId=${testId}&mode=take`);
  };

  const handleResetForNewTest = () => {
    navigate(`/mcq?subId=${selectedSubId}`);
  };

  const handleConfirmDeleteTest = async () => {
    if (!deleteTestTarget) return;
    setIsDeletingTest(true);
    try {
      await api.deleteMCQTest(deleteTestTarget);
      setPastTests((prev) => prev.filter((t) => t.id !== deleteTestTarget));
      if (currentTest?.id === deleteTestTarget || urlTestId === deleteTestTarget) {
        setCurrentTest(null);
        setCurrentAttempt(null);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        navigate(`/mcq?subId=${selectedSubId}`);
      }
      setDeleteTestTarget(null);
      toast.success('MCQ test deleted successfully.');
    } catch (err: any) {
      toast.error(`Failed to delete test: ${err.message || err.toString()}`);
    } finally {
      setIsDeletingTest(false);
    }
  };

  const handleDownloadSummaryCard = () => {
    if (!currentAttempt) {
      toast.error('No assessment results found to download.');
      return;
    }

    const studentName = currentUser?.full_name || 'Student';
    const studentEmail = currentUser?.email || 'N/A';
    const labTitle = selectedSubmission ? getDisplayAim(selectedSubmission) : 'Laboratory Practical Skill Assessment';
    const assessmentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const attemptScore = `${currentAttempt.score} / ${currentAttempt.total_questions}`;
    const percentage = `${currentAttempt.percentage}%`;
    const proficiencyLevel = currentAttempt.level || 'Evaluated';

    // Build Concept Breakdown rows
    const conceptBreakdownHtml = currentAttempt.analysis?.concept_breakdown
      ? Object.entries(currentAttempt.analysis.concept_breakdown)
          .map(([concept, data]) => {
            const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 500; color: #1e293b;">${concept}</td>
                <td style="padding: 10px 14px; text-align: center; color: #64748b;">${data.correct} / ${data.total}</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 600; color: ${acc >= 70 ? '#059669' : acc >= 50 ? '#d97706' : '#dc2626'};">${acc}%</td>
              </tr>
            `;
          })
          .join('')
      : '';

    const strengthsHtml = currentAttempt.analysis?.strengths?.length
      ? currentAttempt.analysis.strengths
          .map((s) => `<li style="margin-bottom: 6px; color: #065f46;">✓ <strong>${s}</strong></li>`)
          .join('')
      : '<li style="color: #64748b;">Solid baseline concepts demonstrated across tested questions.</li>';

    const weaknessesHtml = currentAttempt.analysis?.weaknesses?.length
      ? currentAttempt.analysis.weaknesses
          .map((w) => `<li style="margin-bottom: 6px; color: #92400e;">▲ <strong>${w}</strong></li>`)
          .join('')
      : '<li style="color: #64748b;">No major conceptual blind spots identified in this run.</li>';

    const cardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>LabPilotAI Assessment Certificate & Performance Card - ${studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      display: flex;
      justify-content: center;
      padding: 30px 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card-container {
      background: #ffffff;
      width: 100%;
      max-width: 820px;
      border-radius: 24px;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
      border: 2px solid #e2e8f0;
      overflow: hidden;
      position: relative;
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 32px 36px;
      position: relative;
      border-bottom: 4px solid #3b82f6;
    }
    .badge-top {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(147, 197, 253, 0.4);
      color: #93c5fd;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 12px;
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .brand-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .verified-seal {
      text-align: right;
      background: rgba(255, 255, 255, 0.05);
      padding: 10px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .verified-seal .seal-txt {
      font-size: 11px;
      color: #38bdf8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-body {
      padding: 32px 36px;
    }
    .student-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      background: #f8fafc;
      padding: 20px 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      margin-bottom: 28px;
    }
    .student-meta-item .meta-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .student-meta-item .meta-val {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      word-break: break-word;
    }
    .hero-score-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border: 2px solid #bfdbfe;
      border-radius: 18px;
      padding: 24px 28px;
      margin-bottom: 28px;
    }
    .score-metric {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .percentage-big {
      font-size: 46px;
      font-weight: 800;
      color: #1d4ed8;
      line-height: 1;
    }
    .score-ratio {
      font-size: 18px;
      font-weight: 700;
      color: #475569;
    }
    .level-badge-pill {
      display: inline-block;
      padding: 8px 18px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.03em;
      box-shadow: 0 4px 10px rgba(0,0,0,0.12);
    }
    .feedback-box {
      margin-bottom: 28px;
      padding: 18px 22px;
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      border-radius: 0 14px 14px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }
    .analysis-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    @media (max-width: 640px) {
      .analysis-two-col { grid-template-columns: 1fr; }
    }
    .col-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
    }
    .col-card.strengths {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .col-card.weaknesses {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .col-card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 12px;
    }
    .col-card.strengths .col-card-title { color: #166534; }
    .col-card.weaknesses .col-card-title { color: #92400e; }
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 28px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .breakdown-table th {
      background: #f8fafc;
      text-align: left;
      padding: 12px 14px;
      font-weight: 700;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    .footer-watermark {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .no-print-bar {
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .card-container { border: none; box-shadow: none; max-width: 100%; }
      .no-print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div style="width: 100%; max-width: 820px;">
    <div class="no-print-bar">
      <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
    </div>

    <div class="card-container">
      <div class="header-banner">
        <span class="badge-top">Lab Competency & Assessment Record</span>
        <div class="title-row">
          <div>
            <div class="brand-title">LabPilotAI Assessment Certificate</div>
            <div class="brand-subtitle">Automated Laboratory Examination & Skill Mastery Evaluation</div>
          </div>
          <div class="verified-seal">
            <div class="seal-txt">✓ AI Verified</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Evaluation Engine</div>
          </div>
        </div>
      </div>

      <div class="card-body">
        <div class="student-grid">
          <div class="student-meta-item">
            <div class="meta-label">Student Name</div>
            <div class="meta-val">${studentName}</div>
          </div>
          <div class="student-meta-item">
            <div class="meta-label">Email / Identifier</div>
            <div class="meta-val">${studentEmail}</div>
          </div>
          <div class="student-meta-item">
            <div class="meta-label">Assessment Subject</div>
            <div class="meta-val">${labTitle}</div>
          </div>
          <div class="student-meta-item">
            <div class="meta-label">Date Completed</div>
            <div class="meta-val">${assessmentDate}</div>
          </div>
        </div>

        <div class="hero-score-box">
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 4px;">Score Achieved</div>
            <div class="score-metric">
              <span class="percentage-big">${percentage}</span>
              <span class="score-ratio">(${attemptScore} Correct)</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 6px;">Evaluation Rating</div>
            <span class="level-badge-pill">${proficiencyLevel}</span>
          </div>
        </div>

        <div class="feedback-box">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">AI Instructor Feedback:</strong>
          ${currentAttempt.feedback}
        </div>

        <div class="analysis-two-col">
          <div class="col-card strengths">
            <div class="col-card-title">Demonstrated Strengths</div>
            <ul style="padding-left: 16px; font-size: 13px;">
              ${strengthsHtml}
            </ul>
          </div>
          <div class="col-card weaknesses">
            <div class="col-card-title">Target Growth & Review Areas</div>
            <ul style="padding-left: 16px; font-size: 13px;">
              ${weaknessesHtml}
            </ul>
          </div>
        </div>

        ${
          conceptBreakdownHtml
            ? `
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Concept-Level Competency Breakdown</div>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Concept Domain</th>
                <th style="text-align: center;">Questions</th>
                <th style="text-align: right;">Accuracy Rate</th>
              </tr>
            </thead>
            <tbody>
              ${conceptBreakdownHtml}
            </tbody>
          </table>
        `
            : ''
        }

        <div class="footer-watermark">
          <span>Official LabPilotAI Academic Skill Performance Card &bull; Record ID: ${currentAttempt.id.slice(0, 12)}</span>
          <span>Verified at ${new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Download file directly
    const blob = new Blob([cardHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `LabPilotAI_Performance_Card_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open printable window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(cardHtml);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow.focus();
        } catch {}
      }, 500);
    }

    toast.success('Lab performance summary card downloaded & preview opened!', 'Card Downloaded');
  };

  const selectedSubmission = submissions.find((s) => s.id === selectedSubId);

  // Level Badge Helper
  const getLevelBadge = (level: string) => {
    if (level.includes('Mastery')) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 dark:bg-gray-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40',
        icon: Award,
        label: 'Level 4: Mastery',
      };
    }
    if (level.includes('Proficient')) {
      return {
        bg: 'bg-blue-50 text-blue-800 dark:bg-gray-800 dark:text-blue-400 border-blue-300 dark:border-blue-500/40',
        icon: TrendingUp,
        label: 'Level 3: Proficient',
      };
    }
    if (level.includes('Intermediate')) {
      return {
        bg: 'bg-amber-50 text-amber-800 dark:bg-gray-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/40',
        icon: Target,
        label: 'Level 2: Intermediate',
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-800 dark:bg-gray-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/40',
      icon: HelpCircle,
      label: 'Level 1: Beginner',
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  MCQ Knowledge Check & Skill Level Test
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Evaluate your conceptual depth, syntax fluency, and code output prediction on the spot with fresh 10–15 question tests.
                </p>
              </div>
            </div>
          </div>

          {(currentTest || currentAttempt) && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetForNewTest}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </button>
              {currentTest && (
                <button
                  onClick={() => setDeleteTestTarget(currentTest.id)}
                  className="inline-flex items-center px-4 py-2 border border-rose-200 dark:border-rose-900/50 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 shadow-sm transition-colors"
                  title="Delete current test"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. SELECTION & CONFIGURATION PANEL (If no active test or reviewing) */}
      {!currentTest && !currentAttempt && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
              1. Select Lab Record
            </h2>

            {submissions.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400">No ready lab PDFs found yet.</p>
                <button
                  onClick={() => navigate('/create')}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source Lab PDF
                  </label>
                  <CustomSelect
                    value={selectedSubId}
                    onChange={(newId) => {
                      setSelectedSubId(newId);
                      if (newId) {
                        setSearchParams({ subId: newId }, { replace: true });
                      } else {
                        setSearchParams({}, { replace: true });
                      }
                    }}
                    options={submissions
                      .filter((sub, idx, self) => idx === self.findIndex(s => s.id === sub.id))
                      .map((sub) => ({
                        value: sub.id,
                        label: sub.filename || sub.subject_of_lab || 'Lab Submission',
                        description: [sub.subject_of_lab, sub.date_of_lab].filter(Boolean).join(' • ') || undefined,
                        badge: sub.subject_of_lab || (sub.batch_name ? `Batch: ${sub.batch_name}` : undefined),
                        icon: FileText,
                      }))}
                    placeholder="Select Lab Report / File"
                    emptyMessage="No lab reports found. Create one first!"
                  />
                </div>

                {selectedSubmission && (
                  <div className="bg-gray-50/70 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">File Name:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-200">{selectedSubmission.filename || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">Subject:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-200">{selectedSubmission.subject_of_lab || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">Teacher Name:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-200">{selectedSubmission.teacher_name || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">Date:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-200">{selectedSubmission.date_of_lab || 'N/A'}</span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Questions (10 to 15)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[10, 12, 15].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNumQuestions(count)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium border text-center transition-all ${
                          numQuestions === count
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                      >
                        <span className="text-lg font-bold block">{count}</span>
                        <span className="text-xs opacity-80">Questions</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-sm mb-0.5 text-gray-900 dark:text-white">Fresh & Novel Questions Every Single Time</span>
                    Each test generation tracks previously tested topics, questions, and edge cases to guarantee you never get the same test twice.
                  </div>
                </div>

                <button
                  onClick={handleGenerateTest}
                  disabled={loading || !selectedSubId}
                  className="w-full py-3.5 px-6 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all flex items-center justify-center space-x-2 text-base"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-5 h-5" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Past Tests Column */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Previous Tests on this Lab</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                {pastTests.length}
              </span>
            </h3>

            {!selectedSubId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-gray-500 text-sm">
                <Target className="w-8 h-8 mb-2 opacity-50" />
                <p>Select a lab report to view previous tests.</p>
                <p className="text-xs mt-1">Choose a lab file from the dropdown to see its test history.</p>
              </div>
            ) : pastTests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-gray-500 text-sm">
                <Target className="w-8 h-8 mb-2 opacity-50" />
                <p>No previous tests taken for this PDF yet.</p>
                <p className="text-xs mt-1">Generate a test to build your skill history.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                {pastTests.map((t, idx) => {
                  const testNumber = pastTests.length - idx;
                  const displayTitle = t.title || `Test #${testNumber}`;

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-gray-50/60 dark:bg-gray-800/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div 
                        onClick={() => handleViewTestReport(t.id)}
                        className="min-w-0 flex-1 cursor-pointer"
                        title="Click to view test report"
                      >
                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words leading-snug">
                          {displayTitle}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Test #{testNumber} &bull; {t.total_questions} Questions &bull; {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0 self-end sm:self-center">
                        {/* Report Icon Button */}
                        <button
                          onClick={() => handleViewTestReport(t.id)}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          title="View Test Report & Performance Card"
                          aria-label={`View report for ${displayTitle}`}
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Report</span>
                        </button>

                        {/* Retake Button */}
                        <button
                          onClick={() => handleRetakePastTest(t.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
                          title="Retake this test with clean answers"
                        >
                          Retake
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTestTarget(t.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ACTIVE TEST TAKING INTERFACE */}
      {currentTest && !currentAttempt && (
        <div className="space-y-6">
          {/* Progress & Nav Bar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {currentTest.topic || 'Lab Knowledge Check'}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Question {currentQuestionIndex + 1} of {currentTest.questions.length}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {Object.keys(selectedAnswers).length} of {currentTest.questions.length} Answered
                </span>
                <button
                  onClick={handleSubmitTest}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Question Quick-Jump Palette */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              {currentTest.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 bg-blue-600 text-white'
                        : isAnswered
                        ? 'bg-gray-100 dark:bg-gray-800 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/40'
                        : 'bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          {(() => {
            const currentQ = currentTest.questions[currentQuestionIndex];
            if (!currentQ) return null;
            const currentChoice = selectedAnswers[currentQ.id];

            return (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    Concept: {currentQ.concept || 'Theory'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                      currentQ.difficulty === 'hard'
                        ? 'bg-red-50 text-red-700 dark:bg-gray-800 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                        : currentQ.difficulty === 'easy'
                        ? 'bg-green-50 text-green-700 dark:bg-gray-800 dark:text-green-400 border border-green-200 dark:border-green-500/30'
                        : 'bg-yellow-50 text-yellow-700 dark:bg-gray-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30'
                    }`}
                  >
                    {currentQ.difficulty}
                  </span>
                </div>

                <div className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white leading-relaxed">
                  {currentQ.question_text}
                </div>

                {/* Options list */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = currentChoice === optIdx;
                    const letter = ['A', 'B', 'C', 'D'][optIdx];

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3.5 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-gray-800 border-blue-500 ring-2 ring-blue-500/20 text-gray-900 dark:text-white'
                            : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base leading-snug flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex space-x-2">
                    {currentChoice !== undefined && (
                      <button
                        onClick={() => {
                          const updated = { ...selectedAnswers };
                          delete updated[currentQ.id];
                          setSelectedAnswers(updated);
                        }}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600"
                      >
                        Clear
                      </button>
                    )}

                    {currentQuestionIndex < currentTest.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(currentTest.questions.length - 1, prev + 1))}
                        className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitTest}
                        disabled={submitting}
                        className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 shadow-md"
                      >
                        <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. INSTANT RESULTS & STUDENT LEVEL ASSESSMENT */}
      {currentAttempt && (
        <div className="space-y-6">
          {/* Hero Score Card */}
          {(() => {
            const badge = getLevelBadge(currentAttempt.level);
            const BadgeIcon = badge.icon;

            return (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Score circle */}
                  <div className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 border-blue-500/20 bg-gray-50/50 dark:bg-gray-850">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {currentAttempt.percentage}%
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                      {currentAttempt.score} / {currentAttempt.total_questions} Correct
                    </span>
                  </div>

                  {/* Level & Feedback details */}
                  <div className="flex-1 text-center lg:text-left space-y-3">
                    <div className={`inline-flex items-center px-3.5 py-1.5 rounded-full border text-sm font-bold gap-2 ${badge.bg}`}>
                      <BadgeIcon className="w-4 h-4" />
                      <span>{badge.label}</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Evaluation: {currentAttempt.level}
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl">
                      {currentAttempt.feedback}
                    </p>

                    {/* Quick strengths & growth areas */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {currentAttempt.analysis?.strengths?.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                        >
                          ✓ Strong: {s}
                        </span>
                      ))}
                      {currentAttempt.analysis?.weaknesses?.map((w, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-gray-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                        >
                          ▲ Review: {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Call to action buttons */}
                  <div className="flex flex-col gap-3 w-full lg:w-auto">
                    <button
                      onClick={handleGenerateTest}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Another Test</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadSummaryCard}
                      className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all gap-2"
                      title="Download Certificate & Skill Performance Summary Card"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Test Summary</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentAttempt(null);
                        setSelectedAnswers({});
                        setCurrentQuestionIndex(0);
                      }}
                      className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Retake This Test
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Detailed Question Review */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Detailed Solution & Conceptual Explanations
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Review every question to understand the core logic and fix any misconceptions.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                {(['all', 'correct', 'incorrect'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setReviewFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                      reviewFilter === filter
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {currentAttempt.questions
                .filter((q) => {
                  if (reviewFilter === 'correct') return q.is_correct;
                  if (reviewFilter === 'incorrect') return !q.is_correct;
                  return true;
                })
                .map((q) => (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      q.is_correct
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        {q.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                        )}
                        <h4 className="font-semibold text-base text-gray-900 dark:text-white">
                          Question {q.order_index}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {q.concept}
                        </span>
                        <span className="capitalize text-gray-500">{q.difficulty}</span>
                      </div>
                    </div>

                    <p className="text-gray-800 dark:text-gray-200 text-base">{q.question_text}</p>

                    {/* Options list showing right and wrong */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isStudentChoice = q.selected_index === optIdx;
                        const isCorrectAnswer = q.correct_index === optIdx;

                        let style = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
                        if (isCorrectAnswer) {
                          style = 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-medium';
                        } else if (isStudentChoice && !isCorrectAnswer) {
                          style = 'bg-rose-100/70 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-sm flex items-start space-x-2.5 ${style}`}
                          >
                            <span className="font-bold text-xs opacity-70">
                              {['A', 'B', 'C', 'D'][optIdx]}.
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrectAnswer && (
                              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold ml-1">
                                (Correct)
                              </span>
                            )}
                            {isStudentChoice && !isCorrectAnswer && (
                              <span className="text-xs text-rose-700 dark:text-rose-300 font-bold ml-1">
                                (Your Answer)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="mt-3 p-3.5 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-750 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                      <span className="font-semibold block mb-0.5 text-blue-600 dark:text-blue-400">
                        Explanation & Learning Note:
                      </span>
                      {q.explanation}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTestTarget)}
        onClose={() => setDeleteTestTarget(null)}
        onConfirm={handleConfirmDeleteTest}
        title="Delete MCQ Test"
        message="Are you sure you want to delete this MCQ test? All questions, student answers, and test scores will be permanently removed."
        loading={isDeletingTest}
      />
    </div>
  );
}
