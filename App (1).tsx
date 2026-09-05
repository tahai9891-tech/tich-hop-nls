import React, { useState, useEffect } from 'react';
import { generateMathProblem, MathProblem } from './services/geminiService';
import { BookOpen, Calculator, CheckCircle2, ChevronRight, HelpCircle, Lightbulb, Loader2, RefreshCw, Trophy, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const GRADES = ['6', '7', '8', '9'];
const TOPICS = ['Đại số / Số học', 'Hình học', 'Thống kê & Xác suất'];

export default function App() {
  const [grade, setGrade] = useState<string>('6');
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const fetchProblem = async () => {
    setLoading(true);
    setError(null);
    setProblem(null);
    setUserAnswer('');
    setIsCorrect(null);
    setShowExplanation(false);
    
    try {
      const newProblem = await generateMathProblem(grade, topic);
      setProblem(newProblem);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo bài tập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial problem when grade or topic changes
  useEffect(() => {
    fetchProblem();
  }, [grade, topic]);

  const handleCheckAnswer = () => {
    if (!problem || !userAnswer.trim()) return;
    
    let correct = false;
    if (problem.type === 'multiple_choice') {
      // Extract the letter from user answer (e.g., "A", "A.", "A. 123")
      const userLetter = userAnswer.trim().charAt(0).toUpperCase();
      const correctLetter = problem.correctAnswer.trim().charAt(0).toUpperCase();
      correct = userLetter === correctLetter;
    } else {
      // For short answer, do a simple string comparison (ignoring spaces and case)
      // In a real app, we might want to use Gemini to evaluate equivalence
      const normalizedUser = userAnswer.replace(/\s+/g, '').toLowerCase();
      const normalizedCorrect = problem.correctAnswer.replace(/\s+/g, '').toLowerCase();
      correct = normalizedUser === normalizedCorrect;
    }

    setIsCorrect(correct);
    setShowExplanation(true);
    setTotalAttempted(prev => prev + 1);
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const MarkdownRenderer = ({ content }: { content: string }) => (
    <div className="markdown-body text-base leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Calculator size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Toán THCS AI</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
              <Trophy size={16} />
              <span>{score} / {totalAttempted}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Configuration */}
        <aside className="lg:w-64 shrink-0 space-y-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen size={16} />
              Chọn Lớp
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {GRADES.map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 border",
                    grade === g 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50"
                  )}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lightbulb size={16} />
              Chủ Đề
            </h2>
            <div className="flex flex-col gap-2">
              {TOPICS.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border text-left",
                    topic === t 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Problem Header */}
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-medium text-slate-700 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide">
                  LỚP {grade}
                </span>
                <span className="text-slate-400">•</span>
                <span>{topic}</span>
              </h2>
              <button 
                onClick={fetchProblem}
                disabled={loading}
                className="text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50 disabled:opacity-50"
                title="Tạo bài mới"
              >
                <RefreshCw size={18} className={cn(loading && "animate-spin")} />
              </button>
            </div>

            {/* Problem Content */}
            <div className="p-6 sm:p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                  <p className="text-sm font-medium animate-pulse">Đang tạo bài tập phù hợp...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                  <XCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm">{error}</p>
                </div>
              ) : problem ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Question */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <HelpCircle size={20} className="text-indigo-500" />
                      Câu hỏi:
                    </h3>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800">
                      <MarkdownRenderer content={problem.question} />
                    </div>
                  </div>

                  {/* Options (if multiple choice) */}
                  {problem.type === 'multiple_choice' && problem.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {problem.options.map((opt, idx) => {
                        const letter = opt.trim().charAt(0).toUpperCase();
                        const isSelected = userAnswer.toUpperCase() === letter;
                        return (
                          <button
                            key={idx}
                            onClick={() => !showExplanation && setUserAnswer(letter)}
                            disabled={showExplanation}
                            className={cn(
                              "text-left p-4 rounded-xl border transition-all duration-200",
                              showExplanation 
                                ? (letter === problem.correctAnswer.charAt(0).toUpperCase()
                                    ? "bg-green-50 border-green-200 ring-1 ring-green-500"
                                    : isSelected 
                                      ? "bg-red-50 border-red-200 ring-1 ring-red-500 opacity-70"
                                      : "bg-white border-slate-200 opacity-50")
                                : (isSelected 
                                    ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500" 
                                    : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50")
                            )}
                          >
                            <MarkdownRenderer content={opt} />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer Input */}
                  {problem.type === 'short_answer' && (
                    <div className="max-w-md">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nhập đáp án của bạn:
                      </label>
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={showExplanation}
                        placeholder="Ví dụ: x = 5, 120, ..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !showExplanation) {
                            handleCheckAnswer();
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  {!showExplanation ? (
                    <button
                      onClick={handleCheckAnswer}
                      disabled={!userAnswer.trim()}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Kiểm tra đáp án
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={fetchProblem}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 focus:ring-4 focus:ring-slate-100 transition-all"
                    >
                      Bài tiếp theo
                      <ChevronRight size={18} />
                    </button>
                  )}

                  {/* Feedback & Explanation */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 border-t border-slate-100 mt-6">
                          <div className={cn(
                            "p-4 rounded-xl mb-6 flex items-start gap-3 border",
                            isCorrect 
                              ? "bg-green-50 border-green-200 text-green-800" 
                              : "bg-red-50 border-red-200 text-red-800"
                          )}>
                            {isCorrect ? (
                              <CheckCircle2 className="shrink-0 mt-0.5 text-green-600" size={20} />
                            ) : (
                              <XCircle className="shrink-0 mt-0.5 text-red-600" size={20} />
                            )}
                            <div>
                              <p className="font-semibold">
                                {isCorrect ? 'Chính xác! Làm tốt lắm.' : 'Chưa chính xác.'}
                              </p>
                              {!isCorrect && (
                                <p className="text-sm mt-1 opacity-90">
                                  Đáp án đúng là: <strong className="font-bold">{problem.correctAnswer}</strong>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Lightbulb size={18} />
                              Hướng dẫn giải
                            </h3>
                            <div className="text-slate-700">
                              <MarkdownRenderer content={problem.explanation} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
