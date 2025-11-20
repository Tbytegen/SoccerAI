import React, { useState } from 'react';
import { 
  CogIcon, 
  BellIcon, 
  UserIcon, 
  ShieldCheckIcon,
  DocumentTextIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'data', name: 'Data & Privacy', icon: DocumentTextIcon },
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      defaultValue={user?.firstName || ''}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      defaultValue={user?.lastName || ''}
                      className="form-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="form-input"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    defaultValue={user?.username || ''}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">App Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Language</label>
                  <select className="form-input">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Time Zone</label>
                  <select className="form-input">
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (Central European Time)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Date Format</label>
                  <select className="form-input">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Favorite Teams</h3>
              <div>
                <label className="form-label">Add Favorite Teams</label>
                <input
                  type="text"
                  placeholder="Search and add teams..."
                  className="form-input"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {user?.preferences.favoriteTeams?.map((team, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {team}
                      <button className="ml-2 text-blue-600 hover:text-blue-800">
                        ×
                      </button>
                    </span>
                  )) || []}
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={user?.preferences.notifications}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Match Results</h4>
                    <p className="text-sm text-gray-500">Get notified when your predictions are resolved</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Performance Updates</h4>
                    <p className="text-sm text-gray-500">Weekly performance summary</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">New Features</h4>
                    <p className="text-sm text-gray-500">Stay updated with new features</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" />
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Enable 2FA</h4>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <button className="btn btn-outline">
                  Setup 2FA
                </button>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {user?.subscription?.type === 'premium' ? 'Premium Plan' : 'Free Plan'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {user?.subscription?.type === 'premium' 
                        ? 'Full access to all features'
                        : 'Limited access to basic features'
                      }
                    </p>
                    {user?.subscription?.expiresAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div>
                    {user?.subscription?.type === 'premium' ? (
                      <button className="btn btn-outline">
                        Manage Subscription
                      </button>
                    ) : (
                      <button className="btn btn-primary">
                        Upgrade to Premium
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {user?.subscription?.type === 'premium' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Billing History</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Premium Plan</p>
                      <p className="text-xs text-gray-500">January 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">$9.99</p>
                      <p className="text-xs text-green-600">Paid</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Export Predictions</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Download your prediction history and performance data
                  </p>
                  <button className="btn btn-outline">
                    Export CSV
                  </button>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Export Analytics</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Download detailed analytics and insights
                  </p>
                  <button className="btn btn-outline">
                    Export Report
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Permanently delete your account and all associated data
                  </p>
                  <button className="btn btn-danger">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-body">
              {renderTabContent()}
              
              {/* Save Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button className="btn btn-outline">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;