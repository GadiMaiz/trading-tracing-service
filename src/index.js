
const http = require('http');
// Set process name
process.title = ['']; // TO-DO: change to your process real name.

import app from 'server';
// let port = '3000';
// app.set('port', port);

/**
 * Create HTTP server.
 */

let server = http.createServer(app).listen(3000);
export default server;