import React, { useState } from 'react';
import { Play, Mic, Volume2, Download, MessageSquare, Printer, CheckCircle } from 'lucide-react';

const SkillTester = () => {
  const [testPhrase, setTestPhrase] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const samplePhrases = {
    'en-US': [
      'Alexa, ask ColorBot to print me a dinosaur to color',
      'Alexa, tell ColorBot I want a unicorn coloring page',
      'Alexa, ask ColorBot for a butterfly',
      'Alexa, tell ColorBot to make me a dragon'
    ],
    'es-US': [
      'Alexa, pide a ColorBot que imprima un dinosaurio para colorear',
      'Alexa, dile a ColorBot que quiero una página de unicornio para colorear',
      'Alexa, pide a ColorBot una mariposa',
      'Alexa, dile a ColorBot que me haga un dragón'
    ]
  };

  const handleTest = async () => {
    if (!testPhrase.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setResult({
        detected: extractSubject(testPhrase),
        imageUrl: 'https://example-bucket.s3.amazonaws.com/coloring-pages/generated-image.png',
        printerStatus: 'connected',
        smsStatus: 'sent',
        response: language === 'en-US' 
          ? `Great! I'm creating a ${extractSubject(testPhrase)} coloring page for you. I'll print it and send the link to your phone!`
          : `¡Genial! Estoy creando una página para colorear de ${extractSubject(testPhrase)}. ¡La imprimiré y enviaré el enlace a tu teléfono!`
      });
      setIsProcessing(false);
    }, 2000);
  };

  const extractSubject = (phrase: string) => {
    const subjects = ['dinosaur', 'unicorn', 'butterfly', 'dragon', 'dinosaurio', 'unicornio', 'mariposa', 'dragón'];
    const found = subjects.find(subject => phrase.toLowerCase().includes(subject));
    return found || 'coloring page';
  };

  return (
    <div className="space-y-8">
      {/* Test Interface */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Skill Testing Interface</h2>
        
        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="en-US">English (US)</option>
              <option value="es-US">Español (US)</option>
            </select>
          </div>

          {/* Test Phrase Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Phrase</label>
            <div className="relative">
              <input
                type="text"
                value={testPhrase}
                onChange={(e) => setTestPhrase(e.target.value)}
                placeholder={language === 'en-US' 
                  ? 'Enter your voice command...' 
                  : 'Ingresa tu comando de voz...'}
                className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Mic className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Sample Phrases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sample Phrases</label>
            <div className="grid gap-2">
              {samplePhrases[language].map((phrase, index) => (
                <button
                  key={index}
                  onClick={() => setTestPhrase(phrase)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm transition-colors"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={!testPhrase.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Test Skill
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Test Results</h3>
          
          <div className="space-y-4">
            {/* Alexa Response */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Volume2 className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-900">Alexa Response</span>
              </div>
              <p className="text-blue-800">"{result.response}"</p>
            </div>

            {/* Processing Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-900">Image Generated</span>
                </div>
                <p className="text-sm text-green-700">Subject: {result.detected}</p>
                <button className="mt-2 text-green-600 hover:text-green-800 flex items-center text-sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Printer className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-purple-900">Printer Status</span>
                </div>
                <p className="text-sm text-purple-700">
                  {result.printerStatus === 'connected' ? 'Printing...' : 'Not connected'}
                </p>
              </div>

              <div className="bg-pink-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <MessageSquare className="w-5 h-5 text-pink-600 mr-2" />
                  <span className="font-semibold text-pink-900">SMS Status</span>
                </div>
                <p className="text-sm text-pink-700">
                  {result.smsStatus === 'sent' ? 'Link sent!' : 'Failed to send'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillTester;