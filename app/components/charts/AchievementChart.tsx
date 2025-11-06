'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartContainer from './ChartContainer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AchievementChartProps {
  achievements?: number;
}

export default function AchievementChart({ achievements }: AchievementChartProps) {
  
  // Generate achievement progression data
  const generateAchievementData = (totalAchievements: number) => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const achievementData: number[] = [];
    
    // If total achievements is 0, return sample data
    if (totalAchievements === 0) {
      return [0, 1, 2, 3, 4, 5];
    }
    
    // For small numbers of achievements, show them being unlocked in later months
    if (totalAchievements === 1) {
      return [0, 0, 0, 0, 1, 1]; // Unlocked in October, maintained in November
    }
    
    if (totalAchievements === 2) {
      return [0, 0, 0, 1, 2, 2]; // First in September, second in October
    }
    
    if (totalAchievements === 3) {
      return [0, 0, 1, 2, 3, 3]; // Progressive unlock
    }
    
    // For larger numbers, distribute more evenly
    const baseAchievements = totalAchievements / 6;
    for (let i = 0; i < 6; i++) {
      const progressFactor = (i + 1) / 6;
      const monthAchievements = Math.floor(baseAchievements * progressFactor * (1 + Math.random() * 0.2));
      achievementData.push(Math.max(0, monthAchievements));
    }
    
    return achievementData;
  };

  // Generate achievement data with fallback for zero or undefined achievements
  let achievementData: number[];
  if (achievements && achievements > 0) {
    achievementData = generateAchievementData(achievements);
  } else {
    // Show sample progression when no achievements
    achievementData = [0, 1, 2, 3, 4, 5];
  }
  

  const chartData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Achievements Unlocked',
        data: achievementData,
        borderColor: 'rgb(168, 85, 247)', // purple-500
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true,
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
        borderColor: 'rgba(168, 85, 247, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} achievements`;
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
            size: 12,
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
            return value;
          }
        },
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: 'rgb(168, 85, 247)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
      },
      line: {
        borderWidth: 3,
      },
    },
  };

  return (
    <ChartContainer title="Achievement Progress">
      {(!achievements || achievements === 0) && (
        <div className="mb-2 text-sm text-gray-600">
          Showing sample data - start learning to unlock achievements!
        </div>
      )}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
}
