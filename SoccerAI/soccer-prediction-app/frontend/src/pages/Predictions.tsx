import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  PlusIcon, 
  FunnelIcon, 
  CalendarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { predictionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PredictionCard from '../components/dashboard/PredictionCard';

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

const Predictions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'pending' | 'completed',
    league: 'all' as string,
    search: '',
    sortBy: 'createdAt' as 'createdAt' | 'matchDate' | 'confidence',
    sortOrder: 'desc' as 'asc' | 'desc',
    page: 1,
    limit: 20,
  });

  // Fetch predictions
  const {
    data: predictionsData,
    isLoading,
    error,
  } = useQuery(
    ['predictions', filters],
    () => {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.league !== 'all') params.league = filters.league;
      if (filters.search) params.search = filters.search;
      
      return predictionsAPI.getPredictions(params).then(res => res.data);
    },
    {
      keepPreviousData: true,
    }
  );

  // Delete prediction mutation
  const deletePredictionMutation = useMutation(
    (id: string) => predictionsAPI.deletePrediction(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('predictions');
      },
    }
  );

  // Filter and sort predictions
  const filteredPredictions = useMemo(() => {
    if (!predictionsData?.predictions) return [];
    
    let filtered = [...predictionsData.predictions];
    
    // Apply filters (additional client-side filtering if needed)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (pred) =>
          pred.homeTeam.toLowerCase().includes(searchLower) ||
          pred.awayTeam.toLowerCase().includes(searchLower) ||
          pred.league.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      const modifier = filters.sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });
    
    return filtered;
  }, [predictionsData?.predictions, filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDeletePrediction = async (id: string) => {
    try {
      await deletePredictionMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete prediction:', error);
    }
  };

  // Get unique leagues for filter
  const availableLeagues = useMemo(() => {
    if (!predictionsData?.predictions) return [];
    const leagues = [...new Set(predictionsData.predictions.map(p => p.league))];
    return leagues.sort();
  }, [predictionsData?.predictions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading predictions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Predictions</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage your soccer match predictions
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn btn-outline">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Prediction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teams or leagues..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* League */}
            <div>
              <label className="form-label">League</label>
              <select
                value={filters.league}
                onChange={(e) => handleFilterChange('league', e.target.value)}
                className="form-input"
              >
                <option value="all">All Leagues</option>
                {availableLeagues.map((league) => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="form-label">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="form-input"
              >
                <option value="createdAt">Created Date</option>
                <option value="matchDate">Match Date</option>
                <option value="confidence">Confidence</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="form-label">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="form-input"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {predictionsData && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredPredictions.length} of {predictionsData.total} predictions
          </span>
          <div className="flex items-center space-x-4">
            <span>
              Accuracy: {predictionsData.accuracy || 0}%
            </span>
            <span>
              Pending: {predictionsData.pending || 0}
            </span>
            <span>
              Completed: {predictionsData.completed || 0}
            </span>
          </div>
        </div>
      )}

      {/* Predictions List */}
      <div className="space-y-4">
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error loading predictions</p>
            <button
              onClick={() => queryClient.invalidateQueries('predictions')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No predictions found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {filters.search || filters.status !== 'all' || filters.league !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first prediction'}
            </p>
            <button className="btn btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Prediction
            </button>
          </div>
        ) : (
          filteredPredictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              showActions={true}
              onDelete={handleDeletePrediction}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {predictionsData && predictionsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {filters.page} of {predictionsData.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= predictionsData.totalPages}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;