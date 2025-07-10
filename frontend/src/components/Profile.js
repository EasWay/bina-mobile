import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Settings, LogOut, Bell, Shield, HelpCircle } from 'lucide-react';

function Profile() {
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500 mt-2">
            Joined {user?.created_at ? formatDate(user.created_at) : 'N/A'}
          </p>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Account Manager</h3>
            <p className="text-sm text-gray-600">Business Owner</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Verified</h3>
            <p className="text-sm text-gray-600">Account Status</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 p-6 pb-4">Account</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Personal Information</span>
                </div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Settings</span>
                </div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </button>
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Notifications</span>
                </div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 p-6 pb-4">Support</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Help Center</span>
                </div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </button>
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Privacy Policy</span>
                </div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </button>
            </div>
          </div>

          <div className="card">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-red-50 transition-colors text-red-600"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Push Notifications</span>
                <div className="w-12 h-6 bg-primary-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Email Notifications</span>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Dark Mode</span>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex space-x-4">
              <button className="flex-1 btn-primary">Save Changes</button>
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;