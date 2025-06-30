import React, { useState } from 'react';
import { Palette, Printer, MessageSquare, Globe, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const [skillStatus] = useState({
    deployed: true,
    lastGenerated: '2 minutes ago',
    totalRequests: 47,
    todayRequests: 12,
    printerConnected: true,
    smsEnabled: true
  });

  const recentRequests = [
    { id: 1, request: 'unicorn', language: 'en-US', status: 'completed', time: '2 min ago' },
    { id: 2, request: 'dinosaurio', language: 'es-US', status: 'completed', time: '5 min ago' },
    { id: 3, request: 'dragon', language: 'en-US', status: 'printing', time: '8 min ago' },
    { id: 4, request: 'mariposa', language: 'es-US', status: 'completed', time: '12 min ago' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'printing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{skillStatus.totalRequests}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Total Requests</h3>
          <p className="text-sm text-gray-600">{skillStatus.todayRequests} today</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Printer className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`w-3 h-3 rounded-full ${skillStatus.printerConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Printer Status</h3>
          <p className="text-sm text-gray-600">{skillStatus.printerConnected ? 'Connected' : 'Disconnected'}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className={`w-3 h-3 rounded-full ${skillStatus.smsEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">SMS Delivery</h3>
          <p className="text-sm text-gray-600">{skillStatus.smsEnabled ? 'Active' : 'Inactive'}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-pink-100 p-3 rounded-xl">
              <Globe className="w-6 h-6 text-pink-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">EN/ES</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Languages</h3>
          <p className="text-sm text-gray-600">Bilingual support</p>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
          <p className="text-gray-600">Latest coloring page generations</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentRequests.map((request) => (
            <div key={request.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="font-medium text-gray-900">"{request.request}"</p>
                    <p className="text-sm text-gray-600">
                      {request.language} • {request.time}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : request.status === 'printing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur rounded-xl p-4 transition-all">
            <h3 className="font-semibold mb-2">Test Skill</h3>
            <p className="text-sm text-purple-100">Simulate voice requests</p>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur rounded-xl p-4 transition-all">
            <h3 className="font-semibold mb-2">View Logs</h3>
            <p className="text-sm text-purple-100">Check Lambda logs</p>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur rounded-xl p-4 transition-all">
            <h3 className="font-semibold mb-2">Settings</h3>
            <p className="text-sm text-purple-100">Configure skill options</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;