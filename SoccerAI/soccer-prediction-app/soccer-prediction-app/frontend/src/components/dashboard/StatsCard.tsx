import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  subtitle?: string;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    trend: 'text-yellow-600',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  subtitle,
  loading = false,
}) => {
  const classes = colorClasses[color];

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <ArrowUpIcon className="h-3 w-3" />;
      case 'down':
        return <ArrowDownIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="card stat-card">
        <div className="card-body">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${classes.bg}`}>
              <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
            </div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card stat-card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${classes.bg}`}>
            <Icon className={`h-6 w-6 ${classes.icon}`} />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {trend && (
                <div className={`ml-2 flex items-center text-sm ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span className="ml-1">{trend.value}</span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;