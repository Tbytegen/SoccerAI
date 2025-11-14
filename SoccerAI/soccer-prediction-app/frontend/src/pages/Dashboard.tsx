import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  ChartBarIcon,
  BoltIcon,
  ClockIcon,
  TrophyIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from '@heroicons/react/24/outline';
import { analyticsAPI, predictionsAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Components
import PredictionCard from '../components/dashboard/PredictionCard';
import StatsCard from '../components/dashboard/StatsCard';
import LiveMatchesWidget from '../components/dashboard/LiveMatchesWidget';
import RecentPredictionsWidget from '../components/dashboard/RecentPredictionsWidget';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import QuickActions from '../components/dashboard/QuickActions';

interface DashboardStats {
  totalPredictions: number;
  accuracy: number;
  streak: number;
  profit: number;
  todayPredictions: number;
  winRate: number;
  averageOdds: number;
  activeMatches: number;
}

interface RecentPrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: {
    result: 'home' | 'draw' | 'away';
    confidence: number;
    probability: number;
  };
  actualResult?: 'home' | 'draw' | 'away';
  isCorrect?: boolean;
  createdAt: string;
  status: 'pending' | 'completed';
}

const Dashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');

  // Fetch dashboard statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<DashboardStats>(
    ['dashboard-stats', timeframe, selectedLeague],
    () => analyticsAPI.getDashboardStats().then(res => res.data),
    {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    }
  );

  // Fetch recent predictions
  const {
    data: recentPredictions,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = useQuery<RecentPrediction[]>(
    ['recent-predictions', timeframe, selectedLeague],
    () => predictionsAPI.getPredictions({ 
      limit: 10, 
      status: 'all' 
    }).then(res => res.data),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch live matches
  const {
    data: liveMatches,
    isLoading: liveMatchesLoading,
  } = useQuery(
    'live-matches',
    () => analyticsAPI.getLiveStats().then(res => res.data),
    {
      refetchInterval: 15000, // Refresh every 15 seconds
    }
  );

  // Format numbers for display
  const formatNumber = (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${formatNumber(num, 1)}%`;
  };

  if (statsLoading || predictionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back! Here's what's happening with your predictions.
          </p>
        </div>
        
        {/* Controls */}
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="form-input text-sm"
          >
            <option value="all">All Leagues</option>
            <option value="premier-league">Premier League</option>
            <option value="la-liga">La Liga</option>
            <option value="serie-a">Serie A</option>
            <option value="bundesliga">Bundesliga</option>
            <option value="ligue-1">Ligue 1</option>
          </select>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="form-input text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Predictions"
            value={formatNumber(stats.totalPredictions)}
            icon={BoltIcon}
            trend={stats.todayPredictions > 0 ? { 
              value: `+${stats.todayPredictions} today`, 
              direction: 'up' 
            } : undefined}
            color="blue"
          />
          
          <StatsCard
            title="Accuracy"
            value={formatPercentage(stats.accuracy)}
            icon={TrophyIcon}
            trend={stats.accuracy >= 80 ? { 
              value: 'Excellent', 
              direction: 'up' 
            } : { 
              value: 'Good', 
              direction: 'neutral' 
            }}
            color="green"
          />
          
          <StatsCard
            title="Current Streak"
            value={formatNumber(stats.streak)}
            icon={ClockIcon}
            trend={stats.streak > 0 ? { 
              value: stats.streak > 5 ? 'Hot' : 'Growing', 
              direction: 'up' 
            } : { 
              value: 'Starting', 
              direction: 'neutral' 
            }}
            color="purple"
          />
          
          <StatsCard
            title="Profit/Loss"
            value={formatCurrency(stats.profit)}
            icon={stats.profit >= 0 ? TrendingUpIcon : TrendingDownIcon}
            trend={stats.profit >= 0 ? { 
              value: 'Profitable', 
              direction: 'up' 
            } : { 
              value: 'Tracking', 
              direction: 'down' 
            }}
            color={stats.profit >= 0 ? 'green' : 'red'}
          />
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <div className="chart-container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Performance Overview
              </h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">
                  {timeframe}
                </button>
              </div>
            </div>
            <PerformanceChart timeframe={timeframe} />
          </div>

          {/* Recent Predictions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Predictions
              </h2>
            </div>
            <div className="card-body">
              {predictionsLoading ? (
                <LoadingSpinner />
              ) : predictionsError ? (
                <p className="text-gray-500">Error loading predictions</p>
              ) : recentPredictions && recentPredictions.length > 0 ? (
                <div className="space-y-4">
                  {recentPredictions.map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No predictions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Live Matches */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Live Matches
              </h2>
            </div>
            <div className="card-body">
              {liveMatchesLoading ? (
                <LoadingSpinner />
              ) : (
                <LiveMatchesWidget matches={liveMatches || []} />
              )}
            </div>
          </div>

          {/* Additional Stats */}
          {stats && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">
                  Additional Stats
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Win Rate</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPercentage(stats.winRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg. Odds</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatNumber(stats.averageOdds, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Matches</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatNumber(stats.activeMatches)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;