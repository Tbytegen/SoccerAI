import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  TrophyIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Advanced performance insights and detailed analysis
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="form-input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Premium Feature Notice */}
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Premium Analytics Suite
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Unlock detailed performance analytics, model comparison, and advanced insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn btn-primary">
              Upgrade to Premium
            </button>
            <button className="btn btn-outline">
              View Sample Report
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Trends
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Track your prediction accuracy over time with detailed trend analysis
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Accuracy over time</li>
              <li>• Win rate trends</li>
              <li>• Confidence correlation</li>
              <li>• League-specific performance</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <TrophyIcon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Model Comparison
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Compare different ML models and their prediction performance
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• XGBoost vs Random Forest</li>
              <li>• Neural network analysis</li>
              <li>• Ensemble performance</li>
              <li>• Feature importance ranking</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <StarIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Advanced Metrics
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Deep dive into prediction confidence, calibration, and profitability
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Confidence calibration</li>
              <li>• Profit/loss analysis</li>
              <li>• Risk assessment</li>
              <li>• Predictive power scores</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sample Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Sample Accuracy Chart
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Interactive Chart Preview</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Confidence Distribution
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Distribution Analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ready to dive deeper?
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Get comprehensive analytics and insights to improve your predictions
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <button className="btn btn-primary">
              Start Free Trial
            </button>
            <p className="text-xs text-gray-500 text-center">
              7 days free, no credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;