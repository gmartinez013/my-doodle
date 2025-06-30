import React, { useState } from 'react';
import { Palette, Printer, MessageSquare, Settings, Play, Download, AlertCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SkillTester from './components/SkillTester';
import Documentation from './components/Documentation';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Palette },
    { id: 'tester', name: 'Skill Tester', icon: Play },
    { id: 'docs', name: 'Setup Guide', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg">
              <Palette className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            ColorBot Alexa Skill
          </h1>
          <p className="text-gray-600 text-lg">
            "Alexa, print me a dinosaur to color!" - Voice-activated coloring pages for kids
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'tester' && <SkillTester />}
          {activeTab === 'docs' && <Documentation />}
        </div>
      </div>
    </div>
  );
}

export default App;