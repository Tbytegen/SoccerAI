import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  PlayIcon,
  ClockIcon,
  Cog6ToothIcon,
  UserIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  premiumOnly?: boolean;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Predictions',
    href: '/predictions',
    icon: BoltIcon,
    badge: 'Live',
  },
  {
    name: 'Live Match',
    href: '/live-match',
    icon: PlayIcon,
    badge: 'Live',
    premiumOnly: true,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    premiumOnly: true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserIcon,
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    return location.pathname === href || 
           (href !== '/dashboard' && location.pathname.startsWith(href));
  };

  return (
    <div className="sidebar hidden md:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BoltIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">SoccerAI</h2>
              <p className="text-xs text-gray-500">Prediction Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''} group relative`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                
                {/* Badge */}
                {item.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {item.badge}
                  </span>
                )}
                
                {/* Premium badge */}
                {item.premiumOnly && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pro
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Premium upgrade section */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-semibold mb-1">Upgrade to Premium</h3>
            <p className="text-xs text-blue-100 mb-3">
              Unlock advanced analytics and live match tracking
            </p>
            <button className="w-full bg-white text-blue-600 text-xs font-medium py-2 px-3 rounded-md hover:bg-blue-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Version 1.0.0</span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;