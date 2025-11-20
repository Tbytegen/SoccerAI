import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, ClockIcon, SignalIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  status: 'live' | 'halftime' | 'fulltime';
  score: {
    home: number;
    away: number;
  };
  minute: number;
  events?: {
    minute: number;
    type: 'goal' | 'card' | 'substitution';
    player: string;
    team: 'home' | 'away';
  }[];
}

interface LiveMatchesWidgetProps {
  matches: LiveMatch[];
}

const LiveMatchesWidget: React.FC<LiveMatchesWidgetProps> = ({ matches }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800';
      case 'halftime':
        return 'bg-yellow-100 text-yellow-800';
      case 'fulltime':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <SignalIcon className="h-3 w-3 animate-pulse" />;
      case 'halftime':
        return <ClockIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8">
        <PlayIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-sm text-gray-500">No live matches currently</p>
        <p className="text-xs text-gray-400 mt-1">
          Check back during match hours
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div
          key={match.id}
          className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
        >
          {/* Match Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {match.league}
            </span>
            <div className="flex items-center space-x-2">
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                {getStatusIcon(match.status)}
                <span className="ml-1 capitalize">{match.status}</span>
              </div>
              {match.status === 'live' && (
                <span className="text-xs text-gray-500">{match.minute}'</span>
              )}
            </div>
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {match.homeTeam}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {match.score.home}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {match.awayTeam}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {match.score.away}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          {match.events && match.events.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-600 mb-2">Recent Events</div>
              <div className="space-y-1">
                {match.events.slice(-3).map((event, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <span className="text-gray-500 w-8">{event.minute}'</span>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      event.type === 'goal' ? 'bg-green-500' :
                      event.type === 'card' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-gray-700">
                      <span className="font-medium">{event.player}</span>
                      <span className="text-gray-500"> ({event.type})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              View Details
            </button>
            <span className="text-xs text-gray-500">
              Updated {formatDistanceToNow(new Date(), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}

      {/* View All Link */}
      <div className="text-center pt-4">
        <Link
          to="/live-matches"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Live Matches
        </Link>
      </div>
    </div>
  );
};

export default LiveMatchesWidget;