const BASE = 'https://m6foptoqqe.execute-api.us-east-1.amazonaws.com';

export async function generateColoringPage(subject, locale) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, locale }),
  });

  if (res.status === 422) {
    const err = new Error('Content rejected by moderation');
    err.code = 'inappropriate';
    throw err;
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { imageUrl, pdfUrl, subject }
}
