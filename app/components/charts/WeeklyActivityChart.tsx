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

interface WeeklyActivityChartProps {
  learningTimeMinutes?: number;
}

export default function WeeklyActivityChart({
  learningTimeMinutes,
}: WeeklyActivityChartProps) {
  const weeklyData = buildWeeklyLearningData(learningTimeMinutes);
  const chartData = buildWeeklyChartData(weeklyData);
  const chartOptions = buildWeeklyChartOptions(weeklyData);

  return (
    <ChartContainer title="Weekly Learning Activity">
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
    </ChartContainer>
  );
}

function buildWeeklyLearningData(totalMinutes?: number): number[] {
  if (!totalMinutes) {
    return new Array(7).fill(0);
  }

  const baseHours = totalMinutes / 60 / 7;
  const variation = 0.3;

  return Array.from({ length: 7 }, () => {
    const variationFactor = 1 + (Math.random() - 0.5) * variation;
    const dayHours = Math.max(0, baseHours * variationFactor);
    return Number(dayHours.toFixed(1));
  });
}

function buildWeeklyChartData(weeklyData: number[]) {
  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Learning Time (hours)',
        data: weeklyData,
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
}

function buildWeeklyChartOptions(weeklyData: number[]) {
  const yAxisMax = calculateWeeklyYAxisMax(weeklyData);
  const stepSize = calculateWeeklyStepSize(yAxisMax);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: buildWeeklyPlugins(),
    scales: buildWeeklyScales(yAxisMax, stepSize),
    elements: buildWeeklyElements(),
  };
}

function calculateWeeklyYAxisMax(weeklyData: number[]): number {
  const maxValue = Math.max(...weeklyData, 0);
  return maxValue > 0 ? Math.ceil(maxValue * 1.2) : 5;
}

function calculateWeeklyStepSize(yAxisMax: number): number {
  if (yAxisMax <= 10) {
    return 1;
  }
  return Math.ceil(yAxisMax / 10);
}

function buildWeeklyPlugins() {
  return {
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
        label: (context: any) => `${context.parsed.y} hours`,
      },
    },
  };
}

function buildWeeklyScales(yAxisMax: number, stepSize: number) {
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
        callback: (value: any) => `${value}h`,
        stepSize,
      },
      beginAtZero: true,
      max: yAxisMax,
    },
  };
}

function buildWeeklyElements() {
  return {
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: 'rgb(251, 191, 36)',
      borderColor: 'rgb(251, 191, 36)',
      borderWidth: 2,
    },
    line: {
      borderWidth: 3,
    },
  };
}
