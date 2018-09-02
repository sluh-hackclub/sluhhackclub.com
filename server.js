const http = require('http');
const app = require('./app.js');

const port = 3002;
const host = '127.0.0.1';
// const host = '0.0.0.0';

const server = http.createServer(app);
server.listen(port, host);

console.log('Server started on ' + host + ':' + port);
