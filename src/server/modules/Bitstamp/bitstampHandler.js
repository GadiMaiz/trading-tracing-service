import { Bitstamp } from 'node-bitstamp';
import getEventQueue from 'eventQueue';
import logger from 'logger';
import { Notifications } from 'smart-trader-common';
import { returnMessages, Status } from 'status';
import BitstampOrderTracer from './bitstampOrderTracer';
import { PairsTo, currencyDictionary } from './currencyPairs';
import BalanceManager from 'balanceManager';

class BitstampHandler {

  /**
       * as part of the construction bitstamp order tracer is being instantiated
       * @param {object} props
       * @param {string} props.key
       * @param {string} props.secret
       * @param {string} props.clientId
       */

  constructor(params, credentials, eventQueue,  bitstampWrapper, bitstampOrderTracer) {
    this.periodToCheck = params.periodToCheck;
    this.balanceManager = new BalanceManager(currencyDictionary);

    if (!bitstampWrapper && !bitstampOrderTracer) {

      this.bitstampWrapper = new Bitstamp({
        key: credentials.key,
        secret: credentials.secret,
        clientId: credentials.clientId,
        timeout: params.bitstampRequestTimeout,
        rateLimit: true // turned on by default
      });
      this.bitstampOrderTracer = new BitstampOrderTracer(this.bitstampWrapper, { periodToCheck: this.periodToCheck, oldLimit: params.oldLimit }, this.balanceManager);
    }
    else if (bitstampWrapper && bitstampOrderTracer) {
      this.bitstampWrapper = bitstampWrapper;
      this.bitstampOrderTracer = bitstampOrderTracer;
    }
    else {
      throw new Error('could not construct BitstampHandler, input parameters are not valid');
    }
    this.eventQueue = eventQueue;
    this.buySellFunctions = { 'buy': this.bitstampWrapper.buyLimitOrder.bind(this.bitstampWrapper),
      'sell' :  this.bitstampWrapper.sellLimitOrder.bind(this.bitstampWrapper) };


  }

  /**
       * the function returns user data returned from the client
       */
  async getUserAccountData(requestId) {
    logger.debug('about to send get user data request to bitstamp requestId');
    this.eventQueue.sendNotification(Notifications.AboutToSendToExchange, { requestId: requestId, exchange: 'bitstamp' });
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
  async ImmediateOrCancel(params) {
    logger.debug('sending %s immediate or cancel order request', params.actionType);

    return await this.sendOrder(params.actionType,
      { amount: params.amount, price: params.price, currencyPair: params.currencyPair, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: true, requestId: params.requestId });
  }

  // /**
  //      * if it is possible to sell the whole amount of coins at the requested price or higher the transaction will happened
  //      * if not the request will fail
  //      * @param {object} params
  //      * @param {string} params.amount - (double as string) how many coins should be bought
  //      * @param {string} params.price -  (double as string) the price per single coin
  //      * @param {string} params.currencyPair - the pair to exchange, if doesn't exist BTC-USD pair will be chosen
  //      * @param {string} params.requestId - internal request id
  //      */
  // async sellImmediateOrCancel(params) {
  //   logger.debug('sending sell immediate or cancel order request');
  //   return await this.sendOrder('sell',
  //     { amount: params.amount, price: params.price, currencyPair: params.currencyPair, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: true, requestId: params.requestId });
  // }

  /**
       * a make sell order request being sent
       * @param {object} params
       * @param {string} params.amount - (double as string) how many coins should be sold
       * @param {string} params.price -  (double as string) the price per single coin
       * @param {string} params.currencyPair - the pair to exchange, if doesn't exist BTC-USD pair will be chosen
       * @param {string} params.requestId - internal request id
       */
  async limit(params) {
    logger.debug('sending %s limit order request', params.actionType);
    return await this.sendOrder(params.actionType,
      { amount: params.amount, price: params.price, currencyPair: params.currencyPair, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: null, requestId: params.requestId });
  }

  async sendOrder(type, params) {
    let result = null;
    let currArr = params.currencyPair.split('-');
    const pair = this.balanceManager.getBalance(currArr);
    this.eventQueue.sendNotification(Notifications.AboutToSendToExchange,
      {
        requestId: params.requestId,
        amount: params.amount,
        price: params.price,
        currencyPair: params.currencyPair,
        exchange: 'bitstamp',
        currencyFrom: pair[currArr[0]],
        currencyTo: pair[currArr[1]]
      });


    const currencyPair = (!params.currencyPair) ? PairsTo.btcUsd : PairsTo[params.currencyPair];
    // execution of buy limit or sell limit functions
    result = await this.buySellFunctions[type](params.amount, params.price, currencyPair, params.limitPrice, params.dailyOrder, params.iocOrder);

    if (!result) {
      logger.error('request to bitstamp failed');
      throw { status_code: Status.Error, status: returnMessages.Error, message: 'request to bitstamp failed' };
    }
    const transactionId = result.body.id;
    logger.debug('%s order %s was sent to the exchange, about to insert the order to tracing list', type, transactionId);

    await this.bitstampOrderTracer.addNewTransaction({
      bitstampOrderId: transactionId,
      amount: result.body.amount,
      price: result.body.price,
      type: type,
      requestId: params.requestId,
      transactions: [],
      currencyPair: params.currencyPair
    });

    this.eventQueue.sendNotification(Notifications.SentToExchange,
      {
        requestId: params.requestId,
        amount: params.amount,
        price: params.price,
        currencyPair: params.currencyPair,
        exchange: 'bitstamp',
        currencyFrom: pair[currArr[0]],
        currencyTo: pair[currArr[1]]
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

  async login(params) {
    this.bitstampWrapper.setCredentials(params);
    
    await this.getUserAccountData(params.requestId).then(data => { this.balanceManager.updateAllBalance(data); })
      .then( () => this.eventQueue.sendBalance('bitstamp', this.balanceManager.getAllBalance()));
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

  getBalance(assetPair) {
    console.log(assetPair);
    return this.balanceManager.getBalance(assetPair.split('-'));
  }

}

let bitstampHandler;

/**
 * this is an implemintation of singletone
 * if the object already exist returnes the instance else creates the object and retunes the instance
 * @param {object} parameters -  being dligated to the BitstampHandler constructor
 */
const getInstance = (credentials, params) => {
  if (!bitstampHandler) {
    if (!credentials) {
      throw { status: Status.NotLoggedIn, message: returnMessages.NotLoggedIn };
    }
    bitstampHandler = new BitstampHandler(params, credentials, getEventQueue());
  }
  return bitstampHandler;
};

module.exports = getInstance;
module.exports.BitstampHandler = BitstampHandler;