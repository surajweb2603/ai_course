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

export default function CourseProgressChart({ courses }: CourseProgressChartProps) {
  // Generate colors for courses
  const colors = [
    'rgba(251, 191, 36, 0.8)',   // yellow
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(16, 185, 129, 0.8)',   // green
    'rgba(168, 85, 247, 0.8)',  // purple
    'rgba(239, 68, 68, 0.8)',   // red
    'rgba(245, 158, 11, 0.8)',  // amber
    'rgba(34, 197, 94, 0.8)',   // emerald
    'rgba(236, 72, 153, 0.8)',  // pink
  ];

  const borderColors = [
    'rgb(251, 191, 36)',
    'rgb(59, 130, 246)',
    'rgb(16, 185, 129)',
    'rgb(168, 85, 247)',
    'rgb(239, 68, 68)',
    'rgb(245, 158, 11)',
    'rgb(34, 197, 94)',
    'rgb(236, 72, 153)',
  ];

  // Process real course data - show only top 5 courses
  const chartData = courses && courses.length > 0 ? (() => {
    // Sort courses by progress percentage (descending) and take top 5
    const sortedCourses = [...courses]
      .sort((a, b) => (b.percent || 0) - (a.percent || 0))
      .slice(0, 5);
    
    return {
      labels: sortedCourses.map(course => course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title),
      datasets: [
        {
          label: 'Progress (%)',
          data: sortedCourses.map(course => course.percent || 0),
          backgroundColor: sortedCourses.map((_, index) => colors[index % colors.length]),
          borderColor: sortedCourses.map((_, index) => borderColors[index % borderColors.length]),
          borderWidth: 2,
        },
      ],
    };
  })() : {
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(251, 191, 36, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y}% complete`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(107, 114, 128, 0.8)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(107, 114, 128, 0.8)',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return value + '%';
          }
        },
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <ChartContainer title="Top 5 Course Progress">
      {courses && courses.length > 5 && (
        <div className="mb-2 text-sm text-gray-600">
          Showing top 5 of {courses.length} courses
        </div>
      )}
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
}
