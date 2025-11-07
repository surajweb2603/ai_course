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

export default function AchievementChart({
  achievements,
}: AchievementChartProps) {
  const achievementData = buildAchievementDataset(achievements);
  const chartData = buildAchievementChartData(achievementData);
  const chartOptions = buildAchievementChartOptions();

  return (
    <ChartContainer title="Achievement Progress">
      {(!achievements || achievements === 0) && (
        <div className="mb-2 text-sm text-gray-600">
          Showing sample data - start learning to unlock achievements!
        </div>
      )}
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
    </ChartContainer>
  );
}

function buildAchievementDataset(achievements?: number): number[] {
  if (!achievements || achievements <= 0) {
    return [0, 1, 2, 3, 4, 5];
  }

  if (achievements === 1) {
    return [0, 0, 0, 0, 1, 1];
  }

  if (achievements === 2) {
    return [0, 0, 0, 1, 2, 2];
  }

  if (achievements === 3) {
    return [0, 0, 1, 2, 3, 3];
  }

  return generateEvenlyDistributedAchievements(achievements);
}

function generateEvenlyDistributedAchievements(
  totalAchievements: number
): number[] {
  const achievementData: number[] = [];
  const baseAchievements = totalAchievements / 6;

  for (let month = 0; month < 6; month++) {
    const progressFactor = (month + 1) / 6;
    const monthAchievements = Math.floor(
      baseAchievements * progressFactor * (1 + Math.random() * 0.2)
    );
    achievementData.push(Math.max(0, monthAchievements));
  }

  return achievementData;
}

function buildAchievementChartData(achievementData: number[]) {
  return {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Achievements Unlocked',
        data: achievementData,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
}

function buildAchievementChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(168, 85, 247, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y} achievements`,
        },
      },
    },
    scales: buildAchievementScales(),
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
}

function buildAchievementScales() {
  return {
    x: {
      grid: {
        color: 'rgba(229, 231, 235, 0.5)',
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.8)',
        font: { size: 12 },
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
        callback: (value: any) => value,
      },
      beginAtZero: true,
    },
  };
}
