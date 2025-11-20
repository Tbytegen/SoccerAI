import React from 'react';
import { Link } from 'react-router-dom';
import {
  BoltIcon,
  ChartBarIcon,
  PlayIcon,
  PlusIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const QuickActions: React.FC = () => {
  const { user } = useAuth();
  const isPremium = user?.subscription?.type === 'premium';

  const actions = [
    {
      name: 'New Prediction',
      description: 'Create a prediction for an upcoming match',
      icon: BoltIcon,
      href: '/predictions/new',
      color: 'bg-blue-500 hover:bg-blue-600',
      available: true,
    },
    {
      name: 'View Analytics',
      description: 'Detailed performance analysis and insights',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'bg-green-500 hover:bg-green-600',
      available: isPremium,
      badge: isPremium ? null : 'Premium',
    },
    {
      name: 'Live Matches',
      description: 'Track live games and real-time updates',
      icon: PlayIcon,
      href: '/live-match',
      color: 'bg-red-500 hover:bg-red-600',
      available: isPremium,
      badge: isPremium ? 'Live' : 'Premium',
    },
    {
      name: 'Export Data',
      description: 'Download your prediction history and stats',
      icon: DocumentChartBarIcon,
      href: '/settings/export',
      color: 'bg-purple-500 hover:bg-purple-600',
      available: true,
    },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-sm text-gray-600">Common tasks and features</p>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            
            if (!action.available) {
              return (
                <div
                  key={action.name}
                  className="relative bg-gray-50 rounded-lg p-4 opacity-60 cursor-not-allowed"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      {action.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">
                      {action.description}
                    </p>
                    <div className="flex items-center">
                      {action.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {action.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={action.name}
                to={action.href}
                className={`relative ${action.color} text-white rounded-lg p-4 transition-colors group hover:scale-105 transform duration-200`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-opacity-30 transition-all">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-medium mb-1">{action.name}</h3>
                  <p className="text-xs opacity-90 mb-2">{action.description}</p>
                  <div className="flex items-center">
                    {action.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20">
                        {action.badge}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Premium Upgrade CTA */}
        {!isPremium && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Unlock Premium Features
                </h3>
                <p className="text-xs text-gray-600">
                  Get access to advanced analytics, live match tracking, and premium predictions
                </p>
              </div>
              <button className="ml-4 btn btn-primary text-sm">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActions;