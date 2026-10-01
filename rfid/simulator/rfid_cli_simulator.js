const readline = require('readline');
const http = require('http');

/**
 * Terminal RFID Hardware Simulator
 * Allows sending RFID UID scan events to backend server directly from CLI.
 */
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
======================================================
  LIBRARY MANAGEMENT SYSTEM - RFID TERMINAL SIMULATOR
======================================================
  Target Server: http://${BACKEND_HOST}:${BACKEND_PORT}/api/rfid/scan
  Available Commands:
    1. Scan Student RFID Card (e.g. CARD_E4A28B10)
    2. Scan Book RFID Tag   (e.g. TAG_B8F3D122)
    3. Custom UID entry
    4. Exit
======================================================
`);

const sendScan = (uid) => {
  const payload = JSON.stringify({
    uid: uid.toUpperCase(),
    deviceId: 'CLI_RFID_SIMULATOR'
  });

  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: '/api/rfid/scan',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`\n[Server Response HTTP ${res.statusCode}]`);
      try {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
        console.log(data);
      }
      promptUser();
    });
  });

  req.on('error', (err) => {
    console.error(`\n[Connection Error] Unable to connect to backend: ${err.message}`);
    promptUser();
  });

  req.write(payload);
  req.end();
};

const promptUser = () => {
  rl.question('\nEnter option (1: Student, 2: Book, 3: Custom UID, 4: Exit): ', (ans) => {
    switch (ans.trim()) {
      case '1':
        sendScan('CARD_E4A28B10'); // Aarav Gupta
        break;
      case '2':
        sendScan('TAG_B8F3D122'); // Database System Concepts
        break;
      case '3':
        rl.question('Enter RFID UID Hex: ', (customUid) => {
          sendScan(customUid);
        });
        break;
      case '4':
        console.log('Exiting RFID CLI Simulator.');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option.');
        promptUser();
    }
  });
};

promptUser();
