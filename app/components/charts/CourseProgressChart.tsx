'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartContainer from './ChartContainer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Course {
  _id: string;
  title: string;
  percent?: number;
}

interface CourseProgressChartProps {
  courses?: Course[];
}

export default function CourseProgressChart({
  courses,
}: CourseProgressChartProps) {
  const chartData = buildCourseProgressData(courses);
  const chartOptions = buildCourseProgressOptions();

  return (
    <ChartContainer title="Top 5 Course Progress">
      {courses && courses.length > 5 && (
        <div className="mb-2 text-sm text-gray-600">
          Showing top 5 of {courses.length} courses
        </div>
      )}
      <div className="h-64">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </ChartContainer>
  );
}

function buildCourseProgressData(courses?: Course[]) {
  if (!courses || courses.length === 0) {
    return buildEmptyCourseData();
  }

  const topCourses = [...courses]
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .slice(0, 5);

  return {
    labels: topCourses.map((course) => truncateCourseTitle(course.title)),
    datasets: [
      {
        label: 'Progress (%)',
        data: topCourses.map((course) => course.percent || 0),
        backgroundColor: topCourses.map(
          (_, index) => COURSE_COLORS[index % COURSE_COLORS.length]
        ),
        borderColor: topCourses.map(
          (_, index) =>
            COURSE_BORDER_COLORS[index % COURSE_BORDER_COLORS.length]
        ),
        borderWidth: 2,
      },
    ],
  };
}

const COURSE_COLORS = [
  'rgba(251, 191, 36, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(236, 72, 153, 0.8)',
];

const COURSE_BORDER_COLORS = [
  'rgb(251, 191, 36)',
  'rgb(59, 130, 246)',
  'rgb(16, 185, 129)',
  'rgb(168, 85, 247)',
  'rgb(239, 68, 68)',
  'rgb(245, 158, 11)',
  'rgb(34, 197, 94)',
  'rgb(236, 72, 153)',
];

function truncateCourseTitle(title: string): string {
  return title.length > 15 ? `${title.substring(0, 15)}...` : title;
}

function buildEmptyCourseData() {
  return {
    labels: ['No Courses Yet'],
    datasets: [
      {
        label: 'Progress (%)',
        data: [0],
        backgroundColor: ['rgba(107, 114, 128, 0.8)'],
        borderColor: ['rgb(107, 114, 128)'],
        borderWidth: 2,
      },
    ],
  };
}

function buildCourseProgressOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(251, 191, 36, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y}% complete`,
        },
      },
    },
    scales: buildCourseProgressScales(),
  };
}

function buildCourseProgressScales() {
  return {
    x: {
      grid: {
        color: 'rgba(229, 231, 235, 0.5)',
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.8)',
        font: { size: 11 },
      },
    },
    y: {
      grid: {
        color: 'rgba(229, 231, 235, 0.5)',
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.8)',
        font: { size: 12 },
        callback: (value: any) => `${value}%`,
      },
      beginAtZero: true,
      max: 100,
    },
  };
}
