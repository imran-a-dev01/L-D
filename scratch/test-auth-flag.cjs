const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function testAuthRequired() {
  console.log('Testing AUTH_REQUIRED=true on port 3002...');
  const serverProcess = spawn('node', [path.join(__dirname, '../server/index.js')], {
    env: {
      ...process.env,
      PORT: '3002',
      AUTH_REQUIRED: 'true',
      JWT_SECRET: 'testsecret123456789'
    },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', data => {
    // console.log('[Server 3002]:', data.toString());
  });

  // Wait 1.5s for startup
  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await get('http://127.0.0.1:3002/api/employees');
    console.log('GET /api/employees without token with AUTH_REQUIRED=true status:', res.status);
    if (res.status === 401) {
      console.log('PASS: Successfully returned 401 Unauthorized when AUTH_REQUIRED=true');
    } else {
      console.error('FAIL: Expected 401, got', res.status);
      process.exitCode = 1;
    }
  } finally {
    serverProcess.kill();
  }
}

testAuthRequired().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
