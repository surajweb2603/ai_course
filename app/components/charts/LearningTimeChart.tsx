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

interface LearningTimeChartProps {
  learningTimeMinutes?: number;
}

export default function LearningTimeChart({
  learningTimeMinutes,
}: LearningTimeChartProps) {
  const monthlyData = buildLearningMonthlyData(learningTimeMinutes);
  const chartData = buildLearningChartData(monthlyData);
  const chartOptions = buildLearningChartOptions(monthlyData);

  return (
    <ChartContainer title="Learning Time Trends (12 Months)">
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
    </ChartContainer>
  );
}

function buildLearningMonthlyData(totalMinutes?: number): number[] {
  if (!totalMinutes) {
    return new Array(12).fill(0);
  }

  const baseHours = totalMinutes / 60 / 12;
  const variation = 0.4;

  return Array.from({ length: 12 }, () => {
    const variationFactor = 1 + (Math.random() - 0.5) * variation;
    const monthHours = Math.max(0, baseHours * variationFactor);
    return Number(monthHours.toFixed(1));
  });
}

function buildLearningChartData(monthlyData: number[]) {
  return {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    datasets: [
      {
        label: 'Monthly Learning Time (hours)',
        data: monthlyData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
}

function buildLearningChartOptions(monthlyData: number[]) {
  const yAxisMax = calculateYAxisMax(monthlyData);
  const stepSize = calculateStepSize(yAxisMax);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: buildLearningPlugins(),
    scales: buildLearningScales(yAxisMax, stepSize),
    elements: buildLearningElements(),
  };
}

function calculateYAxisMax(monthlyData: number[]): number {
  const maxValue = Math.max(...monthlyData, 0);
  return maxValue > 0 ? Math.ceil(maxValue * 1.2) : 3;
}

function calculateStepSize(yAxisMax: number): number {
  if (yAxisMax <= 6) {
    return 0.5;
  }

  return Math.ceil(yAxisMax / 10);
}

function buildLearningPlugins() {
  return {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: (context: any) => `${context.parsed.y} hours`,
      },
    },
  };
}

function buildLearningScales(yAxisMax: number, stepSize: number) {
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
        callback: (value: any) => `${value}h`,
        stepSize,
      },
      beginAtZero: true,
      max: yAxisMax,
    },
  };
}

function buildLearningElements() {
  return {
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: 'rgb(16, 185, 129)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 2,
    },
    line: {
      borderWidth: 3,
    },
  };
}
