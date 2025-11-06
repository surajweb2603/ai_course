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

export default function WeeklyActivityChart({ learningTimeMinutes }: WeeklyActivityChartProps) {
  // Generate weekly activity data based on total learning time
  const generateWeeklyData = (totalMinutes: number) => {
    const weeklyData: number[] = [];
    
    // Distribute learning time across the week with some variation
    const baseHours = totalMinutes / 60 / 7; // Average hours per day
    const variation = 0.3; // 30% variation
    
    for (let i = 0; i < 7; i++) {
      const variationFactor = 1 + (Math.random() - 0.5) * variation;
      const dayHours = Math.max(0, baseHours * variationFactor);
      weeklyData.push(Number(dayHours.toFixed(1)));
    }
    
    return weeklyData;
  };

  const weeklyData = learningTimeMinutes ? generateWeeklyData(learningTimeMinutes) : [0, 0, 0, 0, 0, 0, 0];

  // Calculate dynamic y-axis max based on data
  const maxValue = Math.max(...weeklyData, 0);
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 5; // Add 20% padding, minimum 5
  const stepSize = yAxisMax <= 10 ? 1 : Math.ceil(yAxisMax / 10); // Adjust step size based on max

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Learning Time (hours)',
        data: weeklyData,
        borderColor: 'rgb(251, 191, 36)', // yellow-400
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
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
        borderColor: 'rgba(251, 191, 36, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} hours`;
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
            return value + 'h';
          },
          stepSize: stepSize,
        },
        beginAtZero: true,
        max: yAxisMax,
      },
    },
    elements: {
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
    },
  };

  return (
    <ChartContainer title="Weekly Learning Activity">
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
}
