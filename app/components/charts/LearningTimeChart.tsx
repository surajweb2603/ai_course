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

export default function LearningTimeChart({ learningTimeMinutes }: LearningTimeChartProps) {
  // Generate monthly data based on total learning time
  const generateMonthlyData = (totalMinutes: number) => {
    const monthlyData: number[] = [];
    // Distribute learning time across 12 months with realistic variation
    const baseHours = totalMinutes / 60 / 12; // Average hours per month
    const variation = 0.4; // 40% variation
    
    for (let i = 0; i < 12; i++) {
      const variationFactor = 1 + (Math.random() - 0.5) * variation;
      const monthHours = Math.max(0, baseHours * variationFactor);
      monthlyData.push(Number(monthHours.toFixed(1)));
    }
    
    return monthlyData;
  };

  const monthlyData = learningTimeMinutes ? generateMonthlyData(learningTimeMinutes) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Calculate dynamic y-axis max based on data
  const maxValue = Math.max(...monthlyData, 0);
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 3; // Add 20% padding, minimum 3
  const stepSize = yAxisMax <= 6 ? 0.5 : Math.ceil(yAxisMax / 10); // Adjust step size based on max

  const chartData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Monthly Learning Time (hours)',
        data: monthlyData,
        borderColor: 'rgb(16, 185, 129)', // green-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
        borderColor: 'rgba(16, 185, 129, 0.3)',
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
        backgroundColor: 'rgb(16, 185, 129)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      },
      line: {
        borderWidth: 3,
      },
    },
  };

  return (
    <ChartContainer title="Learning Time Trends (12 Months)">
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
}
