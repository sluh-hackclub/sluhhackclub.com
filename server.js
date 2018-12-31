const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.join(__dirname, '/.env'))) {
  dotenv.load({ path: '.env' });
} else {
  console.error('ERROR: Missing .env file, reference .env.example');
  process.exit(1);
}

// Check for all required environmental variables
let missingEnvVars = '';
[
  'HOST',
  'PORT',
  'MONGO_HOST',
  // 'MONGO_USER',
  // 'MONGO_PW',
  'MONGO_DB',
  'SESSION_SECRET',
  'SLACK_OAUTH'
].forEach(envVar => {
  if (typeof process.env[envVar] === 'undefined') {
    missingEnvVars += envVar + ' ';
  }
});
if (missingEnvVars.length > 0) {
  console.log('ERROR: Missing env vars ' + missingEnvVars);
  process.exit(1);
}

const http = require('http');
const app = require('./app.js');

const server = http.createServer(app);
server.listen(process.env.PORT, process.env.HOST, () => {
  console.log('Server started on ' + process.env.HOST + ':' + process.env.PORT);
});
