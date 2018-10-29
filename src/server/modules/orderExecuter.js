import { orderTypes } from 'orderTypes';
import { Status, returnMessages } from 'status';
import logger from 'logger';
import Handler from 'handlerDelegator';
import { Notifications } from 'notifications';




const handler = new Handler();

const getEventQueue = require('eventQueue');

class OrderExecuter {

  /**
   * the function accept order object and executes the order requested
   * @param {object} order
   * @param {string} order.key - a numeric string that defined in orderTypes.js and represent the order type
   * @param {object} order.value - a json object that contains all the parameters for the order request
   */
  async execute(order) {
    const parameters = JSON.parse(order.value);
    getEventQueue().sendNotification(Notifications.ReceivedFromEventQueue,
      {
        requestId: parameters.requestId,
        exchange: parameters.exchange
      });

    switch (Number(order.key)) {
      case (orderTypes.getUserData):
        console.log('getUserData');
        this.getUserData(parameters);
        break;
      case (orderTypes.login): {
        console.log('login');
        this.login(parameters);
        break;
      }
      case (orderTypes.buyImmediateOrCancel):
        console.log('buyImmediateOrCancel');
        this.buyImmediateOrCancel(parameters);
        break;
      case (orderTypes.sellImmediateOrCancel):
        console.log('sellImmediateOrCancel');
        this.sellImmediateOrCancel(parameters);
        break;
      case (orderTypes.timeBuyTaking):
        console.log('timeBuyTaking');
        break;
      case (orderTypes.timeSellTaking):
        console.log('timeSellTaking');
        break;
      case (orderTypes.timedBuyMaking):
        console.log('timedBuyMaking');
        this.timedBuyMaking(parameters);
        break;
      case (orderTypes.timedSellMaking):
        console.log('timedSellMaking');
        this.timedSellMaking(parameters);
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
      await handler.login(exchange, { key, secret, clientId, requestId });
      getEventQueue().sendNotification(Notifications.SuccessfullyLoggedInToExchange, { requestId: requestId, exchange: exchange });
      logger.debug('successfully logged in to ' + exchange + ' exchange' + ' requestId = ' + requestId);
    }
    catch (err) {
      getEventQueue().sendNotification(Notifications.Error, { requestId: requestId, exchange: exchange, errorMessage: 'cant login, possibly wrong credentials' });
      logger.error('unable to login to ' + exchange + ' exchange, err =  ' + err + ' requestId = ' + requestId);
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
      const userData = await handler.getUserAccountData(exchange, requestId);
      getEventQueue().sendNotification(Notifications.Success, { requestId: requestId, data: userData, exchange: exchange });
      logger.debug('successfully sent get user data request requestId = ' + requestId);
    }
    catch (err) {
      getEventQueue().sendNotification(Notifications.Error, { requestId: requestId, exchange: exchange, errorCode: err.statusCode, errorMessage: err.message });
      logger.error('getUserData encountered an error : ' + JSON.stringify(err));
    }
  }

  /**
   * delegates the execution to ImmediateOrCancelRequest with the same parameters
   * @param {object} params
   */
  async buyImmediateOrCancel(params) {
    this.ImmediateOrCancelRequest('buyImmediateOrCancel', params);
  }

  /**
   * delegates the execution to ImmediateOrCancelRequest with the same parameters
   * @param {object} params
   */
  async sellImmediateOrCancel(params) {
    this.ImmediateOrCancelRequest('sellImmediateOrCancel', params);
  }

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

  async ImmediateOrCancelRequest(type, params) {
    const exchange = params.exchange.toLowerCase();

    const amount = params.amount;
    const price = params.price;
    console.log('XXXXXXXXXXXXXXXX amount = ' + amount  + ' price = ' + price + ' params.exchange = ' + params.exchange +
                                     ' params.requestId + ' + params.requestId + ' params.currencyPair = ' + params.currencyPair);
    if (!amount || !price || !params.exchange || !params.requestId || !params.currencyPair) {
      getEventQueue().sendNotification(Notifications.Error,
        {
          requestId: params.requestId,
          exchange: exchange,
          errorCode: Status.InputParametersMissing,
          errorMessage: returnMessages.InputParametersMissing,
        });
      logger.error('some of the input parameters are missing (amount, price, exchange, requestId, currencyPair)');
      return;
    }
    let pair = handler.getBalance(exchange, params.currencyPair);

    let retVal = null;
    try {
      if (type === 'sellImmediateOrCancel') {
        retVal = await handler.sellImmediateOrCancel(exchange,
          { requestId: params.requestId, amount: params.amount, price: params.price, currencyPair: params.currencyPair });
      }
      else {
        retVal = await handler.buyImmediateOrCancel(exchange,
          { requestId: params.requestId, amount: params.amount, price: params.price, currencyPair: params.currencyPair });
      }
      pair = handler.getBalance(exchange, params.currencyPair);

      getEventQueue().sendNotification(Notifications.SentToExchange,
        {
          requestId: params.requestId,
          exchange: exchange,
          exchangeOrderId: retVal.orderId,
          balance1: pair[0],
          balance2: pair[1]
        });
      logger.debug('successfully sent ' + type + ' request requestId = ' + params.requestId);
    }
    catch (err) {
      logger.error('an error occurred while executing ' + type + ' err = ' + JSON.stringify(err));
      getEventQueue().sendNotification(Notifications.Error,
        {
          requestId: params.requestId,
          errorCode: err.statusCode,
          errorMessage: err.message,
          exchange: exchange,
          balance1: pair[0],
          balance2: pair[1]
        });
    }
  }

  async timedRequestMaking(type, params) {
    const exchange = params.exchange.toLowerCase();

    const amount = params.amount;
    const price = params.price;

    let pair = handler.getBalance(exchange, params.currencyPair);

    if (!amount || !price || !params.exchange || !params.requestId || !params.currencyPair) {
      getEventQueue().sendNotification(Notifications.Error,
        {
          requestId: params.requestId,
          statusCode: Status.InputParametersMissing,
          returnMessage: returnMessages.InputParametersMissing,
          exchange: exchange,
          balance1: pair.first,
          balance2: pair.second
        });
      logger.error('some of the input parameters are missing (amount, price, exchange, requestId)');
      return;
    }
    try {
      if (type === 'timedBuyMaking') {
        await handler.buyLimit(exchange,
          { requestId: params.requestId, amount: amount, price: price, currencyPair: params.currencyPair });
      }
      else {
        await handler.sellLimit(exchange, { amount: amount, price: price });
      }

      let pair = handler.getBalance(exchange, params.currencyPair);
      getEventQueue().sendNotification(Notifications.SentToEventQueue,
        {
          requestId: params.requestId,
          exchange: exchange,
          balance1: pair.first,
          balance2: pair.second
        });
      logger.debug('successfully sent ' + type + ' request requestId = ' + params.requestId);
    }
    catch (err) {
      logger.error('an error occurred while executing ' + type + ' err = ' + JSON.stringify(err));
      getEventQueue().sendNotification(Notifications.Error, {
        requestId: params.requestId,
        error: err, exchange: exchange,
        balance1: pair.first,
        balance2: pair.second
      });
    }
  }

}



export default OrderExecuter;