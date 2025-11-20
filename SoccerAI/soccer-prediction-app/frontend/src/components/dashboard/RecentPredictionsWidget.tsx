import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RecentPrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  prediction: {
    result: 'home' | 'draw' | 'away';
    confidence: number;
  };
  actualResult?: 'home' | 'draw' | 'away';
  isCorrect?: boolean;
  status: 'pending' | 'completed';
  createdAt: string;
}

interface RecentPredictionsWidgetProps {
  predictions: RecentPrediction[];
  loading?: boolean;
}

const RecentPredictionsWidget: React.FC<RecentPredictionsWidgetProps> = ({
  predictions,
  loading = false,
}) => {
  const { user } = useAuth();
  const isPremium = user?.subscription?.type === 'premium';

  const getResultColor = (result: 'home' | 'draw' | 'away') => {
    switch (result) {
      case 'home':
        return 'text-blue-600 bg-blue-50';
      case 'draw':
        return 'text-yellow-600 bg-yellow-50';
      case 'away':
        return 'text-green-600 bg-green-50';
    }
  };

  const getResultLabel = (result: 'home' | 'draw' | 'away') => {
    switch (result) {
      case 'home':
        return 'Home';
      case 'draw':
        return 'Draw';
      case 'away':
        return 'Away';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (prediction: RecentPrediction) => {
    if (prediction.status === 'pending') {
      return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
    
    if (prediction.isCorrect) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="text-center py-8">
        <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-sm text-gray-500 mb-2">No recent predictions</p>
        <Link
          to="/predictions/new"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Make your first prediction
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {predictions.slice(0, 5).map((prediction) => (
        <div
          key={prediction.id}
          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {prediction.homeTeam} vs {prediction.awayTeam}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {prediction.league}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">Predicted:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getResultColor(prediction.prediction.result)}`}>
                  {getResultLabel(prediction.prediction.result)}
                </span>
              </div>
              
              <span className={`text-xs font-medium ${getConfidenceColor(prediction.prediction.confidence)}`}>
                {prediction.prediction.confidence}%
              </span>
              
              {prediction.status === 'completed' && prediction.actualResult && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Actual:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getResultColor(prediction.actualResult)}`}>
                    {getResultLabel(prediction.actualResult)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {getStatusIcon(prediction)}
            
            {isPremium && (
              <Link
                to={`/predictions/${prediction.id}`}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View
              </Link>
            )}
          </div>
        </div>
      ))}
      
      {/* View All Link */}
      <div className="text-center pt-4 border-t border-gray-100">
        <Link
          to="/predictions"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Predictions
        </Link>
      </div>
    </div>
  );
};

export default RecentPredictionsWidget;