'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

interface Lesson {
  _id: string;
  order: number;
  title: string;
}

interface Module {
  _id: string;
  order: number;
  title: string;
  lessons: Lesson[];
}

interface Course {
  _id: string;
  title: string;
  modules: Module[];
}

interface CourseSidebarProps {
  course: Course;
  courseId: string;
  lessonId: string;
  expandedModules: Set<number>;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  onToggleModule: (moduleOrder: number) => void;
  onNavigate: (path: string) => void;
}

function LessonItem({
  lesson,
  courseId,
  lessonId,
  moduleOrder,
  isCompleted,
  onNavigate,
}: {
  lesson: Lesson;
  courseId: string;
  lessonId: string;
  moduleOrder: number;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  onNavigate: (path: string) => void;
}) {
  const isCurrentLesson = lesson._id === lessonId;
  const lessonCompleted = isCompleted(moduleOrder, lesson.order);

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
        isCurrentLesson
          ? 'bg-purple-100 border border-purple-300'
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onNavigate(`/course/${courseId}/lesson/${lesson._id}`)}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          lessonCompleted
            ? 'bg-green-600'
            : isCurrentLesson
              ? 'bg-purple-600'
              : 'bg-gray-400'
        }`}
      />
      <span
        className={`text-sm ${
          isCurrentLesson ? 'text-purple-600 font-medium' : 'text-gray-600'
        }`}
      >
        {lesson.title}
      </span>
      {lessonCompleted && (
        <svg
          className="w-4 h-4 text-green-600 ml-auto"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}

function ModuleHeader({
  module,
  courseId,
  lessonId,
  onNavigate,
}: {
  module: Module;
  courseId: string;
  lessonId: string;
  onNavigate: (path: string) => void;
}) {
  const isCurrentModule = module.lessons.some((less) => less._id === lessonId);

  return (
    <div
      className={`flex-1 flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
        isCurrentModule
          ? 'bg-purple-100 border border-purple-300'
          : 'hover:bg-gray-50'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        const firstLesson = module.lessons.sort(
          (a, b) => a.order - b.order
        )[0];
        if (firstLesson) {
          onNavigate(`/course/${courseId}/lesson/${firstLesson._id}`);
        }
      }}
    >
      <span className="text-sm font-medium text-gray-900">{module.title}</span>
    </div>
  );
}

function ModuleToggleButton({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`p-2 rounded-lg transition-all ${
        isExpanded
          ? 'bg-gray-100 text-gray-700'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
    >
      <svg
        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}

function ModuleItem({
  module,
  courseId,
  lessonId,
  isExpanded,
  isCompleted,
  onToggleModule,
  onNavigate,
}: {
  module: Module;
  courseId: string;
  lessonId: string;
  isExpanded: boolean;
  isCompleted: (moduleOrder: number, lessonOrder: number) => boolean;
  onToggleModule: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <ModuleHeader
          module={module}
          courseId={courseId}
          lessonId={lessonId}
          onNavigate={onNavigate}
        />
        <ModuleToggleButton isExpanded={isExpanded} onToggle={onToggleModule} />
      </div>

      {isExpanded && (
        <div className="ml-4 mt-2 space-y-1">
          {module.lessons.map((less) => (
            <LessonItem
              key={less._id}
              lesson={less}
              courseId={courseId}
              lessonId={lessonId}
              moduleOrder={module.order}
              isCompleted={isCompleted}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseSidebar({
  course,
  courseId,
  lessonId,
  expandedModules,
  isCompleted,
  onToggleModule,
  onNavigate,
}: CourseSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-24"
    >
      <div
        className="bg-white border border-purple-200 rounded-2xl p-6 mb-6 shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
        onClick={() => onNavigate(`/course/${courseId}`)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold uppercase text-purple-600">
            {course.title}
          </h3>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          {course.modules.map((mod) => (
            <ModuleItem
              key={mod._id}
              module={mod}
              courseId={courseId}
              lessonId={lessonId}
              isExpanded={expandedModules.has(mod.order)}
              isCompleted={isCompleted}
              onToggleModule={() => onToggleModule(mod.order)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
