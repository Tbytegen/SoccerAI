import React from 'react';
import { PlayIcon, SignalIcon } from '@heroicons/react/24/outline';

const LiveMatch: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Matches</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track live soccer matches with real-time predictions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
      </div>

      {/* Premium Feature Notice */}
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Premium Feature
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Live match tracking and real-time predictions are available for premium subscribers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn btn-primary">
              Upgrade to Premium
            </button>
            <button className="btn btn-outline">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <SignalIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Real-time Updates
            </h3>
            <p className="text-sm text-gray-600">
              Get live scores, events, and match statistics as they happen
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <PlayIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Live Predictions
            </h3>
            <p className="text-sm text-gray-600">
              Watch your predictions update as match conditions change
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <SignalIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Match Alerts
            </h3>
            <p className="text-sm text-gray-600">
              Receive notifications for key events and prediction updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatch;