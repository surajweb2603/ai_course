'use client';

import { useRouter } from 'next/navigation';

interface CourseCardProps {
  _id: string;
  title: string;
  language: string;
  visibility: 'private' | 'unlisted' | 'public';
  createdAt: string;
  percent?: number;
}

export default function CourseCard({
  _id,
  title,
  language,
  visibility,
  createdAt,
  percent = 0,
}: CourseCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/course/${_id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVisibilityBadgeColor = (vis: string) => {
    switch (vis) {
      case 'public':
        return 'bg-green-50 text-green-600 border border-green-200';
      case 'unlisted':
        return 'bg-purple-50 text-purple-600 border border-purple-200';
      case 'private':
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm"
    >
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1 group-hover:text-purple-600 transition-colors duration-300">
            {title}
          </h3>
          <span
            className={`ml-3 px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getVisibilityBadgeColor(
              visibility
            )}`}
          >
            {visibility}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-purple-600">A</span>
            </div>
            {language.toUpperCase()}
          </span>
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(createdAt)}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 font-medium">Progress</span>
            <span className="text-purple-600 font-bold">{percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
