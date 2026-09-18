import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  FileText,
  Calendar,
  CheckCircle,
  HelpCircle,
  Award,
  BookOpen,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Printer,
  FileDown,
  Eye,
  X,
} from 'lucide-react';
import { CurriculumPlan, DiagnosticQuizItem, ExportPreviewPayload } from '../types';
import { exportStudyPlanToCSV, exportStudyPlanToPDF } from '../utils/exportFiles';
import { ExportPreviewModal } from './ExportPreviewModal';
import { recordCurriculumScanned, recordExamCompleted } from '../utils/gamification';

interface CurriculumScannerProps {
  userId?: string;
  onPlanCreated?: (plan: CurriculumPlan) => void;
}

// Preloaded sample curriculum images as high-quality SVGs converted to data URLs for instant 1-click test
const SAMPLE_CURRICULUM = {
  title: 'Calculus BC & Pre-Calculus Table of Contents',
  grade: 'Grade 11 - 12 (AP/Advanced)',
  book: 'Stewart Calculus Early Transcendentals',
  // SVG text representation that OCR can easily analyze
  svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="50" y="80" font-family="sans-serif" font-size="26" font-weight="bold" fill="#1e3a8a">SYLLABUS &amp; CURRICULUM: AP CALCULUS BC</text>
    <text x="50" y="120" font-family="sans-serif" font-size="16" fill="#4b5563">Textbook: James Stewart 9th Edition | Term: Academic Year</text>
    <line x1="50" y1="140" x2="750" y2="140" stroke="#cbd5e1" stroke-width="2"/>
    <text x="50" y="180" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0f172a">UNIT 1: Limits &amp; Continuity (Weeks 1-3)</text>
    <text x="70" y="210" font-family="sans-serif" font-size="14" fill="#334155">• 1.1 Intuitive limit definitions &amp; One-sided limits</text>
    <text x="70" y="235" font-family="sans-serif" font-size="14" fill="#334155">• 1.2 Algebraic limit evaluation (L'Hopital's Rule, Squeeze Theorem)</text>
    <text x="70" y="260" font-family="sans-serif" font-size="14" fill="#334155">• 1.3 Intermediate Value Theorem (IVT) and discontinuity classification</text>
    <text x="50" y="310" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0f172a">UNIT 2: Differentiation &amp; Chain Rule (Weeks 4-7)</text>
    <text x="70" y="340" font-family="sans-serif" font-size="14" fill="#334155">• 2.1 Definition of the derivative as a limit of difference quotient</text>
    <text x="70" y="365" font-family="sans-serif" font-size="14" fill="#334155">• 2.2 Product, Quotient, and generalized Power rules</text>
    <text x="70" y="390" font-family="sans-serif" font-size="14" fill="#334155">• 2.3 Implicit differentiation and related rates</text>
    <text x="50" y="440" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0f172a">UNIT 3: Integration &amp; Applications (Weeks 8-12)</text>
    <text x="70" y="470" font-family="sans-serif" font-size="14" fill="#334155">• 3.1 Riemann sums and definite integral foundations</text>
    <text x="70" y="495" font-family="sans-serif" font-size="14" fill="#334155">• 3.2 Fundamental Theorem of Calculus (FTC Parts 1 &amp; 2)</text>
    <text x="70" y="520" font-family="sans-serif" font-size="14" fill="#334155">• 3.3 Integration by Parts and Partial Fractions decomposition</text>
    <text x="50" y="570" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0f172a">UNIT 4: Infinite Sequences &amp; Taylor Series (Weeks 13-16)</text>
    <text x="70" y="600" font-family="sans-serif" font-size="14" fill="#334155">• 4.1 Convergence tests (Ratio, Root, Integral, Comparison)</text>
    <text x="70" y="625" font-family="sans-serif" font-size="14" fill="#334155">• 4.2 Maclaurin &amp; Taylor polynomials, Lagrange error bound</text>
    <rect x="50" y="660" width="700" height="80" rx="10" fill="#f1f5f9" stroke="#94a3b8"/>
    <text x="70" y="695" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e293b">ASSESSMENT CRITERIA &amp; BENCHMARKS:</text>
    <text x="70" y="720" font-family="sans-serif" font-size="13" fill="#475569">Weekly mini-exams, mastery checkpoints, formula application test out of 10 questions.</text>
  </svg>`,
};

export const CurriculumScanner: React.FC<CurriculumScannerProps> = ({ userId, onPlanCreated }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form metadata
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('Grade 11 (High School)');
  const [book, setBook] = useState('Standard Curriculum');

  // Result state
  const [planResult, setPlanResult] = useState<CurriculumPlan | null>(null);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [computedScore, setComputedScore] = useState<number | null>(null);

  // Export Preview Modal state
  const [previewPayload, setPreviewPayload] = useState<ExportPreviewPayload | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleOpenPlanPreview = (plan: CurriculumPlan) => {
    setPreviewPayload({
      type: 'study_plan',
      title: `${plan.curriculumTitle} Study Plan`,
      studyPlan: plan,
      filenameBase: `${plan.curriculumTitle.toLowerCase().replace(/\W+/g, '_')}_study_plan`,
    });
    setIsPreviewModalOpen(true);
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera start/stop
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setError('Camera access could not be initialized. You can upload an image file instead.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      setImageMime('image/jpeg');
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const loadSampleCurriculum = () => {
    // Convert sample SVG to base64 Data URL
    const encoded = 'data:image/svg+xml;base64,' + btoa(SAMPLE_CURRICULUM.svgContent);
    setSelectedImage(encoded);
    setImageMime('image/svg+xml');
    setSchool('Westwood Academy');
    setGrade(SAMPLE_CURRICULUM.grade);
    setBook(SAMPLE_CURRICULUM.book);
  };

  const handleProcessOCR = async () => {
    if (!selectedImage) {
      setError('Please take a picture or upload a curriculum photo first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPlanResult(null);
    setQuizSubmitted(false);
    setUserQuizAnswers({});
    setComputedScore(null);

    try {
      // Extract pure base64
      const base64Data = selectedImage.split(',')[1];
      const response = await fetch('/api/ocr-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: imageMime,
          schoolInfo: { school, grade, book },
          userId: userId || 'guest',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process curriculum image.');
      }

      setPlanResult(data.plan);
      recordCurriculumScanned();
      if (onPlanCreated) {
        onPlanCreated(data.plan);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process curriculum OCR. Please try a clearer picture.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectQuizOption = (questionId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setUserQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = () => {
    if (!planResult) return;
    let correct = 0;
    planResult.diagnosticQuiz.forEach((q) => {
      if (userQuizAnswers[q.id] === q.correctAnswerIndex) {
        correct++;
      }
    });
    setComputedScore(correct);
    setQuizSubmitted(true);
    recordExamCompleted(correct, 10);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Curriculum OCR Scanner &amp; 10-Question Student Course Plan
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Snap a picture of your textbook syllabus or curriculum. Our Gemini OCR extracts the topics, administers a
          10-question diagnostic exam, and generates a personalized 4-week course based on your score out of 10.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Camera / Upload input and metadata */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Step 1: Capture or Upload Syllabus Photo</span>
            </h2>

            {/* Live Camera View or Preview */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 aspect-[4/3] flex items-center justify-center">
              {isCameraActive ? (
                <div className="relative h-full w-full">
                  <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                  <button
                    onClick={captureSnapshot}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-zinc-900 shadow-xl hover:bg-zinc-100 cursor-pointer"
                  >
                    <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              ) : selectedImage ? (
                <div className="relative h-full w-full">
                  <img src={selectedImage} alt="Curriculum preview" className="h-full w-full object-contain p-2" />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black cursor-pointer"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-300">Take a picture or drop curriculum image</div>
                    <div className="text-[11px] text-zinc-500">Supports JPG, PNG, HEIC &amp; SVG documents</div>
                  </div>
                </div>
              )}
            </div>

            {/* Capture controls */}
            <div className="flex flex-wrap gap-2">
              {!isCameraActive ? (
                <button
                  id="btn-start-camera"
                  onClick={startCamera}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5 text-blue-600" />
                  <span>Open Camera</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                >
                  <span>Close Camera</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                id="btn-upload-curriculum-file"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-600" />
                <span>Upload Photo</span>
              </button>
              <button
                id="btn-load-sample-curriculum"
                onClick={loadSampleCurriculum}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Load Sample Syllabus</span>
              </button>
            </div>

            {/* Curriculum Metadata Details */}
            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Curriculum Context</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-500">School / District</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Westwood Academy / AP Board"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500">Grade Level</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500">Textbook / Edition</label>
                <input
                  type="text"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  placeholder="e.g. Stewart Calculus 9e or Pearson"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Run OCR & Plan Action */}
            <button
              id="btn-process-ocr-curriculum"
              onClick={handleProcessOCR}
              disabled={!selectedImage || isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Extracting OCR &amp; Generating 10-Question Test...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Analyze with OCR &amp; Create Student Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: OCR Extraction, 10-Question Quiz, and Adaptive Plan */}
        <div className="lg:col-span-7 space-y-6">
          {planResult ? (
            <div className="space-y-6">
              {/* OCR Extracted Header Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      OCR Extracted Successfully
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {planResult.curriculumTitle}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {planResult.subject} &bull; {planResult.gradeLevel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-preview-studyplan"
                      onClick={() => handleOpenPlanPreview(planResult)}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 cursor-pointer"
                      title="Preview Curriculum Study Plan in PDF and CSV format before downloading"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                      <span>Preview</span>
                    </button>
                    <button
                      id="btn-export-studyplan-pdf"
                      onClick={() => exportStudyPlanToPDF(planResult)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      title="Export Curriculum Study Plan to PDF"
                    >
                      <Printer className="h-3.5 w-3.5 text-blue-600" />
                      <span>PDF</span>
                    </button>
                    <button
                      id="btn-export-studyplan-csv"
                      onClick={() => exportStudyPlanToCSV(planResult)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      title="Export Curriculum Study Plan to CSV"
                    >
                      <FileDown className="h-3.5 w-3.5 text-emerald-600" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Key Units extracted */}
                <div className="mt-3">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Recognized Core Units
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {planResult.keyUnits.map((u, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Collapsible raw OCR text */}
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-400">
                    View Raw OCR Transcript
                  </summary>
                  <pre className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-2.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                    {planResult.ocrText}
                  </pre>
                </details>
              </div>

              {/* 10-Question Diagnostic Assessment */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                      <span>10-Question Curriculum Diagnostic Test</span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Answer these 10 targeted questions to evaluate your readiness for this curriculum.
                    </p>
                  </div>
                  {computedScore !== null && (
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-white">
                      <Award className="h-4 w-4" />
                      <span className="text-sm font-bold">
                        Score: {computedScore} / 10
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {planResult.diagnosticQuiz.map((q, qIndex) => {
                    const selected = userQuizAnswers[q.id];
                    const isAnswered = selected !== undefined;
                    const isCorrect = isAnswered && selected === q.correctAnswerIndex;
                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border p-4 transition-all ${
                          quizSubmitted
                            ? isCorrect
                              ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                              : 'border-red-200 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20'
                            : 'border-zinc-200/80 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Q{qIndex + 1}
                          </span>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-zinc-500 mb-0.5">{q.topic}</div>
                            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2.5">
                              {q.question}
                            </h4>
                            {/* Options */}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {q.options.map((opt, optIdx) => {
                                const isThisSelected = selected === optIdx;
                                const isThisCorrect = q.correctAnswerIndex === optIdx;
                                let btnStyle =
                                  'border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';
                                if (quizSubmitted) {
                                  if (isThisCorrect) {
                                    btnStyle =
                                      'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 font-semibold';
                                  } else if (isThisSelected && !isThisCorrect) {
                                    btnStyle =
                                      'border-red-500 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 line-through';
                                  }
                                } else if (isThisSelected) {
                                  btnStyle =
                                    'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200 font-medium';
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleSelectQuizOption(q.id, optIdx)}
                                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all ${btnStyle} cursor-pointer`}
                                  >
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {/* Explanation when submitted */}
                            {quizSubmitted && (
                              <div className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 pt-2 border-t border-zinc-200/50">
                                <strong>Explanation:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(userQuizAnswers).length < 5}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      Submit Diagnostic Answers ({Object.keys(userQuizAnswers).length}/10 answered)
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs">
                      Score: <strong>{computedScore}/10</strong> &bull;{' '}
                      {computedScore! >= 8
                        ? 'Advanced Mastery - Ready for accelerated modules'
                        : computedScore! >= 5
                        ? 'Intermediate - Foundational plan recommended'
                        : 'Requires Comprehensive Prerequisite Review'}
                    </div>
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setUserQuizAnswers({});
                        setComputedScore(null);
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                    >
                      Retake Quiz
                    </button>
                  </div>
                )}
              </div>

              {/* 4-Week Adaptive Student Course Plan */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>Adaptive 4-Week Student Course Plan</span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Personalized progression curriculum calibrated to your score out of 10.
                    </p>
                  </div>
                  <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    4-Week Timeline
                  </span>
                </div>

                <div className="space-y-4">
                  {planResult.suggestedWeeklyPlan.map((week) => (
                    <div
                      key={week.week}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                            Week {week.week}
                          </span>
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {week.theme}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                        <div>
                          <div className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Weekly Goals:</div>
                          <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                            {week.goals.map((g, gi) => (
                              <li key={gi}>{g}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Recommended Exercises:
                          </div>
                          <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                            {week.recommendedExercises.map((e, ei) => (
                              <li key={ei} className="font-mono text-[11px]">
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Awaiting Curriculum Image
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                Take a photo or click &ldquo;Load Sample Syllabus&rdquo; on the left to start OCR analysis and generate
                your 10-question evaluation plan.
              </p>
              <button
                onClick={loadSampleCurriculum}
                className="mt-4 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 cursor-pointer"
              >
                Try With Pre-configured Sample Syllabus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Preview Modal for Study Plan */}
      <ExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        payload={previewPayload}
      />
    </div>
  );
};
