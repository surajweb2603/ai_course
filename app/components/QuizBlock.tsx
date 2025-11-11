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

interface QuizState {
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  showResult: boolean;
  score: number;
  answeredQuestions: boolean[];
  showCompletion: boolean;
}

function getInitialState(
  quizStateKey: string | null,
  questionsLength: number
): QuizState {
  if (!quizStateKey) {
    return {
      currentQuestionIndex: 0,
      selectedAnswer: null,
      showResult: false,
      score: 0,
      answeredQuestions: new Array(questionsLength).fill(false),
      showCompletion: false,
    };
  }

  try {
    const saved = localStorage.getItem(quizStateKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      const answeredQuestions =
        parsed.answeredQuestions ||
        new Array(questionsLength).fill(false);
      if (answeredQuestions.length !== questionsLength) {
        return {
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showResult: false,
          score: 0,
          answeredQuestions: new Array(questionsLength).fill(false),
          showCompletion: false,
        };
      }
      return {
        currentQuestionIndex: parsed.currentQuestionIndex || 0,
        selectedAnswer: parsed.selectedAnswer || null,
        showResult: parsed.showResult || false,
        score: parsed.score || 0,
        answeredQuestions,
        showCompletion: parsed.showCompletion || false,
      };
    }
  } catch (error) {
    // Ignore localStorage errors
  }

  return {
    currentQuestionIndex: 0,
    selectedAnswer: null,
    showResult: false,
    score: 0,
    answeredQuestions: new Array(questionsLength).fill(false),
    showCompletion: false,
  };
}

function useQuizState(
  quizStateKey: string | null,
  questionsLength: number
): [
  QuizState,
  React.Dispatch<React.SetStateAction<QuizState>>
] {
  const initialState = getInitialState(quizStateKey, questionsLength);
  const [state, setState] = useState<QuizState>(initialState);

  useEffect(() => {
    if (quizStateKey) {
      localStorage.setItem(quizStateKey, JSON.stringify(state));
    }
  }, [state, quizStateKey]);

  return [state, setState];
}

function useQuizResponses(
  courseId: string | undefined,
  lessonId: string | undefined,
  questionsLength: number,
  quizStateKey: string | null,
  setState: React.Dispatch<React.SetStateAction<QuizState>>
) {
  useEffect(() => {
    if (courseId && lessonId && questionsLength > 0) {
      quiz
        .getResponses(courseId, lessonId)
        .then((response) => {
          if (response.success && response.data && Array.isArray(response.data)) {
            const savedResponses = response.data;
            const answered = new Array(questionsLength).fill(false);
            let totalScore = 0;

            savedResponses.forEach((saved: any) => {
              if (
                saved.questionIndex >= 0 &&
                saved.questionIndex < questionsLength
              ) {
                answered[saved.questionIndex] = true;
                if (saved.isCorrect) {
                  totalScore++;
                }
              }
            });

            if (answered.some((a) => a)) {
              setState((prev) => ({
                ...prev,
                answeredQuestions: answered,
                score: totalScore,
                showCompletion: false,
              }));

              if (quizStateKey) {
                localStorage.setItem(
                  quizStateKey,
                  JSON.stringify({
                    currentQuestionIndex: 0,
                    selectedAnswer: null,
                    showResult: false,
                    score: totalScore,
                    answeredQuestions: answered,
                    showCompletion: false,
                  })
                );
              }
            }
          }
        })
        .catch(() => {
          // Ignore API errors when loading responses
        });
    }
  }, [courseId, lessonId, questionsLength, quizStateKey, setState]);
}

interface QuizProgressBarProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: boolean[];
  score: number;
  isQuizCompleted: boolean;
  onReset: () => void;
}

function QuizProgressBar({
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
  score,
  isQuizCompleted,
  onReset,
}: QuizProgressBarProps) {
  return (
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
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <div className="flex gap-1">
              {answeredQuestions.map((answered, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentQuestionIndex
                      ? 'bg-purple-600'
                      : answered
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
          Score: {score}/{totalQuestions}
        </div>
        {isQuizCompleted && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
          >
            ↻ Requiz
          </button>
        )}
      </div>
    </div>
  );
}

interface QuizOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrectAnswer: boolean;
  showCorrectness: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function QuizOption({
  option,
  index,
  isSelected,
  isCorrectAnswer,
  showCorrectness,
  onSelect,
  disabled,
}: QuizOptionProps) {
  let optionClassName =
    'p-4 rounded-lg border-2 transition-all cursor-pointer text-left w-full ';

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
    optionClassName +=
      'border-gray-200 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50';
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={optionClassName}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
            showCorrectness && isCorrectAnswer
              ? 'border-green-600 bg-green-600 text-white'
              : showCorrectness && isSelected && !isCorrectAnswer
              ? 'border-red-500 bg-red-500 text-white'
              : isSelected && !showCorrectness
              ? 'border-purple-600 bg-purple-600 text-white'
              : 'border-gray-300 bg-white'
          }`}
        >
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
}

interface QuizRationaleProps {
  isCorrect: boolean;
  rationale: string;
}

function QuizRationale({ isCorrect, rationale }: QuizRationaleProps) {
  return (
    <AnimatePresence>
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
              <svg
                className="w-6 h-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h4
              className={`font-semibold mb-2 text-base ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{rationale}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  selectedAnswer: number | null;
  showResult: boolean;
  isLastQuestion: boolean;
  currentQuestionIndex: number;
  onSelectAnswer: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
  onViewCompletion: () => void;
}

function QuizQuestionCard({
  question,
  selectedAnswer,
  showResult,
  isLastQuestion,
  currentQuestionIndex,
  onSelectAnswer,
  onSubmit,
  onNext,
  onPrevious,
  onReset,
  onViewCompletion,
}: QuizQuestionCardProps) {
  const isCorrect = selectedAnswer === question.answerIndex;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {question.stem}
        </h3>

        <div className="space-y-3 mb-6">
          {question.options.map((option, idx) => (
            <QuizOption
              key={idx}
              option={option}
              index={idx}
              isSelected={selectedAnswer === idx}
              isCorrectAnswer={idx === question.answerIndex}
              showCorrectness={showResult}
              onSelect={() => onSelectAnswer(idx)}
              disabled={showResult}
            />
          ))}
        </div>

        {showResult && (
          <QuizRationale
            isCorrect={isCorrect}
            rationale={question.rationale}
          />
        )}

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
          >
            ← Previous
          </button>

          <div className="flex gap-3">
            {!showResult ? (
              <button
                onClick={onSubmit}
                disabled={selectedAnswer === null}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : !isLastQuestion ? (
              <button
                onClick={onNext}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Next Question →
              </button>
            ) : (
              <>
                <button
                  onClick={onViewCompletion}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  View Results →
                </button>
                <button
                  onClick={onReset}
                  className="px-6 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Restart Quiz
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface QuizCompletionProps {
  score: number;
  totalQuestions: number;
  onReset: () => void;
}

function QuizCompletion({
  score,
  totalQuestions,
  onReset,
}: QuizCompletionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 text-center shadow-sm"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <svg
          className="w-8 h-8 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <h3 className="text-2xl font-bold text-gray-900">Quiz Complete! 🎉</h3>
      </div>
      <p className="text-gray-700 text-lg mb-4">
        You scored{' '}
        <span className="text-purple-600 font-bold">
          {score}/{totalQuestions}
        </span>{' '}
        ({Math.round((score / totalQuestions) * 100)}%)
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
      >
        ↻ Requiz
      </button>
    </motion.div>
  );
}

function useQuizHandlers(
  state: QuizState,
  setState: React.Dispatch<React.SetStateAction<QuizState>>,
  questions: QuizQuestion[],
  courseId: string | undefined,
  lessonId: string | undefined,
  moduleOrder: number | undefined,
  lessonOrder: number | undefined,
  quizStateKey: string | null,
  onResponseSaved?: (questionIndex: number, isCorrect: boolean) => void
) {
  const handleSubmit = async () => {
    if (state.selectedAnswer === null) return;

    setState((prev) => ({ ...prev, showResult: true }));

    const isCorrect =
      state.selectedAnswer === questions[state.currentQuestionIndex].answerIndex;
    if (isCorrect && !state.answeredQuestions[state.currentQuestionIndex]) {
      setState((prev) => ({ ...prev, score: prev.score + 1 }));
    }

    const newAnswered = [...state.answeredQuestions];
    newAnswered[state.currentQuestionIndex] = true;
    setState((prev) => ({ ...prev, answeredQuestions: newAnswered }));

    if (
      courseId &&
      lessonId &&
      moduleOrder !== undefined &&
      lessonOrder !== undefined
    ) {
      try {
        await quiz.save({
          courseId,
          lessonId,
          moduleOrder,
          lessonOrder,
          questionIndex: state.currentQuestionIndex,
          selectedAnswerIndex: state.selectedAnswer,
        });

        if (onResponseSaved) {
          onResponseSaved(state.currentQuestionIndex, isCorrect);
        }
      } catch (error) {
        console.error('Failed to save quiz response:', error);
      }
    }
  };

  const handleNext = () => {
    if (state.currentQuestionIndex === questions.length - 1) return;
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      selectedAnswer: null,
      showResult: false,
    }));
  };

  const handlePrevious = () => {
    if (state.currentQuestionIndex === 0) return;
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex - 1,
      selectedAnswer: null,
      showResult: false,
    }));
  };

  const handleReset = () => {
    setState({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      showResult: false,
      score: 0,
      answeredQuestions: new Array(questions.length).fill(false),
      showCompletion: false,
    });

    if (quizStateKey) {
      localStorage.removeItem(quizStateKey);
    }
  };

  const handleViewCompletion = () => {
    setState((prev) => ({ ...prev, showCompletion: true }));
  };

  return { handleSubmit, handleNext, handlePrevious, handleReset, handleViewCompletion };
}

export default function QuizBlock({
  questions,
  courseId,
  lessonId,
  moduleOrder,
  lessonOrder,
  onResponseSaved,
}: QuizBlockProps) {
  const quizStateKey =
    courseId && lessonId ? `quiz-state-${courseId}-${lessonId}` : null;
  const [state, setState] = useQuizState(quizStateKey, questions.length);

  useQuizResponses(
    courseId,
    lessonId,
    questions.length,
    quizStateKey,
    setState
  );

  const { handleSubmit, handleNext, handlePrevious, handleReset, handleViewCompletion } =
    useQuizHandlers(
      state,
      setState,
      questions,
      courseId,
      lessonId,
      moduleOrder,
      lessonOrder,
      quizStateKey,
      onResponseSaved
    );

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No quiz questions available.</p>
      </div>
    );
  }

  const isQuizCompleted = state.answeredQuestions.every((a) => a);
  const currentQuestion = questions[state.currentQuestionIndex];
  const isLastQuestion = state.currentQuestionIndex === questions.length - 1;
  
  // Show completion screen only if quiz is completed AND user has explicitly chosen to view it
  const shouldShowCompletion = isQuizCompleted && state.showCompletion;
  // Show question card if quiz is not completed, OR if we're showing the last question's result
  const shouldShowQuestionCard = !isQuizCompleted || (isLastQuestion && state.showResult && !state.showCompletion);

  return (
    <div className="space-y-6">
      <QuizProgressBar
        currentQuestionIndex={state.currentQuestionIndex}
        totalQuestions={questions.length}
        answeredQuestions={state.answeredQuestions}
        score={state.score}
        isQuizCompleted={isQuizCompleted && state.showCompletion}
        onReset={handleReset}
      />

      {shouldShowQuestionCard && (
        <QuizQuestionCard
          question={currentQuestion}
          selectedAnswer={state.selectedAnswer}
          showResult={state.showResult}
          isLastQuestion={isLastQuestion}
          currentQuestionIndex={state.currentQuestionIndex}
          onSelectAnswer={(index) =>
            setState((prev) => ({ ...prev, selectedAnswer: index }))
          }
          onSubmit={handleSubmit}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onReset={handleReset}
          onViewCompletion={handleViewCompletion}
        />
      )}

      {shouldShowCompletion && (
        <QuizCompletion
          score={state.score}
          totalQuestions={questions.length}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
