import http from 'http';

// Set process name
process.title = ['']; // TO-DO: change to your process real name.

import app from 'server';

/**
 * Create HTTP server.
 */
const server = http.createServer(app).listen(3000);
export default server;