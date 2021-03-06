import { TickerStream } from 'node-bitstamp';

import logger from 'logger';
import { Status, returnMessages } from 'status';

import { Notifications } from 'smart-trader-common';
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
  constructor(bitstampWrapper, params, balanceManager, eventQueue ,tickerStream) {
    // data members
    this.openOrders = {};
    this.bitstampWrapper = bitstampWrapper;
    this.tickerStream = (!tickerStream) ? new TickerStream() : tickerStream;
    this.tickerStreamTopic = this.tickerStream.subscribe();
    this.timeout = params.periodToCheck;
    this.oldLimit = params.oldLimit;
    this.balanceManager = balanceManager;
    this.eventQueue = eventQueue ? eventQueue : getEventQueue();


    // functionality
    this.tickerStream.on('connected', () => console.log('tickerStream is connected'));
    this.tickerStream.on('disconnected', () => console.log('tickerStream is disconnected'));

    this.tickerStream.on(this.tickerStreamTopic, async data => {
      if (!data) {
        logger.error('something went wrong, order stream was triggered without data');
      }
      this.eventQueue.sendTrade('bitstamp',
        {
          amount: data.amount_str,
          buy_order_id: data.buy_order_id,
          sell_order_id: data.sell_order_id,
          price: data.price_str,
          timestamp: data.timestamp,
          id: data.id,
          cost: toString(data.cost),
        });
      let order = this.openOrders[String(data.buy_order_id)];
      if (!order) {
        order = this.openOrders[String(data.sell_order_id)];
      }

      if (order) {
        if (order.type === 'buy') {
          logger.info('bought %s for price: %s' , data.amount_str, data.price_str );
          // this.balanceManager.addToBalance(pair[0], data.amount_str);
          // this.balanceManager.subtractFromBalance(pair[1], data.cost);
        }
        else {
          logger.info('sold %s for price: %s', data.amount_str, data.price_str);
          // this.balanceManager.subtractFromBalance(pair[0], data.amount_str);
          // this.balanceManager.addToBalance(pair[1], data.cost);
        }
        await this.bitstampWrapper.balance().then(data => this.balanceManager.updateAllBalance(data.body) );

        let currArr = this.openOrders[ order.bitstampOrderId].currencyPair.split('-');
        const balances = this.balanceManager.getBalance(currArr);

        order.transactions.push({ price: data.price, amount: data.amount });
        order.amount -= parseFloat(data.amount);
        this.eventQueue.sendNotification(
          Notifications.Update,
          {
            requestId: order.requestId,
            exchangeOrderId: order.bitstampOrderId,
            amount: data.amount,
            price: data.price,
            amountLeft: order.amount,
            exchange: 'bitstamp',
            currencyFrom: balances[currArr[0]],
            currencyTo: balances[currArr[1]]
          });

        this.eventQueue.sendBalance('bitstamp', this.balanceManager.getAllBalance());

        if (order.amount === 0) {
          const average = this.calcAveragePrice(order.transactions);
          // here we should send a notification to kafka
          this.eventQueue.sendNotification(Notifications.Finished,
            {
              requestId: order.requestId,
              exchangeOrderId: order.bitstampOrderId,
              price: average.price,
              amount: average.amount,
              exchange: 'bitstamp',
              currencyFrom: balances[0],
              currencyTo: balances[1]
            });
          logger.info('request %s successfully fulfilled !', order.requestId);
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
            logger.error('Error requesting open orders %s', err);
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
            this.eventQueue.sendNotification(Notifications.Error,
              {
                error: err,
                requestId: this.openOrders[bitstampOrderId].requestId,
                exchangeOrderId: bitstampOrderId
              });
            logger.error('requesting order status for order id = %s, err = %s' , bitstampOrderId, err);
            return this.openOrders;
          }
          let currArr = this.openOrders[bitstampOrderId].currencyPair.split('-');
          let balances = this.balanceManager.getBalance(currArr);
          if (!result) {
            logger.error('order status request of order %s has failed', bitstampOrderId);
            this.eventQueue.sendNotification(Notifications.Error, {
              errorMessage: returnMessages.RequestFailed,
              errorCode: Status.RequestFailed,
              requestId: this.openOrders[bitstampOrderId].requestId,
              exchangeOrderId: bitstampOrderId,
              currencyFrom: balances[currArr[0]],
              currencyTo:   balances[currArr[1]]
            });
            delete this.openOrders[bitstampOrderId];
            return this.openOrders;
          }
          if (result.body.status === 'Open' || result.body.status === 'In Queue') {
            logger.debug('status = OPEN or InQueue');
            this.openOrders[bitstampOrderId]['updateTime'] = currentTime;
          }
          else if (result.body.status === 'Canceled') {
            this.eventQueue.sendNotification(Notifications.Cancelled,
              {
                exchange: 'bitstamp',
                requestId: this.openOrders[bitstampOrderId].requestId,
                exchangeOrderId: bitstampOrderId,
                currencyFrom: balances[currArr[0]],
                currencyTo:   balances[currArr[1]]
              });
            logger.info('request with id %s was CANCELED', this.openOrders[bitstampOrderId].requestId);
            delete this.openOrders[bitstampOrderId];
          }
          else if (result.body.status === 'Finished') { // TODO here we should parse the body to get transaction history;
            await this.bitstampWrapper.balance().then(data => this.balanceManager.updateAllBalance(data.body) );

            let currArr = this.balanceManager.getBalance(this.openOrders[bitstampOrderId].currencyPair.split('-'));
            const balances = this.balanceManager.getBalance(currArr);
            this.eventQueue.sendNotification(Notifications.Finished,
              {
                exchange: 'bitstamp',
                requestId: this.openOrders[bitstampOrderId].requestId,
                exchangeOrderId: bitstampOrderId,
                currencyFrom: balances[currArr[0]],
                currencyTo:   balances[currArr[1]]
              });
            logger.info('request with id %s was FINISHED', this.openOrders[bitstampOrderId].requestId);
            delete this.openOrders[bitstampOrderId];
          }
          else {
            logger.error('status : %s is unknown', result.body.status);
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

  calcAveragePrice(transactions) {
    let amount = 0.0;
    let price = 0.0;
    transactions.forEach(transaction => {
      amount += transaction.amount;
      price += transaction.price * transaction.amount;
    });
    return { amount: amount, price: price / amount };
  }

}

export default BitstampOrderTracer;