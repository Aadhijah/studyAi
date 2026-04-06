const http = require('http');

const AI_SERVICE_URL = 'http://localhost:5001';

function callAI(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error));
          resolve(parsed);
        } catch {
          reject(new Error('Invalid response from AI service'));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`AI service unavailable: ${e.message}. Make sure Python service is running (python ai_service.py)`)));
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('AI service timed out')); });
    req.write(body);
    req.end();
  });
}

async function generateNotes(text, title) {
  return callAI('/notes', { text, title });
}

async function generateQuiz(text, numQuestions = 10) {
  return callAI('/quiz', { text, numQuestions });
}

async function generateMindMap(text, title) {
  return callAI('/mindmap', { text, title });
}

module.exports = { generateNotes, generateQuiz, generateMindMap };
