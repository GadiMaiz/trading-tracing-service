import http from 'http';
import nodeConfigModule from 'node-config-module';
// Set process name
process.title = ['Trading-Tracing service']; // TO-DO: change to your process real name.

import Server from 'server';

/**
 * Create HTTP server.
 */

const defaultConf = {};
nodeConfigModule.init(defaultConf, null, ()=>{});
let conf = nodeConfigModule.getConfig();

const serverApp = new Server(conf);

const server = http.createServer(serverApp.getServer()).listen(3000);
export default server;
