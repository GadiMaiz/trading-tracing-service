import Exchanges from './exchanges.js';
import CredentialManager from './credentialManager';

let credentialManager = new CredentialManager();

class HandlerDelegator {

  // initialize all handlers
  constructor(params) {
    this.params = params;
    const allCredentials = credentialManager.getAllCredentials();
    Object.keys(Exchanges).forEach((exchange) =>{
      const getInstance = require(Exchanges[exchange]);
      Object.keys(allCredentials).forEach((userId) =>{
        getInstance(allCredentials[userId][exchange], this.params).getUserAccountData('INIT', userId);

      });
    //   getInstance(credentials, params);
    // });
    });
  }

  /**
     * instantiates the specific exchange handlers with its credentials
     * @param {string} exchange  - the name of the exchange that is being logged in to
     * @param {object} credentials - the credentials needed to login to the exchange
     */
  async login(exchange, credentials) {
    const getInstance = require(Exchanges[exchange]);
    return await getInstance(credentials, this.params).login(credentials);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     */
  getUserAccountData(exchange, requestId, userId) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance(credentialManager.getCredentials(exchange, userId), this.params).getUserAccountData(requestId);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     * @param {object} params - see specific handler buyImmediateOrCancel parameters
     */
  ImmediateOrCancel(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance(credentialManager.getCredentials(exchange, params.userId), this.params).ImmediateOrCancel(params);
  }

  /**
     * delegates to specific exchange handler
     * @param {string} exchange - the name of the exchange as defined in exchange.js file
     * @param {object} params - see specific handler Limit parameters
     */
  Limit(exchange, params) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance(credentialManager.getCredentials(exchange, params.userId), this.params).limit(params);
  }

  getBalance(exchange, assetPair, userId) {
    const getInstance = require(Exchanges[exchange]);
    return getInstance(credentialManager.getCredentials(exchange, userId), this.params).getBalance(assetPair, userId);
  }
}

export default HandlerDelegator;