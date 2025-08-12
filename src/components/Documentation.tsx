import React, { useState } from 'react';
import { Book, Cloud, Key, Code, Settings, CheckCircle, Copy, ExternalLink, Shield } from 'lucide-react';

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', name: 'Overview', icon: Book },
    { id: 'security', name: 'Security Setup', icon: Shield },
    { id: 'aws-setup', name: 'AWS Setup', icon: Cloud },
    { id: 'alexa-skill', name: 'Alexa Skill', icon: Settings },
    { id: 'deployment', name: 'Deployment', icon: Code },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Navigation */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sticky top-8">
          <h3 className="font-bold text-gray-900 mb-4">Setup Guide</h3>
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 rounded-xl text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <section.icon className="w-4 h-4 mr-2" />
                {section.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">ColorBot Alexa Skill Overview</h2>
                <p className="text-gray-600 mb-6">
                  This skill allows children to request custom coloring pages through voice commands. 
                  The system generates black-and-white, line-art images suitable for coloring using OpenAI's API.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <h3 className="font-bold text-purple-900 mb-3">Key Features</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Voice-activated image generation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Bilingual support (EN/ES)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Direct printing via Alexa
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      SMS notifications with links
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <h3 className="font-bold text-blue-900 mb-3">Architecture</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      AWS Lambda Functions
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Amazon S3 Storage
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      AWS SNS Messaging
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      OpenAI API Integration
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Prerequisites</h4>
                <ul className="text-yellow-700 space-y-1">
                  <li>• AWS Account with appropriate permissions</li>
                  <li>• Amazon Developer Account for Alexa Skills</li>
                  <li>• OpenAI API key</li>
                  <li>• Phone number for SMS testing</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Secure Configuration Setup</h2>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white mb-6">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 mr-2" />
                  <h3 className="text-xl font-bold">AWS Parameter Store Security</h3>
                </div>
                <p className="text-green-100">
                  All sensitive data (API keys, phone numbers) are stored encrypted in AWS Parameter Store, 
                  not as plain text environment variables.
                </p>
              </div>

              <div className="space-y-8">
                {/* Step 1: Set Environment Variables */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Set Your Credentials Locally</h3>
                  <p className="text-gray-600 mb-4">First, set these as temporary shell variables (they won't be stored permanently):</p>
                  
                  <div className="bg-gray-900 rounded-xl p-4 relative">
                    <button 
                      onClick={() => copyToClipboard(`export OPENAI_API_KEY="sk-your-openai-key-here"
export SMS_PHONE_NUMBER="+1234567890"
export S3_BUCKET_NAME="my-coloring-bucket"
export AWS_ACCOUNT_ID="123456789012"`)}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`export OPENAI_API_KEY="sk-your-openai-key-here"
export SMS_PHONE_NUMBER="+1234567890"
export S3_BUCKET_NAME="my-coloring-bucket"
export AWS_ACCOUNT_ID="123456789012"`}
                    </pre>
                  </div>
                </div>

                {/* Step 2: Run Security Setup */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Deploy with Secure Storage</h3>
                  <p className="text-gray-600 mb-4">The deployment script automatically stores sensitive data in Parameter Store:</p>
                  
                  <div className="bg-gray-900 rounded-xl p-4 relative">
                    <button 
                      onClick={() => copyToClipboard(`cd deployment
chmod +x deploy.sh
./deploy.sh`)}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`cd deployment
chmod +x deploy.sh
./deploy.sh`}
                    </pre>
                  </div>
                </div>

                {/* Security Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-3">✅ What's Secure</h4>
                    <ul className="space-y-2 text-green-800 text-sm">
                      <li>• OpenAI API key encrypted at rest</li>
                      <li>• Phone number encrypted at rest</li>
                      <li>• No secrets in Lambda environment variables</li>
                      <li>• IAM permissions follow least privilege</li>
                      <li>• Automatic parameter caching in Lambda</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">🔍 Parameter Store Paths</h4>
                    <ul className="space-y-2 text-blue-800 text-sm font-mono">
                      <li>/colorbot/openai-api-key</li>
                      <li>/colorbot/sms-phone-number</li>
                      <li>/colorbot/s3-bucket-name</li>
                    </ul>
                  </div>
                </div>

                {/* Verification */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Verify Secure Storage</h3>
                  <p className="text-gray-600 mb-4">Check that your parameters were stored correctly:</p>
                  
                  <div className="bg-gray-900 rounded-xl p-4 relative">
                    <button 
                      onClick={() => copyToClipboard(`aws ssm get-parameters \\
  --names '/colorbot/openai-api-key' '/colorbot/sms-phone-number' '/colorbot/s3-bucket-name' \\
  --with-decryption`)}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`aws ssm get-parameters \\
  --names '/colorbot/openai-api-key' '/colorbot/sms-phone-number' '/colorbot/s3-bucket-name' \\
  --with-decryption`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'aws-setup' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">AWS Services Setup</h2>

              <div className="space-y-8">
                {/* IAM Role */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. IAM Role Configuration</h3>
                  <p className="text-gray-600 mb-4">The Lambda function needs these permissions (automatically configured by deployment script):</p>
                  
                  <div className="bg-gray-900 rounded-xl p-4 relative">
                    <button 
                      onClick={() => copyToClipboard(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-coloring-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:*:*:parameter/colorbot/openai-api-key",
        "arn:aws:ssm:*:*:parameter/colorbot/sms-phone-number",
        "arn:aws:ssm:*:*:parameter/colorbot/s3-bucket-name"
      ]
    }
  ]
}`)}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-coloring-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:*:*:parameter/colorbot/openai-api-key",
        "arn:aws:ssm:*:*:parameter/colorbot/sms-phone-number",
        "arn:aws:ssm:*:*:parameter/colorbot/s3-bucket-name"
      ]
    }
  ]
}`}
                    </pre>
                  </div>
                </div>

                {/* S3 Bucket */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. S3 Bucket Setup</h3>
                  <p className="text-gray-600 mb-4">Create an S3 bucket with public read access for generated images:</p>
                  
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Bucket Policy</h4>
                    <div className="bg-gray-900 rounded-lg p-3 relative">
                      <button 
                        onClick={() => copyToClipboard(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-coloring-bucket/*"
    }
  ]
}`)}
                        className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded"
                      >
                        <Copy className="w-3 h-3 text-white" />
                      </button>
                      <pre className="text-green-400 text-xs overflow-x-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-coloring-bucket/*"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Parameter Store */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Parameter Store Configuration</h3>
                  <p className="text-gray-600 mb-4">Sensitive data is stored encrypted in Parameter Store:</p>
                  
                  <div className="bg-gray-100 rounded-xl p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Parameter</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr>
                          <td className="py-2 font-mono text-sm bg-white px-2 rounded">/colorbot/openai-api-key</td>
                          <td className="py-2 text-green-600 font-semibold">SecureString</td>
                          <td className="py-2">OpenAI API key (encrypted)</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-sm bg-white px-2 rounded">/colorbot/sms-phone-number</td>
                          <td className="py-2 text-green-600 font-semibold">SecureString</td>
                          <td className="py-2">SMS phone number (encrypted)</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-sm bg-white px-2 rounded">/colorbot/s3-bucket-name</td>
                          <td className="py-2 text-blue-600 font-semibold">String</td>
                          <td className="py-2">S3 bucket name</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'alexa-skill' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Alexa Skill Configuration</h2>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Invocation Names</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">English (en-US)</h4>
                      <p className="bg-white bg-opacity-20 rounded-lg p-2">"ColorBot"</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Spanish (es-US)</h4>
                      <p className="bg-white bg-opacity-20 rounded-lg p-2">"ColorBot"</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Sample Utterances</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">English</h4>
                      <ul className="space-y-2 text-blue-800 text-sm">
                        <li>print me a {subject} to color</li>
                        <li>I want a {subject} coloring page</li>
                        <li>make me a {subject}</li>
                        <li>create a {subject} for coloring</li>
                        <li>give me a {subject}</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-semibold text-green-900 mb-3">Spanish</h4>
                      <ul className="space-y-2 text-green-800 text-sm">
                        <li>imprímeme un {subject} para colorear</li>
                        <li>quiero una página de {subject} para colorear</li>
                        <li>hazme un {subject}</li>
                        <li>crea un {subject} para colorear</li>
                        <li>dame un {subject}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Intent Schema</h3>
                  <div className="bg-gray-900 rounded-xl p-4 relative">
                    <button 
                      onClick={() => copyToClipboard(`{
  "intents": [
    {
      "name": "AMAZON.CancelIntent",
      "samples": []
    },
    {
      "name": "AMAZON.HelpIntent",
      "samples": []
    },
    {
      "name": "AMAZON.StopIntent",
      "samples": []
    },
    {
      "name": "GenerateColoringPageIntent",
      "slots": [
        {
          "name": "subject",
          "type": "COLORING_SUBJECTS"
        }
      ],
      "samples": [
        "print me a {subject} to color",
        "I want a {subject} coloring page",
        "make me a {subject}",
        "create a {subject} for coloring",
        "give me a {subject}"
      ]
    }
  ]
}`)}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`{
  "intents": [
    {
      "name": "AMAZON.CancelIntent",
      "samples": []
    },
    {
      "name": "AMAZON.HelpIntent", 
      "samples": []
    },
    {
      "name": "AMAZON.StopIntent",
      "samples": []
    },
    {
      "name": "GenerateColoringPageIntent",
      "slots": [
        {
          "name": "subject",
          "type": "COLORING_SUBJECTS"
        }
      ],
      "samples": [
        "print me a {subject} to color",
        "I want a {subject} coloring page",
        "make me a {subject}",
        "create a {subject} for coloring", 
        "give me a {subject}"
      ]
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'deployment' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Deployment Steps</h2>

              <div className="space-y-8">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Step-by-Step Deployment</h3>
                  <ol className="space-y-4 text-green-700">
                    <li className="flex items-start">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                      <div>
                        <strong>Set Environment Variables:</strong>
                        <p className="text-sm mt-1">Export your API keys and configuration locally</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                      <div>
                        <strong>Run Deployment Script:</strong>
                        <p className="text-sm mt-1">Automatically creates all AWS resources and stores secrets securely</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                      <div>
                        <strong>Create Alexa Skill:</strong>
                        <p className="text-sm mt-1">Set up skill in Amazon Developer Console</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                      <div>
                        <strong>Configure Endpoints:</strong>
                        <p className="text-sm mt-1">Link Lambda ARN to Alexa skill endpoints</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                      <div>
                        <strong>Test & Certify:</strong>
                        <p className="text-sm mt-1">Test thoroughly and submit for certification</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Quick Deploy Commands</h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded p-2">
                        <code className="text-sm">export OPENAI_API_KEY="sk-..."</code>
                      </div>
                      <div className="bg-white rounded p-2">
                        <code className="text-sm">cd deployment && ./deploy.sh</code>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-900 mb-3">Resources</h4>
                    <div className="space-y-2">
                      <a href="#" className="flex items-center text-purple-700 hover:text-purple-900 text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Alexa Skills Kit Documentation
                      </a>
                      <a href="#" className="flex items-center text-purple-700 hover:text-purple-900 text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        AWS Parameter Store Guide
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;