import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Prediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  prediction: {
    result: 'home' | 'draw' | 'away';
    confidence: number;
    probability: number;
  };
  actualResult?: 'home' | 'draw' | 'away';
  isCorrect?: boolean;
  createdAt: string;
  status: 'pending' | 'completed';
  odds?: number;
  potentialWin?: number;
}

interface PredictionCardProps {
  prediction: Prediction;
  showActions?: boolean;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  showActions = false,
  onView,
  onDelete,
}) => {
  const { user } = useAuth();

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
        return 'Home Win';
      case 'draw':
        return 'Draw';
      case 'away':
        return 'Away Win';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = () => {
    if (prediction.status === 'completed') {
      return (
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          prediction.isCorrect 
            ? 'text-green-800 bg-green-100' 
            : 'text-red-800 bg-red-100'
        }`}>
          {prediction.isCorrect ? (
            <>
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Correct
            </>
          ) : (
            <>
              <XCircleIcon className="h-3 w-3 mr-1" />
              Incorrect
            </>
          )}
        </div>
      );
    }

    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-800 bg-gray-100">
        <ClockIcon className="h-3 w-3 mr-1" />
        Pending
      </div>
    );
  };

  const formatMatchDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const handleView = () => {
    if (onView) onView(prediction.id);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this prediction?')) {
      onDelete(prediction.id);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">
              {prediction.homeTeam} vs {prediction.awayTeam}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {prediction.league}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Match {formatMatchDate(prediction.matchDate)} • 
            Predicted {formatMatchDate(prediction.createdAt)}
          </p>
        </div>

        {/* Actions menu */}
        {showActions && (
          <div className="relative">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Prediction Details */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getResultColor(prediction.prediction.result)}`}>
            {getResultLabel(prediction.prediction.result)}
          </div>
          
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.prediction.confidence)}`}>
            {prediction.prediction.confidence}% confidence
          </div>
        </div>

        <div className="text-right">
          {getStatusBadge()}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Probability: {prediction.prediction.probability}%</span>
          {prediction.odds && (
            <span>Odds: {prediction.odds.toFixed(2)}</span>
          )}
          {prediction.potentialWin && (
            <span>Potential Win: {prediction.potentialWin.toFixed(0)}%</span>
          )}
        </div>

        {showActions && user?.subscription?.type === 'premium' && (
          <button
            onClick={handleView}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
        )}
      </div>

      {/* Show actual result if available */}
      {prediction.status === 'completed' && prediction.actualResult && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Actual Result:</span>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getResultColor(prediction.actualResult)}`}>
                {getResultLabel(prediction.actualResult)}
              </span>
              {prediction.isCorrect !== undefined && (
                <span className={`text-xs ${prediction.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {prediction.isCorrect ? '+' : '-'}
                  {Math.round(Math.abs(prediction.prediction.confidence - 50))} pts
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionCard;