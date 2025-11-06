'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quiz } from '@/lib/api';

interface QuizQuestion {
  stem: string;
  options: string[];
  answerIndex: number;
  rationale: string;
}

interface QuizBlockProps {
  questions: QuizQuestion[];
  courseId?: string;
  lessonId?: string;
  moduleOrder?: number;
  lessonOrder?: number;
  onResponseSaved?: (questionIndex: number, isCorrect: boolean) => void;
}

export default function QuizBlock({ 
  questions, 
  courseId, 
  lessonId, 
  moduleOrder, 
  lessonOrder,
  onResponseSaved 
}: QuizBlockProps) {
  // Generate a unique key for localStorage based on course and lesson
  const quizStateKey = courseId && lessonId ? `quiz-state-${courseId}-${lessonId}` : null;

  // Initialize state from localStorage if available
  const getInitialState = () => {
    if (!quizStateKey) {
      return {
        currentQuestionIndex: 0,
        selectedAnswer: null as number | null,
        showResult: false,
        score: 0,
        answeredQuestions: new Array(questions.length).fill(false) as boolean[],
      };
    }

    try {
      const saved = localStorage.getItem(quizStateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure the state matches current questions length
        const answeredQuestions = parsed.answeredQuestions || new Array(questions.length).fill(false);
        if (answeredQuestions.length !== questions.length) {
          // Reset if questions changed
          return {
            currentQuestionIndex: 0,
            selectedAnswer: null,
            showResult: false,
            score: 0,
            answeredQuestions: new Array(questions.length).fill(false),
          };
        }
        return {
          currentQuestionIndex: parsed.currentQuestionIndex || 0,
          selectedAnswer: parsed.selectedAnswer || null,
          showResult: parsed.showResult || false,
          score: parsed.score || 0,
          answeredQuestions,
        };
      }
    } catch (error) {
    }

    return {
      currentQuestionIndex: 0,
      selectedAnswer: null as number | null,
      showResult: false,
      score: 0,
      answeredQuestions: new Array(questions.length).fill(false) as boolean[],
    };
  };

  const initialState = getInitialState();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialState.currentQuestionIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(initialState.selectedAnswer);
  const [showResult, setShowResult] = useState(initialState.showResult);
  const [score, setScore] = useState(initialState.score);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(initialState.answeredQuestions);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved quiz responses from API on mount
  useEffect(() => {
    if (courseId && lessonId && questions.length > 0) {
      setIsLoading(true);
      quiz.getResponses(courseId, lessonId)
        .then((response) => {
          if (response.success && response.data && Array.isArray(response.data)) {
            const savedResponses = response.data;
            const answered = new Array(questions.length).fill(false);
            let totalScore = 0;

            savedResponses.forEach((saved: any) => {
              if (saved.questionIndex >= 0 && saved.questionIndex < questions.length) {
                answered[saved.questionIndex] = true;
                if (saved.isCorrect) {
                  totalScore++;
                }
              }
            });

            // Only update if we have saved responses
            if (answered.some(a => a)) {
              setAnsweredQuestions(answered);
              setScore(totalScore);

              // Save to localStorage
              if (quizStateKey) {
                localStorage.setItem(quizStateKey, JSON.stringify({
                  currentQuestionIndex: currentQuestionIndex,
                  selectedAnswer: null,
                  showResult: false,
                  score: totalScore,
                  answeredQuestions: answered,
                }));
              }
            }
          }
        })
        .catch((error) => {
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId, questions.length]); // Only run on mount or when lesson changes

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (quizStateKey) {
      localStorage.setItem(quizStateKey, JSON.stringify({
        currentQuestionIndex,
        selectedAnswer,
        showResult,
        score,
        answeredQuestions,
      }));
    }
  }, [currentQuestionIndex, selectedAnswer, showResult, score, answeredQuestions, quizStateKey]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isCorrect = selectedAnswer === currentQuestion.answerIndex;

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    
    if (isCorrect && !answeredQuestions[currentQuestionIndex]) {
      setScore(score + 1);
    }
    
    const newAnswered = [...answeredQuestions];
    newAnswered[currentQuestionIndex] = true;
    setAnsweredQuestions(newAnswered);

    // Save quiz response if course/lesson info is provided
    if (courseId && lessonId && moduleOrder !== undefined && lessonOrder !== undefined) {
      try {
        await quiz.save({
          courseId,
          lessonId,
          moduleOrder,
          lessonOrder,
          questionIndex: currentQuestionIndex,
          selectedAnswerIndex: selectedAnswer,
        });
        
        // Call callback if provided
        if (onResponseSaved) {
          onResponseSaved(currentQuestionIndex, isCorrect);
        }
      } catch (error) {
        // Don't block UI if save fails - just log the error
      }
    }
  };

  const handleNext = () => {
    if (isLastQuestion) return;
    
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex === 0) return;
    
    setCurrentQuestionIndex(currentQuestionIndex - 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredQuestions(new Array(questions.length).fill(false));
    
    // Clear localStorage
    if (quizStateKey) {
      localStorage.removeItem(quizStateKey);
    }
    
    // Optionally clear saved responses from backend (if you want to allow users to retake)
    // For now, we'll just reset the local state and let them retake
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No quiz questions available.</p>
      </div>
    );
  }

  const isQuizCompleted = answeredQuestions.every(a => a);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isQuizCompleted ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full text-sm font-semibold">
                ✓ Completed
              </span>
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-600 font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx === currentQuestionIndex
                        ? 'bg-purple-600'
                        : answeredQuestions[idx]
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 font-medium">
            Score: {score}/{questions.length}
          </div>
          {isQuizCompleted && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              ↻ Requiz
            </button>
          )}
        </div>
      </div>

      {/* Question Card - Only show if quiz is not completed */}
      {!isQuizCompleted && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
          {/* Question Stem */}
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.stem}
          </h3>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectAnswer = idx === currentQuestion.answerIndex;
              const showCorrectness = showResult;

              let optionClassName = 'p-4 rounded-lg border-2 transition-all cursor-pointer text-left w-full ';
              
              if (showCorrectness) {
                if (isCorrectAnswer) {
                  optionClassName += 'border-green-600 bg-green-50 text-green-900';
                } else if (isSelected && !isCorrectAnswer) {
                  optionClassName += 'border-red-500 bg-red-50 text-red-900';
                } else {
                  optionClassName += 'border-gray-200 bg-gray-50 text-gray-700';
                }
              } else if (isSelected) {
                optionClassName += 'border-purple-600 bg-purple-50 text-gray-900';
              } else {
                optionClassName += 'border-gray-200 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !showResult && setSelectedAnswer(idx)}
                  disabled={showResult}
                  className={optionClassName}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      showCorrectness && isCorrectAnswer
                        ? 'border-green-600 bg-green-600 text-white'
                        : showCorrectness && isSelected && !isCorrectAnswer
                        ? 'border-red-500 bg-red-500 text-white'
                        : isSelected && !showCorrectness
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {showCorrectness && isCorrectAnswer && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {showCorrectness && isSelected && !isCorrectAnswer && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {!showCorrectness && isSelected && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="flex-1 leading-relaxed">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rationale (shown after submission) */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isCorrect ? (
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-2 text-base ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{currentQuestion.rationale}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              {!showResult ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              ) : !isLastQuestion ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Restart Quiz
                </button>
              )}
            </div>
          </div>
        </motion.div>
        </AnimatePresence>
      )}

      {/* Final Score (shown when all questions answered) */}
      {isQuizCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 text-center shadow-sm"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">
              Quiz Complete! 🎉
            </h3>
          </div>
          <p className="text-gray-700 text-lg mb-4">
            You scored{' '}
            <span className="text-purple-600 font-bold">
              {score}/{questions.length}
            </span>
            {' '}({Math.round((score / questions.length) * 100)}%)
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            ↻ Requiz
          </button>
        </motion.div>
      )}
    </div>
  );
}

