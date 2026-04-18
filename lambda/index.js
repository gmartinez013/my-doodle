const AWS = require('aws-sdk');
const { OpenAI } = require('openai');
const PDFDocument = require('pdfkit');

// Initialize AWS services
const s3 = new AWS.S3();
const ses = new AWS.SES();
const ssm = new AWS.SSM();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const LOGS_TABLE = 'colorbot-query-logs';

let cachedParams = null;
let openai = null;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

async function getSecureParameters() {
  if (cachedParams) return cachedParams;

  const paramNames = [
    '/colorbot/openai-api-key',
    '/colorbot/notification-email',
    '/colorbot/s3-bucket-name',
    '/colorbot/printnode-api-key',
    '/colorbot/printnode-printer-id',
    '/colorbot/hp-eprint-email'
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
}

exports.handler = async (event) => {
  console.log('Request:', JSON.stringify(event, null, 2));
  return handleHttpRequest(event);
};

async function handleHttpRequest(event) {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path = event.requestContext?.http?.path || event.path || '/';

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    if (!openai) {
      const params = await getSecureParameters();
      openai = new OpenAI({ apiKey: params['openai-api-key'] });
    }

    if (method === 'GET' && path === '/api/config') {
      return await handleConfig();
    }
    if (method === 'POST' && path === '/api/generate') {
      const body = JSON.parse(event.body || '{}');
      return await handleGenerate(body);
    }
    if (method === 'POST' && path === '/api/print') {
      const body = JSON.parse(event.body || '{}');
      return await handlePrint(body);
    }

    return jsonResponse(404, { error: 'Not found' });
  } catch (error) {
    console.error('HTTP handler error:', error);
    return jsonResponse(500, { error: 'Internal server error' });
  }
}

async function handleConfig() {
  const params = await getSecureParameters();
  const printModes = ['browser'];

  if (params['printnode-api-key'] && params['printnode-printer-id']) {
    printModes.unshift('printnode');
  }
  if (params['hp-eprint-email']) {
    if (!printModes.includes('printnode')) printModes.unshift('hp');
    else printModes.splice(1, 0, 'hp');
  }

  return jsonResponse(200, { printModes });
}

async function handleGenerate(body) {
  const { subject, locale = 'en-US' } = body;

  if (!subject || subject.trim() === '') {
    return jsonResponse(400, { error: 'subject is required' });
  }

  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const processingResult = await processUtterance(subject, locale, requestId);
  logQuery(requestId, subject, processingResult, locale).catch(err =>
    console.error('Failed to log query:', err)
  );

  if (!processingResult.approved) {
    return jsonResponse(422, {
      error: 'inappropriate',
      message: processingResult.moderationNotes
    });
  }

  const params = await getSecureParameters();
  const imageUrl = await generateColoringPageImage(processingResult.refinedPrompt, requestId);

  // Download image once; reuse buffer for both PNG upload and PDF generation
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());

  const subjectSlug = processingResult.subjects.join('-')
    .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50);
  const timestamp = Date.now();
  const bucket = params['s3-bucket-name'];

  // Upload PNG
  const pngKey = `coloring-pages/${subjectSlug}-${timestamp}.png`;
  const pngResult = await s3.upload({
    Bucket: bucket, Key: pngKey, Body: imageBuffer, ContentType: 'image/png'
  }).promise();

  // Generate and upload PDF
  const pdfBuffer = await generatePDF(imageBuffer);
  const pdfKey = `coloring-pages/${subjectSlug}-${timestamp}.pdf`;
  const pdfResult = await s3.upload({
    Bucket: bucket, Key: pdfKey, Body: pdfBuffer, ContentType: 'application/pdf'
  }).promise();

  updateLogWithResult(requestId, 'success', pngResult.Location).catch(err =>
    console.error('Failed to update log:', err)
  );

  return jsonResponse(200, {
    imageUrl: pngResult.Location,
    pdfUrl: pdfResult.Location,
    subject
  });
}

async function handlePrint(body) {
  const { pdfUrl, subject, mode } = body;

  if (!pdfUrl || !mode) {
    return jsonResponse(400, { error: 'pdfUrl and mode are required' });
  }

  if (mode === 'browser') {
    return jsonResponse(200, { success: true, mode: 'browser' });
  }

  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

  const params = await getSecureParameters();

  if (mode === 'printnode') {
    const pdfBase64 = pdfBuffer.toString('base64');
    await printViaPrintNode(pdfBase64, subject, params['printnode-api-key'], params['printnode-printer-id']);
    return jsonResponse(200, { success: true, mode: 'printnode' });
  }

  if (mode === 'hp') {
    await printViaHPePrint(pdfBuffer, subject, params['hp-eprint-email'], params['notification-email']);
    return jsonResponse(200, { success: true, mode: 'hp' });
  }

  return jsonResponse(400, { error: 'Unknown print mode' });
}

function generatePDF(imageBuffer) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // LETTER: 612 x 792 pt
    const pageW = 612, pageH = 792, margin = 36;
    const boxW = pageW - 2 * margin; // 540
    const boxH = pageH - 2 * margin; // 720

    // DALL-E images are square (1024x1024), so width is always the binding constraint
    const imgSize = Math.min(boxW, boxH); // 540
    const x = margin + (boxW - imgSize) / 2; // 36  (centered horizontally)
    const y = margin + (boxH - imgSize) / 2; // 126 (centered vertically)

    // Fill white background so the page is never transparent
    doc.rect(0, 0, pageW, pageH).fill('#ffffff');

    doc.image(imageBuffer, x, y, { width: imgSize, height: imgSize });
    doc.end();
  });
}

async function printViaPrintNode(pdfBase64, subject, apiKey, printerId) {
  const response = await fetch('https://api.printnode.com/printjobs', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      printer: parseInt(printerId),
      title: `Coloring Page - ${subject}`,
      contentType: 'pdf_base64',
      content: pdfBase64,
      source: 'ColorBot PWA'
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PrintNode error ${response.status}: ${err}`);
  }
  return response.json();
}

async function printViaHPePrint(pdfBuffer, subject, hpEmail, fromEmail) {
  const boundary = `ColorBot-${Date.now()}`;
  const pdfBase64 = pdfBuffer.toString('base64');
  const filename = `coloring-${subject.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}.pdf`;

  // Split base64 into 76-char lines per MIME spec
  const base64Lines = pdfBase64.match(/.{1,76}/g) || [pdfBase64];

  const rawParts = [
    `From: ${fromEmail}`,
    `To: ${hpEmail}`,
    `Subject: Coloring Page - ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    `Coloring page from ColorBot`,
    ``,
    `--${boundary}`,
    `Content-Type: application/pdf`,
    `Content-Disposition: attachment; filename="${filename}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    ...base64Lines,
    ``,
    `--${boundary}--`
  ];

  await ses.sendRawEmail({
    RawMessage: { Data: Buffer.from(rawParts.join('\r\n')) }
  }).promise();
}

async function processUtterance(utterance, locale, requestId) {
  const systemPrompt = `You are a strict content moderator and prompt engineer for a children's coloring page app used by kids ages 3-12. Safety is your first priority. When in doubt, REJECT.

REJECTION RULES — reject immediately if the request contains any of the following:
- Violence of any kind: fighting, hitting, killing, blood, gore, injury, weapons (guns, knives, swords, bombs, etc.), war, battle
- Sexually explicit content or any sexual themes — including suggestive clothing, romantic physical contact, or adult relationships
- Horror, fear, or disturbing themes: monsters intended to frighten, death, skulls used menacingly, jump-scare imagery
- Hate speech, slurs, or content targeting any group of people
- Real people: celebrities, politicians, athletes, influencers, or any named real person
- Drugs, alcohol, tobacco, or substances of any kind
- Anything that would be rated above G by a reasonable parent

APPROVAL RULES — approve if the request is:
- Animals, fantasy creatures, vehicles, nature, food, objects, or imaginative scenes
- Characters doing safe, playful activities: playing, dancing, flying, eating, exploring
- Educational themes: space, ocean, dinosaurs, plants, weather, sports

PROMPT ENGINEERING RULES (only applied when approved):
- Output must be a black-and-white coloring page suitable for a young child to color with crayons
- Style must be: simple cartoon, bold outlines, large shapes, no fine detail, no realistic rendering
- Describe each subject as fully visible and centered in the scene
- Characters must be cute and friendly in expression — no angry, scary, or menacing faces
- No weapons, blood, or threatening objects may appear even incidentally in the scene
- Your refined prompt MUST start with: "A children's coloring book page. Pure black outlines on solid white background. Zero color, zero fill, zero shading, zero gradients anywhere in the image. Simple cartoon style with bold outlines and large shapes easy for a young child to color."
- Then describe the scene clearly and imaginatively
- End with: "All characters have friendly, happy expressions. Every area is white with only black line art. No gray tones. No text or words. No realistic detail. No weapons or threatening elements of any kind."

Respond in JSON format:
{
  "approved": true/false,
  "moderationNotes": "Brief explanation of decision",
  "subjects": ["list", "of", "main", "subjects"],
  "action": "what they are doing (if any)",
  "refinedPrompt": "The complete, optimized DALL-E prompt (only required when approved)"
}`;

  const userMessage = `Child's request: "${utterance}"
Language: ${locale === 'es-US' ? 'Spanish' : 'English'}

Evaluate this request and return the JSON response. Remember: when in doubt, reject.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`[${requestId}] Moderation result:`, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error(`[${requestId}] Error in processUtterance:`, error);
    // Fail closed: if moderation check errors, do not generate
    return {
      approved: false,
      moderationNotes: 'Moderation check failed — request blocked for safety',
      subjects: [],
      action: null,
      refinedPrompt: null
    };
  }
}

async function generateColoringPageImage(refinedPrompt, requestId) {
  console.log(`[${requestId}] Generating image with DALL-E 3`);
  const finalPrompt =
    `CHILDREN'S COLORING BOOK PAGE. SIMPLE CARTOON STYLE ONLY. BLACK AND WHITE LINE ART ONLY. NO COLOR WHATSOEVER. ` +
    refinedPrompt +
    ` STRICT REQUIREMENTS: Simple cartoon illustration with bold black outlines on a pure white background. ` +
    `No realistic rendering, no photographic style, no detailed shading. ` +
    `No violence, no weapons, no blood, no scary elements, no adult content of any kind. ` +
    `All characters must have friendly, happy, child-appropriate expressions. ` +
    `The image must be safe and appropriate for children ages 3-12.`;
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: finalPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'natural'
  });
  console.log(`[${requestId}] Image generated successfully`);
  return response.data[0].url;
}

async function logQuery(requestId, originalUtterance, processingResult, locale) {
  await dynamodb.put({
    TableName: LOGS_TABLE,
    Item: {
      requestId,
      timestamp: new Date().toISOString(),
      originalUtterance,
      locale,
      approved: processingResult.approved,
      moderationNotes: processingResult.moderationNotes,
      subjects: processingResult.subjects,
      refinedPrompt: processingResult.refinedPrompt,
      status: 'processing'
    }
  }).promise();
  console.log(`[${requestId}] Query logged to DynamoDB`);
}

async function updateLogWithResult(requestId, status, resultOrError) {
  await dynamodb.update({
    TableName: LOGS_TABLE,
    Key: { requestId },
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
  }).promise();
  console.log(`[${requestId}] Log updated with ${status}`);
}
