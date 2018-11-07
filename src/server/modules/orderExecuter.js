import { orderTypes, Notifications } from 'smart-trader-common';
import { Status, returnMessages } from 'status';
import logger from 'logger';
import Handler from 'handlerDelegator';

const getEventQueue = require('eventQueue');

class OrderExecuter {

  constructor(params) {
    this.handler = new Handler(params);
  }
  /**
   * the function accept order object and executes the order requested
   * @param {object} order
   * @param {string} order.key - a numeric string that defined in orderTypes.js and represent the order type
   * @param {object} order.value - a json object that contains all the parameters for the order request
   */
  execute(order) {
    const parameters = JSON.parse(order.value);
    getEventQueue().sendNotification(Notifications.ReceivedFromEventQueue,
      {
        requestId: parameters.requestId,
        exchange: parameters.exchange
      });

    switch (Number(order.key)) {
      case (orderTypes.getUserData):
        logger.debug('getUserData request received');
        this.getUserData(parameters);
        break;
      case (orderTypes.login): {
        logger.debug('login request received');
        this.login(parameters);
        break;
      }
      case (orderTypes.ImmediateOrCancel):
        logger.debug('%s ImmediateOrCancel request received',parameters.actionType);
        this.ImmediateOrCancelRequest(parameters);
        break;
      case (orderTypes.timedTaking):
        logger.debug('%s timedTaking request received', parameters.actionType);
        break;
      case (orderTypes.timedMaking):
        logger.debug('%s timedMaking request received', parameters.actionType);
        this.timedRequestMaking(parameters);
        break;
    }
  }

  /**
   * login calls the login function of the handler
   * @param {object} params
   * @param {object} params.key      - part of the credentials
   * @param {object} params.secret   - part of the credentials
   * @param {object} params.clientId - part of the credentials
   * @param {object} params.requestId- identifier for the request
   * @param {object} params.exchange - the exchange name the order addressed to
   */
  async login(params) {
    const exchange = params.exchange.toLowerCase();
    const key = params.key;
    const secret = params.secret;
    const clientId = params.clientId;
    const requestId = params.requestId;

    try {
      await this.handler.login(exchange, { key, secret, clientId, requestId });
      getEventQueue().sendNotification(Notifications.SuccessfullyLoggedInToExchange, { requestId: requestId, exchange: exchange });
      logger.debug('successfully logged in to exchange- %s requestId- %s', exchange, requestId);
    }
    catch (err) {
      getEventQueue().sendNotification(Notifications.Error, { requestId: requestId, exchange: exchange, errorMessage: 'cant login, possibly wrong credentials' });
      logger.error('unable to login to %s exchange, err = %s requestId = %s' , exchange, err, requestId);
    }
  }

  /**
   * calls the getUserData function of the handler
   * @param {object} params
   * @param {object} params.exchange - the exchange name the order addressed to
   */
  async getUserData(params) {
    const exchange = params.exchange.toLowerCase();
    if (!exchange) {
      const err = new Error(returnMessages.InputParametersMissing);
      logger.error(err);
    }
    const requestId = params.requestId;
    try {
      const userData = await this.handler.getUserAccountData(exchange, requestId);
      getEventQueue().sendNotification(Notifications.Success, { requestId: requestId, data: userData, exchange: exchange });
      logger.debug('successfully sent get user data request requestId = %s', requestId);
    }
    catch (err) {
      getEventQueue().sendNotification(Notifications.Error, { requestId: requestId, exchange: exchange, errorCode: err.statusCode, errorMessage: err.message });
      logger.error('getUserData encountered an error : %o', err);
    }
  }

  // /**
  //  * delegates the execution to ImmediateOrCancelRequest with the same parameters
  //  * @param {object} params
  //  */
  // async buyImmediateOrCancel(params) {
  //   this.ImmediateOrCancelRequest('buyImmediateOrCancel', params);
  // }

  // /**
  //  * delegates the execution to ImmediateOrCancelRequest with the same parameters
  //  * @param {object} params
  //  */
  // async sellImmediateOrCancel(params) {
  //   this.ImmediateOrCancelRequest('sellImmediateOrCancel', params);
  // }

  /**
   * delegates the execution to  timedRequestMaking with the same parameters
   * @param {object} params
   */
  async timedBuyMaking(params) {
    this.timedRequestMaking('timedBuyMaking', params);
  }

  /**
   * delegates the execution to  timedRequestMaking with the same parameters
   * @param {object} params
   */
  async timedSellMaking(params) {
    this.timedRequestMaking('timedSellMaking', params);
  }

  async ImmediateOrCancelRequest(params) {
    const exchange = params.exchange.toLowerCase();

    const amount = params.amount;
    const price = params.price;
    let pair = this.handler.getBalance(exchange, params.currencyPair);
    if (!amount || !price || !params.exchange || !params.requestId || !params.currencyPair) {
      getEventQueue().sendNotification(Notifications.Error,
        {
          requestId: params.requestId,
          exchange: exchange,
          errorCode: Status.InputParametersMissing,
          errorMessage: returnMessages.InputParametersMissing,
          currencyFrom: pair[0],
          currencyTo: pair[1]
        });
      logger.error('some of the input parameters are missing (amount, price, exchange, requestId, currencyPair)');
      return;
    }
    let retVal = null;
    try {
      pair = this.handler.getBalance(exchange, params.currencyPair);
      retVal = await this.handler.ImmediateOrCancel(exchange,
        { requestId: params.requestId, amount: params.amount, price: params.price, currencyPair: params.currencyPair, actionType: params.actionType });
      pair = this.handler.getBalance(exchange, params.currencyPair);
      getEventQueue().sendNotification(Notifications.SentToExchange,
        {
          requestId: params.requestId,
          exchange: exchange,
          exchangeOrderId: retVal.orderId,
          currencyFrom: pair[0],
          currencyTo: pair[1]
        });
      logger.debug('successfully sent %s request requestId = %s', params.actionType, params.requestId);
    }
    catch (err) {
      logger.error('an error occurred while executing %s err = %o', params.actionType, err);
      getEventQueue().sendNotification(Notifications.Error,
        {
          requestId: params.requestId,
          errorCode: err.statusCode,
          errorMessage: err.message,
          exchange: exchange,
          currencyFrom: pair[0],
          currencyTo: pair[1]
        });
    }
  }

  async timedRequestMaking(params) {
    const exchange = params.exchange.toLowerCase();

    const amount = params.amount;
    const price = params.price;

    let pair = this.handler.getBalance(exchange, params.currencyPair);

    if (!amount || !price || !params.exchange || !params.requestId || !params.currencyPair) {
      getEventQueue().sendNotification(Notifications.Error,
        {
          requestId: params.requestId,
          statusCode: Status.InputParametersMissing,
          returnMessage: returnMessages.InputParametersMissing,
          exchange: exchange,
          currencyFrom: pair.first,
          currencyTo: pair.second
        });
      logger.error('some of the input parameters are missing (amount, price, exchange, requestId)');
      return;
    }
    try {
      // if (params.actionType === 'buy') {
      await this.handler.Limit(exchange,
        { requestId: params.requestId, amount: amount, price: price, currencyPair: params.currencyPair, actionType: params.actionType });
      // }
      // else {
      //   await this.handler.sellLimit(exchange,
      //     { requestId: params.requestId, amount: amount, price: price, currencyPair: params.currencyPair });
      // }

      let pair = this.handler.getBalance(exchange, params.currencyPair);
      getEventQueue().sendNotification(Notifications.SentToEventQueue,
        {
          requestId: params.requestId,
          exchange: exchange,
          currencyFrom: pair.first,
          currencyTo: pair.second
        });
      logger.debug('successfully sent %s request requestId = %s', params.actionType, params.requestId);
    }
    catch (err) {
      logger.error('an error occurred while executing %s err = %o' , params.actionType, err);
      getEventQueue().sendNotification(Notifications.Error, {
        requestId: params.requestId,
        error: err, exchange: exchange,
        currencyFrom: pair.first,
        currencyTo: pair.second
      });
    }
  }

}



export default OrderExecuter;