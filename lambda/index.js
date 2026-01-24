const AWS = require('aws-sdk');
const { OpenAI } = require('openai');

// Initialize AWS services
const s3 = new AWS.S3();
const ses = new AWS.SES();
const ssm = new AWS.SSM();

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
      WithDecryption: true // Decrypt SecureString parameters
    }).promise();

    const params = {};
    result.Parameters.forEach(param => {
      const key = param.Name.split('/').pop(); // Get last part of parameter name
      params[key] = param.Value;
    });

    // Cache the parameters for the lifetime of this Lambda execution
    cachedParams = params;
    return params;
  } catch (error) {
    console.error('Error fetching parameters:', error);
    throw new Error('Failed to retrieve configuration parameters');
  }
}

// Initialize OpenAI (will be set after getting parameters)
let openai = null;

// Environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Localized responses
const responses = {
  'en-US': {
    welcome: "Welcome to ColorBot! You can ask me to create coloring pages. For example, say 'print me a dinosaur to color'.",
    help: "I can create custom coloring pages for you! Just say something like 'make me a unicorn' or 'I want a dragon coloring page'. I'll generate it, print it if you have a printer connected, and send you the link!",
    goodbye: "Happy coloring! See you next time!",
    error: "Sorry, I had trouble creating your coloring page. Please try again.",
    generating: "Great! I'm creating a {subject} coloring page for you. I'll print it and send the link to your email!",
    noPrinter: "I've created your {subject} coloring page and sent the link to your email. To print directly next time, you can connect a printer in your Alexa app.",
    printError: "I created your coloring page but couldn't print it. I've sent the link to your email instead."
  },
  'es-US': {
    welcome: "¡Bienvenido a ColorBot! Puedes pedirme que cree páginas para colorear. Por ejemplo, di 'imprímeme un dinosaurio para colorear'.",
    help: "¡Puedo crear páginas para colorear personalizadas! Solo di algo como 'hazme un unicornio' o 'quiero una página de dragón para colorear'. ¡La generaré, la imprimiré si tienes una impresora conectada y te enviaré el enlace!",
    goodbye: "¡Feliz coloreado! ¡Hasta la próxima!",
    error: "Lo siento, tuve problemas para crear tu página para colorear. Por favor, inténtalo de nuevo.",
    generating: "¡Genial! Estoy creando una página para colorear de {subject}. ¡La imprimiré y enviaré el enlace a tu correo!",
    noPrinter: "He creado tu página para colorear de {subject} y he enviado el enlace a tu correo. Para imprimir directamente la próxima vez, puedes conectar una impresora en tu aplicación Alexa.",
    printError: "Creé tu página para colorear pero no pude imprimirla. He enviado el enlace a tu correo en su lugar."
  }
};

// Subject translations for Spanish prompts
const subjectTranslations = {
  'dinosaurio': 'dinosaur',
  'unicornio': 'unicorn', 
  'mariposa': 'butterfly',
  'dragón': 'dragon',
  'gato': 'cat',
  'perro': 'dog',
  'pájaro': 'bird',
  'flor': 'flower',
  'árbol': 'tree',
  'casa': 'house',
  'carro': 'car',
  'avión': 'airplane',
  'barco': 'boat',
  'castillo': 'castle',
  'princesa': 'princess',
  'príncipe': 'prince',
  'superhéroe': 'superhero',
  'robot': 'robot',
  'monstruo': 'monster',
  'extraterrestre': 'alien'
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
  
  try {
    // Get secure parameters
    const params = await getSecureParameters();
    
    // Extract subject from slot
    const subjectSlot = request.intent.slots?.subject;
    let subject = subjectSlot?.value;
    
    // Validate that subject was provided
    if (!subject || subject.trim() === '') {
      const errorMsg = locale === 'es-US' 
        ? "No entendí qué quieres colorear. Por favor, di algo como 'imprímeme un dinosaurio para colorear'."
        : "I didn't understand what you'd like to color. Please say something like 'print me a dinosaur to color'.";
      return buildResponse(errorMsg, false, locale);
    }
    
    // Translate Spanish subjects to English for OpenAI API
    const englishSubject = subjectTranslations[subject.toLowerCase()] || subject;
    
    // Generate image using OpenAI
    const imageUrl = await generateColoringPageImage(englishSubject);
    
    // Upload to S3
    const s3Url = await uploadImageToS3(imageUrl, englishSubject, params['s3-bucket-name']);
    
    // Send Email
    await sendEmail(s3Url, subject, locale, params['notification-email']);
    
    // Build response (without print directive for simulator compatibility)
    const speechText = language.noPrinter.replace('{subject}', subject);

    return buildResponse(speechText, true, locale);
    
  } catch (error) {
    console.error('Error generating coloring page:', error);
    return buildResponse(language.error, true, locale);
  }
}

async function generateColoringPageImage(subject) {
  const prompt = `Create a simple, black and white line art drawing of a ${subject} suitable for children to color. The image should be:
- Simple line art with clear, bold outlines
- Black lines on white background only
- No shading, gradients, or filled areas
- Child-friendly and cartoon-style
- Large, simple shapes that are easy to color
- No text or words in the image`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    return response.data[0].url;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate image');
  }
}

async function uploadImageToS3(imageUrl, subject, bucketName) {
  try {
    // Download image from OpenAI
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Convert response to Buffer for S3 upload
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    // Generate unique filename (sanitize subject to remove spaces and special chars)
    const timestamp = Date.now();
    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `coloring-pages/${sanitizedSubject}-${timestamp}.png`;
    
    // Upload to S3
    // Note: ACLs are disabled on this bucket, public access is handled via bucket policy
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

  const emailSubject = isSpanish
    ? `¡Tu página para colorear de ${subject} está lista!`
    : `Your ${subject} coloring page is ready!`;

  const bodyText = isSpanish
    ? `¡Hola!\n\nTu página para colorear de ${subject} está lista.\n\nDescárgala aquí: ${imageUrl}\n\n¡Feliz coloreado!\nColorBot`
    : `Hi!\n\nYour ${subject} coloring page is ready.\n\nDownload it here: ${imageUrl}\n\nHappy coloring!\nColorBot`;

  const bodyHtml = isSpanish
    ? `<html><body><h2>¡Tu página para colorear está lista!</h2><p>Tu página para colorear de <strong>${subject}</strong> está lista.</p><p><a href="${imageUrl}">Haz clic aquí para descargar</a></p><p>¡Feliz coloreado!<br>ColorBot</p></body></html>`
    : `<html><body><h2>Your coloring page is ready!</h2><p>Your <strong>${subject}</strong> coloring page is ready.</p><p><a href="${imageUrl}">Click here to download</a></p><p>Happy coloring!<br>ColorBot</p></body></html>`;

  try {
    const params = {
      Source: toEmail, // Using same email as source (must be verified in SES)
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
    // Don't throw error - email failure shouldn't break the main flow
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

function buildResponseWithPrintDirective(speechText, imageUrl, subject, locale) {
  const printDirective = {
    type: 'Connections.StartConnection',
    uri: 'connection://AMAZON.PrintImage/1',
    input: {
      '@type': 'PrintImageRequest',
      '@version': '1',
      title: locale === 'es-US' ? `Página para colorear de ${subject}` : `${subject} Coloring Page`,
      description: locale === 'es-US' 
        ? `Una página para colorear personalizada de ${subject}`
        : `A custom ${subject} coloring page`,
      imageUrl: imageUrl,
      imageType: 'PNG'
    },
    token: `print-${Date.now()}`
  };

  return buildResponse(speechText, false, locale, [printDirective]);
}