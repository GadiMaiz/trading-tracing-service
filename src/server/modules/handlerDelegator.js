import Exchanges from './exchanges.js';
import { returnMessages } from 'status';
class HandlerDelegator {

  // initialize all handlers
  constructor() {
  }

  /**
     * instantiates the specific exchange handlers with its credentials
     * @param {string} exchange  - the name of the exchange that is being logged in to
     * @param {object} credentials - the credentials needed to login to the exchange
     */
  login(exchange, credentials) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance(credentials).login(credentials);
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
  buyImmediateOrCancel(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().buyImmediateOrCancel(params);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     * @param {object} params - see specific handler buyImmediateOrCancel parameters
     */
  sellImmediateOrCancel(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().sellImmediateOrCancel(params);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     * @param {object} params - see specific handler buyImmediateOrCancel parameters
     */
  sellLimit(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().sellLimit(params);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     * @param {object} params - see specific handler buyImmediateOrCancel parameters
     */
  buyLimit(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().buyLimit(params);
  }

  getBalance(exchange, assetPair) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance().getBalance(assetPair);
  }
}

export default HandlerDelegator;