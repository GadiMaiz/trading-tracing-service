import Bitstamp from 'Bitstamp';

import BitstampOrderTracer from './bitstampOrderTracer';

import logger from 'logger';

import { Status, returnMessages } from 'status';

import CurrencyPairs from './currencyPairs';

import { Notifications }  from  'notifications';
import getEventQueue from 'eventQueue';

// global const shell be moved to configuration
const BITSTAMP_REQUEST_TIMEOUT = 5000;

const OLD_LIMIT = 5000;
const PERIOD_TO_CHECK = 1500;
// /// global currency pairs

class BitstampHandler {

  /**
       * as part of the construction bitstamp order tracer is being instantiated
       * @param {object} props
       * @param {string} props.key
       * @param {string} props.secret
       * @param {string} props.clientId
       */

  constructor(params = null, bitstampWrapper = null, bitstampOrderTracer = null) {
    if (!bitstampWrapper && !bitstampOrderTracer) {

      this.bitstampWrapper = new Bitstamp({
        key: params.key,
        secret: params.secret,
        clientId: params.clientId,
        timeout: BITSTAMP_REQUEST_TIMEOUT,
        rateLimit: true // turned on by default
      });
      this.bitstampOrderTracer = new BitstampOrderTracer(this.bitstampWrapper, { periodToCheck: PERIOD_TO_CHECK, oldLimit: OLD_LIMIT });
    }
    else if (bitstampWrapper && bitstampOrderTracer) {
      this.bitstampWrapper = bitstampWrapper;
      this.bitstampOrderTracer = bitstampOrderTracer;
    }
    else {
      throw new Error('could not construct BitstampHandler, input parameters are not valid');
    }
  }

  /**
       * the function returnes user data returned from the client
       */
  async getUserAccountData(requestId) {
    logger.debug('about to send get user data request to bitstamp requestId' );
    getEventQueue().sendNotification(Notifications.AboutToSendToExchange, {  requestId : requestId, exchange: 'bitstamp' });
    const ret = await this.bitstampWrapper.balance();
    return ret.body;
  }

  /**
       * if it is possible to buy the whole amount of coins at the requested price or cheaper the transaction will happened
       * if not the request will fail
       * @param {object} params
       * @param {string} params.amount - (double as string) how many coins should be sold
       * @param {string} params.price -  (double as string) the price per single coin
       * @param {string} params.currencyPair - the pair to exchange, if doesn't exist BTC- USD pair will be chosen
       * @param {string} params.requestId - internal request id
       */
  async buyImmediateOrCancel(params) {
    const currencyPair = (!params.currencyPair) ? CurrencyPairs.btcUsd : CurrencyPairs[params.currencyPair];
    logger.debug('sending buy immediate or cancel order request');

    return await this.sendOrder('buy',
      { amount: params.amount, price: params.price, currencyPair: currencyPair, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: true, requestId : params.requestId });
  }

  /**
       * if it is possible to sell the whole amount of coins at the requested price or higher the transaction will happened
       * if not the request will fail
       * @param {object} params
       * @param {string} params.amount - (double as string) how many coins should be bought
       * @param {string} params.price -  (double as string) the price per single coin
       * @param {string} params.currencyPair - the pair to exchange, if doesn't exist BTC-USD pair will be chosen
       * @param {string} params.requestId - internal request id
       */
  async sellImmediateOrCancel(params) {
    const currencyPair = (!params.currencyPair) ? CurrencyPairs.btcUsd : CurrencyPairs[params.currencyPair];
    logger.debug('sending sell immediate or cancel order request');
    return await this.sendOrder('sell',
      { amount: params.amount, price: params.price, currencyPair: currencyPair, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: true, requestId : params.requestId });
  }

  /**
       * a make sell order request being sent
       * @param {object} params
       * @param {string} params.amount - (double as string) how many coins should be sold
       * @param {string} params.price -  (double as string) the price per single coin
       * @param {string} params.currencyPair - the pair to exchange, if doesn't exist BTC-USD pair will be chosen
       * @param {string} params.requestId - internal request id
       */
  async sellLimit(params) {
    const currencyPair = (!params.currencyPair) ? CurrencyPairs.btcUsd : CurrencyPairs[params.currencyPair];
    logger.debug('sending sell limit order request');
    return await this.sendOrder('sell',
      { amount: params.amount, price: params.price, currencyPair: currencyPair, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: null ,  requestId : params.requestId });
  }


  /**
       * a make buy order request being sent
       * @param {object} params
       * @param {string} params.amount - (double as string) how many coins should be bought
       * @param {string} params.price -  (double as string) the price per single coin
       * @param {string} params.currencyPair - the pair to exchange, if doesn't exist BTC-USD pair will be chosen
       * @param {string} params.requestId - internal request id
       */
  buyLimit(params) {
    const currencyPair = (!params.currencyPair) ? CurrencyPairs.btcUsd : CurrencyPairs[params.currencyPair];
    logger.debug('sending buy limit order request');
    return this.sendOrder('buy',
      { amount: params.amount, price: params.price, currencyPair: currencyPair, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: null,  requestId : params.requestId  });
  }

  async sendOrder(type, params) {
    let result = null;

    getEventQueue().sendNotification(Notifications.AboutToSendToExchange,
      { requestId : params.requestId,
        amount : params.amount,
        price: params.price,
        currencyPair: params.currencyPair,
        exchange : 'bitstamp'
      });

    if (type === 'sell') {
      result = await this.bitstampWrapper.sellLimitOrder(params.amount, params.price, params.currencyPair, params.limitPrice, params.dailyOrder, params.iocOrder);
    }
    else {
      result = await this.bitstampWrapper.buyLimitOrder(params.amount, params.price, params.currencyPair, params.limitPrice, params.dailyOrder, params.iocOrder);
    }

    if (!result) {
      logger.error('request to bitstamp failed');
      throw { status_code: Status.Error, status: returnMessages.Error, message: 'request to bitstamp failed' };
    }
    const transactionId = result.body.id;
    logger.debug(type + ' order ' + transactionId + ' was sent to the exchange, about to insert the order to tracing list');

    await this.bitstampOrderTracer.addNewTransaction({
      bitstampOrderId: transactionId,
      amount: result.body.amount,
      price: result.body.price,
      type: type,
      requestId: params.requestId,
      transactions : []
    });
    return { status_code: Status.Success, status: returnMessages.OrderSent, orderId: transactionId };
  }



  /**
       * login sets the new credentials to the bitstamp wrappper and calls getUserData to test the credentials
       * @param {object} params - the credentials needed to login to bitstamp
       * @param {string} params.key
       * @param {string} params.secret
       * @param {string} params.clientId
       * @param {string} params.requestId - internal request id
       */

  login (params) {
    this.bitstampWrapper.setCredentials(params.key, params.secret, params.clientId);
    return this.getUserAccountData(params.requestId);
  }

  /**
   * cancels all user requests
   */
  async cancelAllOrders() {
    await this.bitstampWrapper.cancelOrdersAll();
  }

  /**
   * cancels a specific  user request
   * @param {string} id - the request id that should be canceled
   */
  async cancelOrder(id) {
    await this.bitstampWrapper.cancelOrder(id);
  }

}


let bitstampHandler;

/**
 * this is an implemintation of singletone
 * if the object already exist returnes the instance else creates the object and retunes the instance
 * @param {object} parameters -  being dligated to the BitstampHandler constructor
 */
const getInstance = (parameters) => {
  if (!bitstampHandler) {
    if (!parameters) {
      throw { status: Status.NotLoggedIn, message: returnMessages.NotLoggedIn };
    }
    bitstampHandler = new BitstampHandler(parameters);
  }
  return bitstampHandler;
};

module.exports = getInstance;
module.exports.BitstampHandler = BitstampHandler;