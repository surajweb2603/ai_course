'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { dashboard, courses as coursesApi, progress as progressApi } from '@/lib/api';
import CourseCard from '@/components/CourseCard';
import WeeklyActivityChart from '@/components/charts/WeeklyActivityChart';
import CourseProgressChart from '@/components/charts/CourseProgressChart';
import LearningTimeChart from '@/components/charts/LearningTimeChart';
import AchievementChart from '@/components/charts/AchievementChart';
import {
  BookOpen,
  Clock,
  Target,
  Trophy,
  Sparkles,
  BookText,
  BarChart3,
  Shield,
  Mail,
  Zap,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface DashboardStats {
  coursesCreated: number;
  learningTime: string;
  learningTimeMinutes: number;
  completionRate: number;
  achievements: number;
}

interface OldCourse {
  id: string;
  title: string;
  description?: string;
  progress: number;
  lessonsCount: number;
  estimatedTime: string;
  estimatedTimeMinutes: number;
  category: string;
  status: string;
}

interface NewCourse {
  _id: string;
  title: string;
  language: string;
  visibility: 'private' | 'unlisted' | 'public';
  createdAt: string;
  updatedAt: string;
  percent?: number;
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        <p className="mt-4 text-gray-700 text-lg font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    React: 'from-blue-500 to-cyan-500',
    TypeScript: 'from-purple-500 to-pink-500',
    'Node.js': 'from-green-500 to-emerald-500',
    Design: 'from-orange-500 to-red-500',
    Python: 'from-yellow-500 to-orange-500',
    GraphQL: 'from-indigo-500 to-purple-500',
    General: 'from-gray-500 to-gray-600',
  };
  return colors[category] || colors['General'];
}

function useDashboardData(user: any) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [oldCourses, setOldCourses] = useState<OldCourse[]>([]);
  const [newCourses, setNewCourses] = useState<NewCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, oldCoursesResponse, newCoursesResponse] = await Promise.all([
          dashboard.getStats(),
          dashboard.getCourses(),
          coursesApi.list(),
        ]);

        setStats(statsResponse.stats);
        setOldCourses(oldCoursesResponse.courses);

        const coursesWithProgress = await Promise.all(
          newCoursesResponse.map(async (course: NewCourse) => {
            try {
              const progressResponse = await progressApi.get(course._id);
              return {
                ...course,
                percent: progressResponse.data.percent,
              };
            } catch (error) {
              console.warn(`Failed to fetch progress for course ${course._id}:`, error);
              return {
                ...course,
                percent: 0,
              };
            }
          })
        );

        setNewCourses(coursesWithProgress);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return { stats, oldCourses, newCourses, loading };
}

interface WelcomeHeaderProps {
  userName: string;
}

function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 sm:mb-12 text-center lg:text-left"
    >
      <motion.div
        className="inline-block mb-3 sm:mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200/50 shadow-sm backdrop-blur-sm text-xs tracking-widest text-purple-600 font-semibold uppercase">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
          </motion.div>
          DASHBOARD
        </span>
      </motion.div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] sm:leading-tight tracking-tight mb-3 sm:mb-4">
        Welcome back,{' '}
        <span className="relative inline-block italic font-light bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent px-2 -mx-1">
          {userName}
        </span>
      </h1>
      <p className="text-gray-600 text-base sm:text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
        Manage your AI-generated courses, track your progress, and unlock the power of personalized
        learning.
      </p>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  badge?: string;
}

function StatCard({ icon: Icon, value, label, badge }: StatCardProps) {
  return (
    <motion.div
      className="group relative bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-all duration-300 hover:border-purple-300 hover:shadow-lg hover:-translate-y-2 shadow-sm"
      whileHover={{ scale: 1.03, y: -8 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-purple-100 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          {badge && (
            <span className="px-2.5 py-1 text-xs font-semibold text-pink-700 bg-pink-100 rounded-lg border border-pink-200">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-blue-700 transition-colors">
          {value}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

interface StatsGridProps {
  stats: DashboardStats;
  userPlan: string;
}

function StatsGrid({ stats, userPlan }: StatsGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12"
    >
      <StatCard icon={BookOpen} value={stats.coursesCreated} label="Courses Created" />
      <StatCard icon={Clock} value={stats.learningTime} label="Learning Time" />
      <StatCard icon={Target} value={`${stats.completionRate}%`} label="Completion Rate" />
      <StatCard
        icon={Trophy}
        value={stats.achievements}
        label="Achievements"
        badge={userPlan.toUpperCase()}
      />
    </motion.div>
  );
}

interface TabNavigationProps {
  activeTab: 'overview' | 'courses' | 'analytics';
  onTabChange: (tab: 'overview' | 'courses' | 'analytics') => void;
  totalCourses: number;
}

function TabNavigation({ activeTab, onTabChange, totalCourses }: TabNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-6 sm:mb-8 overflow-x-auto"
    >
      <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-2 inline-flex min-w-full sm:min-w-0 shadow-sm">
        {(['overview', 'courses', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap relative ${
              activeTab === tab
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/40'
                : 'text-gray-600 hover:bg-purple-50'
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">
              {tab === 'overview'
                ? 'Overview'
                : tab === 'courses'
                ? `My Courses (${totalCourses})`
                : 'Analytics'}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

interface QuickActionsProps {
  onCreateCourse: () => void;
  onViewCourses: () => void;
  totalCourses: number;
}

function QuickActions({ onCreateCourse, onViewCourses, totalCourses }: QuickActionsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: '0 25px 50px rgba(139, 92, 246, 0.4)',
            transition: { duration: 0.3 },
          }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateCourse}
          className="group relative flex items-center gap-3 rounded-xl p-4 sm:p-6 text-left overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="relative z-10 flex-1">
            <div className="mb-2 sm:mb-3 inline-flex p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
              Create New Course
            </h3>
            <p className="text-white/90 text-xs sm:text-sm">Generate AI-powered courses instantly</p>
          </div>
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300 relative z-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={onViewCourses}
          className="group relative rounded-xl p-4 sm:p-6 text-left transition-all duration-300 bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg shadow-sm"
        >
          <div className="mb-2 sm:mb-3 inline-flex p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
            <BookText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-700" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-gray-900 group-hover:text-purple-600 transition-colors">
            Browse Library
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
            View your {totalCourses} courses
          </p>
          <svg
            className="w-4 h-4 absolute bottom-4 right-4 transform group-hover:translate-x-1 transition-transform duration-300 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

interface RecentCoursesProps {
  courses: NewCourse[];
  onViewAll: () => void;
}

function RecentCourses({ courses, onViewAll }: RecentCoursesProps) {
  if (courses.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Recent Courses
            </h2>
          </div>
          <p className="text-gray-600 text-sm font-medium">Continue your learning journey</p>
        </div>
        {courses.length > 4 && (
          <button
            onClick={onViewAll}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {courses.slice(0, 4).map((course, index) => (
          <motion.div
            key={course._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <CourseCard {...course} percent={course.percent || 0} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface LegacyCoursesProps {
  courses: OldCourse[];
}

function LegacyCourses({ courses }: LegacyCoursesProps) {
  if (courses.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Legacy Courses</h2>
      <div className="space-y-4">
        {courses.slice(0, 4).map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-all duration-300 border border-gray-200"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100">
                <BookOpen className="w-5 h-5 text-purple-700" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium mb-1">{course.title}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span>{course.lessonsCount} lessons</span>
                <span>•</span>
                <span>{course.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-700"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <span className="text-purple-600 text-sm font-semibold">{course.progress}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  onCreateCourse: () => void;
}

function EmptyState({ onCreateCourse }: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
      <motion.div
        className="mb-4 flex justify-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
          <BookOpen className="w-16 h-16 text-purple-700" />
        </div>
      </motion.div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
        No Courses Yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto font-medium">
        Start your learning journey by creating your first AI-powered course!
      </p>
      <motion.button
        whileHover={{
          scale: 1.08,
          boxShadow: '0 25px 50px rgba(139, 92, 246, 0.4)',
          transition: { duration: 0.3 },
        }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateCourse}
        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
      >
        <Sparkles className="w-4 h-4" />
        Create Your First Course
        <svg
          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.button>
    </div>
  );
}

interface ProfileCardProps {
  user: any;
  totalCourses: number;
}

function ProfileCard({ user, totalCourses }: ProfileCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-100">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
          <p className="text-gray-600 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600 text-sm">Plan</span>
          <span className="text-purple-600 font-semibold uppercase">{user.plan}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600 text-sm">Provider</span>
          <span className="text-gray-900 font-medium flex items-center gap-1">
            {user.provider === 'google' ? (
              <>
                <Shield className="w-4 h-4" /> Google
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" /> Email
              </>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-600 text-sm">Member Since</span>
          <span className="text-gray-900 font-medium">
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recently'}
          </span>
        </div>
      </div>

      {user.plan === 'free' && (
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => (window.location.href = '/pricing')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Upgrade to Pro
          </motion.button>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-purple-600 text-sm font-medium mb-1">Free Plan Limits</div>
            <div className="text-xs text-gray-600 flex items-center gap-1 justify-center">
              {totalCourses >= 1 ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : (
                <Circle className="w-3 h-3 text-gray-400" />
              )}{' '}
              1 Course Max
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1 justify-center">
              <Circle className="w-3 h-3 text-gray-400" />
              2 Modules Max per Course
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface QuickStatsProps {
  stats: DashboardStats;
  oldCourses: OldCourse[];
  newCourses: NewCourse[];
}

function QuickStats({ stats, oldCourses, newCourses }: QuickStatsProps) {
  const completed =
    oldCourses.filter((c) => c.status === 'completed').length +
    newCourses.filter((c) => (c.percent || 0) === 100).length;
  const inProgress =
    oldCourses.filter((c) => c.status === 'in_progress').length +
    newCourses.filter((c) => (c.percent || 0) > 0 && (c.percent || 0) < 100).length;
  const notStarted =
    oldCourses.filter((c) => c.status === 'not_started').length +
    newCourses.filter((c) => (c.percent || 0) === 0).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="p-1.5 bg-purple-100 rounded-lg">
          <BarChart3 className="w-5 h-5 text-purple-700" />
        </div>
        Quick Stats
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Total Courses</span>
          <span className="text-gray-900 font-bold">{stats.coursesCreated}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Completed</span>
          <span className="text-green-600 font-bold">{completed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">In Progress</span>
          <span className="text-purple-600 font-bold">{inProgress}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Not Started</span>
          <span className="text-gray-600 font-bold">{notStarted}</span>
        </div>
      </div>
    </div>
  );
}

interface OverviewTabProps {
  stats: DashboardStats;
  newCourses: NewCourse[];
  oldCourses: OldCourse[];
  totalCourses: number;
  onCreateCourse: () => void;
  onViewAll: () => void;
}

function OverviewTab({
  stats,
  newCourses,
  oldCourses,
  totalCourses,
  onCreateCourse,
  onViewAll,
}: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        <QuickActions
          onCreateCourse={onCreateCourse}
          onViewCourses={onViewAll}
          totalCourses={totalCourses}
        />
        <RecentCourses courses={newCourses} onViewAll={onViewAll} />
        <LegacyCourses courses={oldCourses} />
        {totalCourses === 0 && <EmptyState onCreateCourse={onCreateCourse} />}
      </div>

      <div className="space-y-6">
        <QuickStats stats={stats} oldCourses={oldCourses} newCourses={newCourses} />
      </div>
    </div>
  );
}

interface CoursesTabHeaderProps {
  onCreateCourse: () => void;
}

function CoursesTabHeader({ onCreateCourse }: CoursesTabHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Courses</h2>
        </div>
        <p className="text-gray-600 text-sm ml-3">Manage and track your learning progress</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateCourse}
        className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 text-sm sm:text-base w-full sm:w-auto flex items-center gap-2 justify-center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Course
      </motion.button>
    </div>
  );
}

interface CoursesEmptyStateProps {
  onCreateCourse: () => void;
}

function CoursesEmptyState({ onCreateCourse }: CoursesEmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 bg-white border border-gray-200 rounded-xl">
      <div className="mb-4 flex justify-center">
        <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 text-purple-400" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6">Create your first course to get started!</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateCourse}
        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
      >
        Create Your First Course
      </motion.button>
    </div>
  );
}

interface NewCoursesSectionProps {
  courses: NewCourse[];
}

function NewCoursesSection({ courses }: NewCoursesSectionProps) {
  if (courses.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">AI-Generated Courses</h3>
          <p className="text-sm text-gray-600">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <CourseCard {...course} percent={course.percent || 0} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface LegacyCoursesSectionProps {
  courses: OldCourse[];
}

function LegacyCoursesSection({ courses }: LegacyCoursesSectionProps) {
  if (courses.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Legacy Courses</h3>
          <p className="text-sm text-gray-600">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm"
          >
            <div
              className={`w-full h-24 sm:h-32 bg-gradient-to-br ${getCategoryColor(course.category)} rounded-xl mb-3 sm:mb-4 flex items-center justify-center`}
            >
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
              {course.title}
            </h3>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              <span>{course.lessonsCount} lessons</span>
              <span>•</span>
              <span>{course.estimatedTime}</span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="text-purple-600 font-semibold">{course.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-700"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface CoursesTabProps {
  newCourses: NewCourse[];
  oldCourses: OldCourse[];
  totalCourses: number;
  onCreateCourse: () => void;
}

function CoursesTab({ newCourses, oldCourses, totalCourses, onCreateCourse }: CoursesTabProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
      <CoursesTabHeader onCreateCourse={onCreateCourse} />

      {totalCourses === 0 ? (
        <CoursesEmptyState onCreateCourse={onCreateCourse} />
      ) : (
        <div className="space-y-8 sm:space-y-10">
          <NewCoursesSection courses={newCourses} />
          <LegacyCoursesSection courses={oldCourses} />
        </div>
      )}
    </div>
  );
}

interface AnalyticsTabProps {
  stats: DashboardStats;
  newCourses: NewCourse[];
}

function AnalyticsTab({ stats, newCourses }: AnalyticsTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">Learning Analytics</h2>
        </div>
        <p className="text-gray-600 text-sm mb-8 ml-3">
          Track your progress and performance metrics
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <WeeklyActivityChart learningTimeMinutes={stats.learningTimeMinutes} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <CourseProgressChart courses={newCourses} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <LearningTimeChart learningTimeMinutes={stats.learningTimeMinutes} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <AchievementChart achievements={stats.achievements || 0} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-purple-700" />
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-200 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">
                  {Math.min(Math.round((stats.learningTimeMinutes / 6000) * 100), 100)}%
                </span>
              </div>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.learningTime}</h4>
            <p className="text-gray-600 text-sm mb-4">Total Learning Time</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-700 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.learningTimeMinutes / 6000) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-purple-700" />
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-200 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">{stats.completionRate}%</span>
              </div>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.completionRate}%</h4>
            <p className="text-gray-600 text-sm mb-4">Completion Rate</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-700 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-purple-700" />
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-200 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">
                  {Math.min(Math.round((stats.achievements / 50) * 100), 100)}%
                </span>
              </div>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-1">{stats.achievements}</h4>
            <p className="text-gray-600 text-sm mb-4">Achievements Unlocked</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-700 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.achievements / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'analytics'>('overview');
  const { stats, oldCourses, newCourses, loading } = useDashboardData(user);

  const totalCourses = oldCourses.length + newCourses.length;

  const handleCreateCourse = () => {
    if (user?.plan === 'free' && totalCourses >= 1) {
      window.location.href = '/pricing';
      return;
    }
    window.open('/courses/new', '_blank');
  };

  if (authLoading || loading) {
    return <LoadingState />;
  }

  if (!user || !stats) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40 pt-16 sm:pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
          <div
            className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-300 rounded-full blur-[140px] opacity-15 animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-purple-100/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full blur-[120px] opacity-20"></div>
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <WelcomeHeader userName={user.name} />
          <StatsGrid stats={stats} userPlan={user.plan} />
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalCourses={totalCourses}
          />

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <QuickActions
                    onCreateCourse={handleCreateCourse}
                    onViewCourses={() => setActiveTab('courses')}
                    totalCourses={totalCourses}
                  />
                  <RecentCourses
                    courses={newCourses}
                    onViewAll={() => setActiveTab('courses')}
                  />
                  <LegacyCourses courses={oldCourses} />
                  {totalCourses === 0 && <EmptyState onCreateCourse={handleCreateCourse} />}
                </div>

                <div className="space-y-6">
                  <ProfileCard user={user} totalCourses={totalCourses} />
                  <QuickStats stats={stats} oldCourses={oldCourses} newCourses={newCourses} />
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <CoursesTab
                newCourses={newCourses}
                oldCourses={oldCourses}
                totalCourses={totalCourses}
                onCreateCourse={handleCreateCourse}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab stats={stats} newCourses={newCourses} />
            )}
          </motion.div>
        </div>

        <footer className="relative z-10 border-t border-gray-200 py-8 mt-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
            <p className="text-sm sm:text-base">
              &copy; 2025 AiCourse Generator. All rights reserved.
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}
