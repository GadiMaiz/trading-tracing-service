import TickerStream from 'TickerStream';

import logger from 'logger';
import { Status, returnMessages } from 'status';
// import Currency from './currencyPairs';

import { Notifications }  from  'notifications';
const getEventQueue = require('eventQueue');




class BitstampOrderTracer {

  /**
     * as part of the construction we initialize the ticker stream listener, and run periodic task that monitor old orders status
     * @param {object} bitstampWrapper - bitstamp handler
     * @param {object} params - all parameters
     * @param {integer} params.periodToCheck - millisecond
     * @param {integer} params.oldLimit - millisecond
     * @param {object} tickerStream - it is here for testing purposes, to test the module a mock should be passed
     */
  constructor(bitstampWrapper, params, tickerStream = null) {
    // data members
    this.openOrders = {};
    this.bitstampWrapper = bitstampWrapper;
    this.tickerStream = (tickerStream === null) ? new TickerStream() : tickerStream;
    this.tickerStreamTopic = this.tickerStream.subscribe();
    this.timeout = params.periodToCheck; // will be taken form configuration file
    this.oldLimit = params.oldLimit;


    // functionality
    this.tickerStream.on('connected', () => console.log('tickerStream is connected'));
    this.tickerStream.on('disconnected', () => console.log('tickerStream is disconnected'));

    this.tickerStream.on(this.tickerStreamTopic, data => {
      if (!data) {
        logger.error('something went wrong, order stream was triggered without data');
      }
      let order = this.openOrders[String(data.buy_order_id)];
      if (!order) {
        order = this.openOrders[String(data.sell_order_id)];
      }

      if (order) {
        if (order.type === 'buy') {
          logger.info('bought ' + data.amount_str + ' for price: ' + data.price_str);
        }
        else {
          logger.info('sold ' + data.amount_str + ' for price: ' + data.price_str);
        }
        order.amount -= parseFloat(data.amount);
        getEventQueue().sendNotification(Notifications.Update, { requestId : order.requestId, amount : data.amount, price : data.price, amountLeft : order.amount });
        if (order.amount === 0) {
          // here we should send a notification to kafka
          getEventQueue().sendNotification(Notifications.Finished, { requestId : order.requestId });
          logger.info('request ' + order.requestId + ' successfully fulfilled !');
          delete this.openOrders[order.bitstampOrderId];
        }
        else {
          this.openOrders[order.bitstampOrderId].amount = order.amount;
        }
      }
    });

    if (this.timeout) {
      setTimeout(this.periodicStatusChecker.bind(this), this.timeout);
    }
  }

  /**
  * the function triggered periodically (time can be configured configured).
  * it checks the status of all orders that were updated recently
  */
  async periodicStatusChecker() {
    let found = false;
    let userOrders = null;
    const date = new Date();
    const currentTime = date.getTime();
    for (const bitstampOrderId in this.openOrders) {
      if (currentTime - this.openOrders[bitstampOrderId]['updateTime'] >= this.oldLimit) {
        if (found === false) {
          try {
            found = true;
            userOrders = await this.bitstampWrapper.openOrdersAll();
          }
          catch (err) {
            logger.error('Error requesting open orders ' + err);
            return this.openOrders;
          }
        }
        let orderFound = false;
        for (const itr in userOrders.body) {
          if (userOrders.body[itr].id === bitstampOrderId) {
            this.openOrders[bitstampOrderId]['updateTime'] = currentTime;
            orderFound = true;
            break;
          }
        }
        if (!orderFound) {
          let result = null;
          try {
            result = await this.bitstampWrapper.orderStatus(bitstampOrderId);
          }
          catch (err) {
            getEventQueue().sendNotification(Notifications.Error, { error: err, requestId : this.openOrders[bitstampOrderId].requestId });
            logger.error('requesting order status for order id ' + bitstampOrderId + 'err = ' + err);
            return this.openOrders;
          }
          if (!result) {
            logger.error('order status request of order ' + bitstampOrderId + ' has failed');
            getEventQueue().sendNotification(Notifications.Error, { returnMessage: returnMessages.RequestFailed, requestId : this.openOrders[bitstampOrderId].requestId });
            delete this.openOrders[bitstampOrderId];
            return this.openOrders;
          }
          if (result.body.status === 'Open' || result.body.status === 'In Queue') {
            logger.debug('status = OPEN or InQueue');
            this.openOrders[bitstampOrderId]['updateTime'] = currentTime;
          }
          else if (result.body.status === 'Canceled') {
            getEventQueue().sendNotification(Notifications.Cancelled, { requestId : this.openOrders[bitstampOrderId].requestId });
            logger.info('request with id ' + this.openOrders[bitstampOrderId].requestId + ' was CANCELED');
            delete this.openOrders[bitstampOrderId];
          }
          else if (result.body.status === 'Finished') {
            getEventQueue().sendNotification(Notifications.Finished, { requestId : this.openOrders[bitstampOrderId].requestId });
            logger.info('request with id ' + this.openOrders[bitstampOrderId].requestId + ' was FINISHED');
            delete this.openOrders[bitstampOrderId];
          }
          else {
            logger.error('status :' + result.body.status + ' is unknown');
          }
        }
      }
    }
    if (this.timeout) {
      setTimeout(this.periodicStatusChecker.bind(this), this.timeout);
    }
    return this.openOrders;
  }

  /**
     * inserts a transaction into tracing list
     * @param {object} transactionDetails
     * @param {string} transactionDetails.bitstampOrderId - the order id that Bitstamp generated for the current order
     * @param {string} transactionDetails.amount - (double as string) how many coins should be bought
     * @param {string} transactionDetails.price - (double as string) the price per single coin
     * @param {string} transactionDetails.type  - buy / sell depends on the request
     * @param {string} transactionDetails.requestId - the internal request id was generated upon user request
     */
  addNewTransaction(transactionDetails) {
    if (this.openOrders[String(transactionDetails.bitstampOrderId)]) {
      throw { status_code: Status.Error, status: returnMessages.Error, message: 'order id - ' + transactionDetails.bitstampOrderId + ' already exist' };
    }
    const date = new Date();
    transactionDetails['updateTime'] = date.getTime();
    this.openOrders[String(transactionDetails.bitstampOrderId)] = transactionDetails;
  }

}

export default BitstampOrderTracer;