import React, { useState } from 'react';
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  TrophyIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleEdit = () => {
    setEditedUser(user);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editedUser) {
      await updateUser(editedUser);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAccountAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account information and preferences
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {!isEditing ? (
            <button onClick={handleEdit} className="btn btn-outline">
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <>
              <button onClick={handleCancel} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-gray-600" />
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        value={editedUser?.firstName || ''}
                        onChange={(e) => setEditedUser(prev => prev ? {...prev, firstName: e.target.value} : null)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        value={editedUser?.lastName || ''}
                        onChange={(e) => setEditedUser(prev => prev ? {...prev, lastName: e.target.value} : null)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      value={editedUser?.username || ''}
                      onChange={(e) => setEditedUser(prev => prev ? {...prev, username: e.target.value} : null)}
                      className="form-input"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-lg text-gray-600">@{user.username}</p>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {user.email}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Member for {calculateAccountAge(user.createdAt)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Subscription Badge */}
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.subscription?.type === 'premium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.subscription?.type === 'premium' ? 'Premium' : 'Free'} Plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <TrophyIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-semibold text-gray-900">0%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <TrophyIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <BellIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-semibold text-gray-900">0%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
          </div>
          <div className="card-body">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{user.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Joined</dt>
                <dd className="text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Current Plan</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.subscription?.type === 'premium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.subscription?.type === 'premium' ? 'Premium' : 'Free'}
                </span>
              </div>
              
              {user.subscription?.type === 'premium' && user.subscription.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Expires</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(user.subscription.expiresAt)}
                  </span>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                {user.subscription?.type === 'premium' ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">Manage your subscription</p>
                      <p className="text-xs text-gray-500">Update payment methods or billing</p>
                    </div>
                    <Link to="/settings" className="btn btn-outline text-sm">
                      Manage
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">Upgrade to Premium</p>
                      <p className="text-xs text-gray-500">Unlock advanced features</p>
                    </div>
                    <button className="btn btn-primary text-sm">
                      Upgrade
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Favorite Teams</h4>
              <div className="flex flex-wrap gap-2">
                {user.preferences.favoriteTeams?.length > 0 ? (
                  user.preferences.favoriteTeams.map((team, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {team}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No favorite teams selected</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Notifications</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={user.preferences.notifications}
                    disabled
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enable notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;