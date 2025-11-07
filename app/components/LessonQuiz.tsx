'use client';

import QuizBlock from '@/components/QuizBlock';
import { Target } from 'lucide-react';

interface LessonQuizProps {
  questions: Array<{
    stem: string;
    options: string[];
    answerIndex: number;
    rationale: string;
  }>;
  courseId?: string;
  lessonId: string;
  moduleOrder?: number;
  lessonOrder: number;
}

export function LessonQuiz({
  questions,
  courseId,
  lessonId,
  moduleOrder,
  lessonOrder,
}: LessonQuizProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
        <Target className="w-6 h-6" /> Quiz
      </h3>
      <QuizBlock
        questions={questions}
        courseId={courseId}
        lessonId={lessonId}
        moduleOrder={moduleOrder}
        lessonOrder={lessonOrder}
      />
    </div>
  );
}

