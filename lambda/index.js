const AWS = require('aws-sdk');
const { OpenAI } = require('openai');

// Initialize AWS services
const s3 = new AWS.S3();
const ses = new AWS.SES();
const ssm = new AWS.SSM();
const dynamodb = new AWS.DynamoDB.DocumentClient();

// DynamoDB table name
const LOGS_TABLE = 'colorbot-query-logs';

// Cache for parameters to avoid repeated API calls
let cachedParams = null;

// Get secure parameters from Parameter Store
async function getSecureParameters() {
  if (cachedParams) {
    return cachedParams;
  }

  try {
    const paramNames = [
      '/colorbot/openai-api-key',
      '/colorbot/notification-email',
      '/colorbot/s3-bucket-name'
    ];

    const result = await ssm.getParameters({
      Names: paramNames,
      WithDecryption: true
    }).promise();

    const params = {};
    result.Parameters.forEach(param => {
      const key = param.Name.split('/').pop();
      params[key] = param.Value;
    });

    cachedParams = params;
    return params;
  } catch (error) {
    console.error('Error fetching parameters:', error);
    throw new Error('Failed to retrieve configuration parameters');
  }
}

// Initialize OpenAI (will be set after getting parameters)
let openai = null;

// Localized responses
const responses = {
  'en-US': {
    welcome: "Welcome to ColorBot! Tell me what you'd like to color. You can say anything, like 'a dinosaur riding a skateboard' or 'a magical castle with dragons'.",
    help: "I can create custom coloring pages for you! Just describe what you want - it can be simple like 'a cat' or creative like 'a robot cooking pancakes'. I'll create it and send the link to your email!",
    goodbye: "Happy coloring! See you next time!",
    error: "Sorry, I had trouble creating your coloring page. Please try again.",
    inappropriate: "I'm sorry, I can only create kid-friendly coloring pages. Could you ask for something else?",
    creating: "Great idea! I'm creating your coloring page now. I'll send the link to your email!",
    done: "I've created your coloring page and sent the link to your email. Happy coloring!"
  },
  'es-US': {
    welcome: "¡Bienvenido a ColorBot! Dime qué te gustaría colorear. Puedes decir cualquier cosa, como 'un dinosaurio en patineta' o 'un castillo mágico con dragones'.",
    help: "¡Puedo crear páginas para colorear personalizadas! Solo describe lo que quieres - puede ser simple como 'un gato' o creativo como 'un robot cocinando panqueques'. ¡Lo crearé y enviaré el enlace a tu correo!",
    goodbye: "¡Feliz coloreado! ¡Hasta la próxima!",
    error: "Lo siento, tuve problemas para crear tu página para colorear. Por favor, inténtalo de nuevo.",
    inappropriate: "Lo siento, solo puedo crear páginas para colorear apropiadas para niños. ¿Podrías pedir algo diferente?",
    creating: "¡Buena idea! Estoy creando tu página para colorear ahora. ¡Enviaré el enlace a tu correo!",
    done: "He creado tu página para colorear y he enviado el enlace a tu correo. ¡Feliz coloreado!"
  }
};

exports.handler = async (event) => {
  console.log('Request:', JSON.stringify(event, null, 2));

  const request = event.request;
  const locale = event.request.locale || 'en-US';
  const language = responses[locale] || responses['en-US'];

  try {
    // Initialize OpenAI with secure parameters if not already done
    if (!openai) {
      const params = await getSecureParameters();
      openai = new OpenAI({
        apiKey: params['openai-api-key'],
      });
    }

    if (request.type === 'LaunchRequest') {
      return buildResponse(language.welcome, false, locale);
    }

    if (request.type === 'IntentRequest') {
      const intentName = request.intent.name;

      switch (intentName) {
        case 'GenerateColoringPageIntent':
          return await handleGenerateColoringPage(request, locale);

        case 'AMAZON.HelpIntent':
          return buildResponse(language.help, false, locale);

        case 'AMAZON.StopIntent':
        case 'AMAZON.CancelIntent':
          return buildResponse(language.goodbye, true, locale);

        default:
          return buildResponse(language.error, true, locale);
      }
    }

    return buildResponse(language.error, true, locale);
  } catch (error) {
    console.error('Handler error:', error);
    return buildResponse(language.error, true, locale);
  }
};

async function handleGenerateColoringPage(request, locale) {
  const language = responses[locale];
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const params = await getSecureParameters();

    // Extract subject from slot (now accepts free-form input)
    const subjectSlot = request.intent.slots?.subject;
    let utterance = subjectSlot?.value;

    if (!utterance || utterance.trim() === '') {
      const errorMsg = locale === 'es-US'
        ? "No entendí qué quieres colorear. Por favor, describe lo que te gustaría."
        : "I didn't understand what you'd like to color. Please describe what you want.";
      return buildResponse(errorMsg, false, locale);
    }

    console.log(`[${requestId}] Original utterance: ${utterance}`);

    // Step 1: Process utterance through GPT-4o-mini for moderation and prompt refinement
    const processingResult = await processUtterance(utterance, locale, requestId);

    // Log to DynamoDB (async, don't wait)
    logQuery(requestId, utterance, processingResult, locale).catch(err => {
      console.error('Failed to log query:', err);
    });

    // Check moderation result
    if (!processingResult.approved) {
      console.log(`[${requestId}] Request rejected: ${processingResult.moderationNotes}`);
      return buildResponse(language.inappropriate, false, locale);
    }

    console.log(`[${requestId}] Refined prompt: ${processingResult.refinedPrompt}`);

    // Step 2: Generate image using DALL-E 3 with refined prompt
    const imageUrl = await generateColoringPageImage(processingResult.refinedPrompt, requestId);

    // Upload to S3
    const s3Url = await uploadImageToS3(imageUrl, processingResult.subjects.join('-'), params['s3-bucket-name']);

    // Update log with success
    updateLogWithResult(requestId, 'success', s3Url).catch(err => {
      console.error('Failed to update log:', err);
    });

    // Send Email
    await sendEmail(s3Url, utterance, locale, params['notification-email']);

    return buildResponse(language.done, true, locale);

  } catch (error) {
    console.error('Error generating coloring page:', error);

    // Update log with failure
    updateLogWithResult(requestId, 'error', error.message).catch(err => {
      console.error('Failed to update log:', err);
    });

    return buildResponse(language.error, true, locale);
  }
}

/**
 * Process utterance through GPT-4o-mini for moderation and prompt refinement
 */
async function processUtterance(utterance, locale, requestId) {
  const systemPrompt = `You are a content moderator and prompt engineer for a children's coloring page generator.

Your job is to:
1. Determine if the request is appropriate for children (ages 3-12)
2. Extract the main subjects and actions from the request
3. Create an optimized prompt for DALL-E 3 to generate a high-quality coloring page

MODERATION RULES:
- REJECT requests containing violence, weapons, scary/horror themes, adult content, or inappropriate language
- REJECT requests for real people (celebrities, politicians, etc.)
- APPROVE imaginative, playful, educational, or creative requests
- When in doubt about borderline content, lean toward approval if it could be interpreted innocently

PROMPT ENGINEERING RULES:
- Describe each subject as "complete" or "fully visible" to avoid cut-off images
- Specify "cartoon style" and "child-friendly"
- Always include: "Simple black line art on white background. Bold, consistent line weight throughout. No shading, gradients, or filled areas. Large simple shapes easy for children to color. No text or words."
- Make the scene clear and intelligible
- If multiple subjects, describe their spatial relationship

Respond in JSON format:
{
  "approved": true/false,
  "moderationNotes": "Brief explanation of decision",
  "subjects": ["list", "of", "main", "subjects"],
  "action": "what they are doing (if any)",
  "refinedPrompt": "The complete, optimized DALL-E prompt"
}`;

  const userMessage = `Child's request: "${utterance}"
Language: ${locale === 'es-US' ? 'Spanish' : 'English'}

Process this request and return the JSON response.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`[${requestId}] Moderation result:`, JSON.stringify(result));
    return result;

  } catch (error) {
    console.error(`[${requestId}] Error in processUtterance:`, error);
    // On error, return a safe default that allows generation with basic prompt
    return {
      approved: true,
      moderationNotes: "Moderation check failed, using fallback",
      subjects: [utterance],
      action: null,
      refinedPrompt: `A friendly, cartoon-style ${utterance}. Complete figure shown fully. Simple black line art on white background. Bold, consistent line weight throughout. No shading, gradients, or filled areas. Large simple shapes easy for children to color. Child-friendly and whimsical. No text or words.`
    };
  }
}

/**
 * Log query to DynamoDB
 */
async function logQuery(requestId, originalUtterance, processingResult, locale) {
  const item = {
    requestId: requestId,
    timestamp: new Date().toISOString(),
    originalUtterance: originalUtterance,
    locale: locale,
    approved: processingResult.approved,
    moderationNotes: processingResult.moderationNotes,
    subjects: processingResult.subjects,
    refinedPrompt: processingResult.refinedPrompt,
    status: 'processing'
  };

  try {
    await dynamodb.put({
      TableName: LOGS_TABLE,
      Item: item
    }).promise();
    console.log(`[${requestId}] Query logged to DynamoDB`);
  } catch (error) {
    console.error(`[${requestId}] Failed to log to DynamoDB:`, error);
    throw error;
  }
}

/**
 * Update log with generation result
 */
async function updateLogWithResult(requestId, status, resultOrError) {
  try {
    const updateParams = {
      TableName: LOGS_TABLE,
      Key: { requestId: requestId },
      UpdateExpression: 'SET #status = :status, #result = :result, #completedAt = :completedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#result': status === 'success' ? 'imageUrl' : 'error',
        '#completedAt': 'completedAt'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':result': resultOrError,
        ':completedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();
    console.log(`[${requestId}] Log updated with ${status}`);
  } catch (error) {
    console.error(`[${requestId}] Failed to update log:`, error);
    throw error;
  }
}

async function generateColoringPageImage(refinedPrompt, requestId) {
  try {
    console.log(`[${requestId}] Generating image with DALL-E 3`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: refinedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    console.log(`[${requestId}] Image generated successfully`);
    return response.data[0].url;
  } catch (error) {
    console.error(`[${requestId}] OpenAI DALL-E Error:`, error);
    throw new Error('Failed to generate image');
  }
}

async function uploadImageToS3(imageUrl, subject, bucketName) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50);
    const filename = `coloring-pages/${sanitizedSubject}-${timestamp}.png`;

    const uploadParams = {
      Bucket: bucketName,
      Key: filename,
      Body: imageBuffer,
      ContentType: 'image/png'
    };

    const result = await s3.upload(uploadParams).promise();
    return result.Location;

  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload image');
  }
}

async function sendEmail(imageUrl, subject, locale, toEmail) {
  const isSpanish = locale === 'es-US';

  // Truncate subject for email if too long
  const displaySubject = subject.length > 50 ? subject.substring(0, 47) + '...' : subject;

  const emailSubject = isSpanish
    ? `¡Tu página para colorear está lista!`
    : `Your coloring page is ready!`;

  const bodyText = isSpanish
    ? `¡Hola!\n\nTu página para colorear de "${displaySubject}" está lista.\n\nDescárgala aquí: ${imageUrl}\n\n¡Feliz coloreado!\nColorBot`
    : `Hi!\n\nYour "${displaySubject}" coloring page is ready.\n\nDownload it here: ${imageUrl}\n\nHappy coloring!\nColorBot`;

  const bodyHtml = isSpanish
    ? `<html><body><h2>¡Tu página para colorear está lista!</h2><p>Tu página para colorear de <strong>"${displaySubject}"</strong> está lista.</p><p><a href="${imageUrl}">Haz clic aquí para descargar</a></p><p>¡Feliz coloreado!<br>ColorBot</p></body></html>`
    : `<html><body><h2>Your coloring page is ready!</h2><p>Your <strong>"${displaySubject}"</strong> coloring page is ready.</p><p><a href="${imageUrl}">Click here to download</a></p><p>Happy coloring!<br>ColorBot</p></body></html>`;

  try {
    const params = {
      Source: toEmail,
      Destination: {
        ToAddresses: [toEmail]
      },
      Message: {
        Subject: {
          Data: emailSubject,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: bodyText,
            Charset: 'UTF-8'
          },
          Html: {
            Data: bodyHtml,
            Charset: 'UTF-8'
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    console.log('Email sent successfully');

  } catch (error) {
    console.error('Email Error:', error);
  }
}

function buildResponse(speechText, shouldEndSession, locale, directives = []) {
  return {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: speechText
      },
      directives: directives,
      shouldEndSession: shouldEndSession
    },
    sessionAttributes: {
      locale: locale
    }
  };
}
