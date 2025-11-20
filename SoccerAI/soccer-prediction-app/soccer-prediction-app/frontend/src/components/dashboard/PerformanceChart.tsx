import React from 'react';
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
import { useQuery } from 'react-query';
import { analyticsAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

// Register Chart.js components
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

interface PerformanceChartProps {
  timeframe: '7d' | '30d' | '90d';
  height?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  timeframe,
  height = 300,
}) => {
  const { data, isLoading, error } = useQuery(
    ['performance-chart', timeframe],
    () => analyticsAPI.getPredictionTrends({ period: timeframe }).then(res => res.data),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Accuracy %',
        data: data?.accuracy || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Predictions Made',
        data: data?.predictions || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
      {
        label: 'Wins',
        data: data?.wins || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return `${context[0].label}`;
          },
          label: (context: any) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (datasetLabel.includes('Accuracy')) {
              return `${datasetLabel}: ${value.toFixed(1)}%`;
            } else if (datasetLabel.includes('Predictions')) {
              return `${datasetLabel}: ${value}`;
            } else if (datasetLabel.includes('Wins')) {
              return `${datasetLabel}: ${value}`;
            }
            
            return `${datasetLabel}: ${value}`;
          },
          afterBody: (context: any) => {
            const accuracyContext = context.find((c: any) => c.dataset.label.includes('Accuracy'));
            if (accuracyContext) {
              const accuracy = accuracyContext.parsed.y;
              let rating = '';
              if (accuracy >= 80) rating = 'Excellent performance!';
              else if (accuracy >= 70) rating = 'Good performance';
              else if (accuracy >= 60) rating = 'Fair performance';
              else rating = 'Room for improvement';
              
              return ['', rating];
            }
            return [];
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Accuracy (%)',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
        },
        min: 0,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Number of Predictions',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: 'rgb(59, 130, 246)',
      },
    },
  };

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <LoadingSpinner size="medium" text="Loading performance data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">Error loading chart data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500">No performance data available</p>
          <p className="text-xs text-gray-400 mt-1">
            Make some predictions to see your performance over time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PerformanceChart;