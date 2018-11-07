import Exchanges from './exchanges.js';
class HandlerDelegator {

  // initialize all handlers
  constructor(params) {
    this.params = params;
  }

  /**
     * instantiates the specific exchange handlers with its credentials
     * @param {string} exchange  - the name of the exchange that is being logged in to
     * @param {object} credentials - the credentials needed to login to the exchange
     */
  async login(exchange, credentials) {
    const getInstance = require(Exchanges[exchange]);
    return await getInstance(credentials, this.params).login(credentials);
    // return { status: returnMessages.Success };
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     */
  getUserAccountData(exchange, requestId) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().getUserAccountData(requestId);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     * @param {object} params - see specific handler buyImmediateOrCancel parameters
     */
  ImmediateOrCancel(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().ImmediateOrCancel(params);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     * @param {object} params - see specific handler Limit parameters
     */
  Limit(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().limit(params);
  }

  getBalance(exchange, assetPair) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().getBalance(assetPair);
  }
}

export default HandlerDelegator;