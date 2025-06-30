import React, { useState } from 'react';
import { Play, Mic, Volume2, Download, MessageSquare, Printer, CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';

const SkillTester = () => {
  const [testPhrase, setTestPhrase] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

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

  const commonErrors = [
    {
      type: 'deployment',
      title: 'Lambda Function Not Deployed',
      description: 'The AWS Lambda function hasn\'t been created yet',
      solution: 'Run the deployment script: cd deployment && ./deploy.sh',
      status: 'critical'
    },
    {
      type: 'parameters',
      title: 'Missing Parameter Store Values',
      description: 'OpenAI API key or phone number not configured',
      solution: 'Set environment variables and run setup-parameters.sh',
      status: 'critical'
    },
    {
      type: 'alexa-skill',
      title: 'Alexa Skill Not Created',
      description: 'Skill not set up in Amazon Developer Console',
      solution: 'Create skill and upload interaction models',
      status: 'warning'
    },
    {
      type: 'openai-credits',
      title: 'OpenAI API Credits Exhausted',
      description: 'No remaining credits for image generation',
      solution: 'Add credits to your OpenAI account',
      status: 'warning'
    },
    {
      type: 'iam-permissions',
      title: 'IAM Permission Issues',
      description: 'Lambda doesn\'t have required AWS permissions',
      solution: 'Check IAM role has S3, SNS, and Parameter Store access',
      status: 'error'
    }
  ];

  const handleTest = async () => {
    if (!testPhrase.trim()) return;
    
    setIsProcessing(true);
    setErrors([]);
    
    try {
      // This would be a real API call to test the Lambda function
      // For now, we'll simulate realistic scenarios
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate different test scenarios
      const scenarios = [
        {
          success: true,
          detected: extractSubject(testPhrase),
          imageUrl: 'https://example-bucket.s3.amazonaws.com/coloring-pages/generated-image.png',
          printerStatus: 'connected',
          smsStatus: 'sent',
          response: language === 'en-US' 
            ? `Great! I'm creating a ${extractSubject(testPhrase)} coloring page for you. I'll print it and send the link to your phone!`
            : `¡Genial! Estoy creando una página para colorear de ${extractSubject(testPhrase)}. ¡La imprimiré y enviaré el enlace a tu teléfono!`
        },
        {
          success: false,
          error: 'Lambda function not found',
          details: 'The ColorBot Lambda function hasn\'t been deployed to AWS yet.'
        },
        {
          success: false,
          error: 'Parameter Store access denied',
          details: 'Cannot retrieve OpenAI API key from Parameter Store. Check IAM permissions.'
        }
      ];
      
      // For demo, randomly pick a scenario (in real implementation, this would be actual API response)
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      if (scenario.success) {
        setResult(scenario);
      } else {
        setErrors([{
          type: 'runtime',
          title: scenario.error,
          description: scenario.details,
          status: 'critical'
        }]);
      }
      
    } catch (error) {
      setErrors([{
        type: 'network',
        title: 'Network Error',
        description: 'Failed to connect to AWS Lambda function',
        status: 'critical'
      }]);
    }
    
    setIsProcessing(false);
  };

  const extractSubject = (phrase: string) => {
    const subjects = ['dinosaur', 'unicorn', 'butterfly', 'dragon', 'dinosaurio', 'unicornio', 'mariposa', 'dragón'];
    const found = subjects.find(subject => phrase.toLowerCase().includes(subject));
    return found || 'coloring page';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Status */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">⚠️ Testing Status</h2>
        <div className="bg-white bg-opacity-20 rounded-xl p-4">
          <p className="mb-2">
            <strong>Current Test Mode:</strong> Simulated responses only
          </p>
          <p className="text-sm text-blue-100">
            To test the real skill, you need to:
          </p>
          <ol className="text-sm text-blue-100 mt-2 space-y-1">
            <li>1. Deploy the Lambda function to AWS</li>
            <li>2. Create the Alexa skill in Developer Console</li>
            <li>3. Test via Alexa Simulator or physical device</li>
          </ol>
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Common Setup Issues</h3>
        <div className="space-y-4">
          {commonErrors.map((error, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                {getStatusIcon(error.status)}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{error.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{error.description}</p>
                  <div className="mt-2 bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-700">
                      <strong>Solution:</strong> {error.solution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                Testing (Simulated)...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Test Skill (Simulated)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Results */}
      {errors.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6">
          <h3 className="text-xl font-bold text-red-900 mb-4">Test Errors</h3>
          <div className="space-y-4">
            {errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">{error.title}</h4>
                    <p className="text-red-700 text-sm mt-1">{error.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Results */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Test Results (Simulated)</h3>
          
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
                <p className="text-xs text-green-600 mt-1">(Simulated URL)</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Printer className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-purple-900">Printer Status</span>
                </div>
                <p className="text-sm text-purple-700">
                  {result.printerStatus === 'connected' ? 'Would print...' : 'Not connected'}
                </p>
              </div>

              <div className="bg-pink-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <MessageSquare className="w-5 h-5 text-pink-600 mr-2" />
                  <span className="font-semibold text-pink-900">SMS Status</span>
                </div>
                <p className="text-sm text-pink-700">
                  {result.smsStatus === 'sent' ? 'Would send SMS...' : 'Failed to send'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Testing Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">🔧 For Real Testing</h3>
        <div className="space-y-3 text-yellow-800">
          <p><strong>1. Deploy to AWS:</strong> Run the deployment script to create actual Lambda function</p>
          <p><strong>2. Create Alexa Skill:</strong> Set up in Amazon Developer Console with your Lambda ARN</p>
          <p><strong>3. Test Methods:</strong></p>
          <ul className="ml-6 space-y-1 text-sm">
            <li>• Use Alexa Simulator in Developer Console</li>
            <li>• Test on physical Alexa device</li>
            <li>• Check CloudWatch logs for errors</li>
            <li>• Monitor S3 bucket for generated images</li>
          </ul>
          <div className="mt-4">
            <a 
              href="https://developer.amazon.com/alexa/console/ask" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-yellow-700 hover:text-yellow-900 font-medium"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open Alexa Developer Console
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTester;