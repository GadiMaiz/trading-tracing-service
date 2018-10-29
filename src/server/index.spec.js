// import { expect } from 'chai';
let chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

import { BitstampHandler } from './modules/bitstamp/bitstampHandler';
import BitstampOrderTracer from './modules/bitstamp/bitstampOrderTracer';
import { currencyDictionary } from './modules/bitstamp/currencyPairs';
import { BitstampWrapperMock, BitstampOrderTracerMock, TickerStreamMock, FutureMock } from './tests/mocks';

import { Notifications } from 'smart-trader-common';
import BalanceManager from 'balanceManager';

const getBalanceRet = { body: { username: 'userX', balance: '100000' } };
const validRetVal = { body: { status_code: 0, status: 'order sent', orderId: '2088374564' } };
const internalTransaction = { currencyPair: 'BTC-USD', bitstampOrderId: '2092218561', amount: '7358.93', price: '0.06286195', type: 'buy', requestId: '1111111' };

import { EventQueue } from 'eventQueue';



class EventQueueMock {
  sendNotification(notificationType, object) {
    this.notificationType = notificationType;
    this.message = object;
  }
}


describe('all tests', () => {

  before(() => {
    console.log('before');
  });

  after(async () => {
    console.log('after');
  });

  // //////////////////////////////////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////////////////////////////////
  /** ********************************** bitstampHandler *************************************************/
  describe('bitstampHandler module tests', () => {

    it('getUserAccountData valid request', async () => {
      let expectedExchangeName = 'bitstamp';
      let expectedRequestId = '123';

      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null, eventQueueMock , bitstampWrapperMock, bitstampOrderTracerMock);
      let ret = await bitstampHandler.getUserAccountData(expectedRequestId);

      chai.expect(eventQueueMock.notificationType).to.equal(Notifications.AboutToSendToExchange);
      chai.expect(eventQueueMock.message.exchange).to.equal(expectedExchangeName);
      chai.expect(eventQueueMock.message.requestId).to.equal(expectedRequestId);

      chai.expect(ret).to.deep.equal(getBalanceRet.body);
    });

    it('buyImmediateOrCancel valid request', async () => {

      let expectedExchangeName = 'bitstamp';

      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null, eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12', currencyPair : 'BTC-USD' };
      let ret = await bitstampHandler.buyImmediateOrCancel(params);

      chai.expect(eventQueueMock.notificationType).to.equal(Notifications.AboutToSendToExchange);
      chai.expect(eventQueueMock.message.exchange).to.equal(expectedExchangeName);
      chai.expect(eventQueueMock.message.requestId).to.equal(validRetVal.requestId);
      chai.expect(eventQueueMock.message.price).to.equal(params.price);
      chai.expect(eventQueueMock.message.amount).to.equal(params.amount);

      chai.expect(ret).to.deep.equal(validRetVal.body);
    });

    it('buyImmediateOrCancel buyLimitOrder internal request failure', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let eventQueueMock = new EventQueueMock();
      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.buyLimitOrder = func;

      let bitstampHandler = new BitstampHandler(null, eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currencyPair: 'BTC-USD', price: '6823.2', amount: '12' };

      return chai.expect(bitstampHandler.buyImmediateOrCancel(params)).to.eventually.be.rejected;
    });

    it('sellImmediateOrCancel valid request', async () => {
      let expectedExchangeName = 'bitstamp';

      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null, eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { price: '6823.2', amount: '12', currencyPair : 'BTC-USD' };
      let ret = await bitstampHandler.sellImmediateOrCancel(params);

      chai.expect(eventQueueMock.notificationType).to.equal(Notifications.AboutToSendToExchange);
      chai.expect(eventQueueMock.message.exchange).to.equal(expectedExchangeName);
      chai.expect(eventQueueMock.message.requestId).to.equal(validRetVal.requestId);
      chai.expect(eventQueueMock.message.price).to.equal(params.price);
      chai.expect(eventQueueMock.message.amount).to.equal(params.amount);

      chai.expect(ret).to.deep.equal(validRetVal.body);
    });

    it('sellImmediateOrCancel sellLimitOrder internal request failure', () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();

      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.sellLimitOrder = func;

      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null, eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currencyPair: 'BTC-USD', price: '6823.2', amount: '12' };

      return chai.expect(bitstampHandler.sellImmediateOrCancel(params)).to.eventually.be.rejected;
    });

    it('sellLimit valid request', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null,eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currencyPair: 'BTC-USD', price: '6823.2', amount: '12', duration :'10', maxOrderSize : 0.02 };
      let ret = await bitstampHandler.sellLimit(params);
      return chai.expect(ret).to.deep.equal(validRetVal.body);
    });

    it('sellLimit sellLimitOrder internal request failure', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();

      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.sellLimitOrder = func;

      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null,eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currencyPair: 'BTC-USD', price: '6823.2', amount: '12', duration :'10', maxOrderSize : 0.02 };

      return chai.expect(bitstampHandler.sellLimit(params)).to.eventually.be.rejected;
    });

    it('buyLimit valid request', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null,eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currencyPair: 'BTC-USD', price: '6823.2', amount: '12', duration :'10', maxOrderSize : 0.02 };
      let ret = await bitstampHandler.sellLimit(params);
      chai.expect(ret.status_code).to.equal(0);
    });

    it('buyLimit buyLimitOrder internal request failure', () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();

      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.buyLimitOrder = func;

      let eventQueueMock = new EventQueueMock();
      let bitstampHandler = new BitstampHandler(null,eventQueueMock, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currencyPair: 'BTC-USD', price: '6823.2', amount: '12' };

      return chai.expect(bitstampHandler.buyLimit(params)).to.eventually.be.rejected;
    });

  });
  // //////////////////////////////////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////////////////////////////////

  describe('BitstampOrderTracer module tests', () => {


    it('addNewTransaction regular flow', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();
      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      chai.expect(Object.keys(bitstampOrderTracer.openOrders)).to.have.lengthOf(0);
      bitstampOrderTracer.addNewTransaction(internalTransaction);
      chai.expect(Object.keys(bitstampOrderTracer.openOrders)).to.have.lengthOf(1);

    });

    it('addNewTransaction - add new transaction being called twise with th  e same ID ', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();
      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, balanceManager,
        eventQueueMock, tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);
      try {
        bitstampOrderTracer.addNewTransaction(internalTransaction);
      }
      catch (err) {
        chai.expect(err.status_code).to.equal(1); // status code 1 = error
      }
    });

    it('calculate average - ', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();
      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, balanceManager,
        eventQueueMock, tickerStreamMock);

      let transactions = [{ amount:1, price: 100 },{ amount:1, price: 150 },{ amount:1, price: 200 }];
      let average = bitstampOrderTracer.calcAveragePrice(transactions);

      let answer = { amount:3, price: 150 };
      chai.expect(average).to.deep.equal(answer);
    });

    it('periodicStatusChecker #1 - new order was inserted and openOrdersAll returns the order (still open)', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();
      bitstampWrapperMock.openOrdersAll = function () {
        return { body: [{ id: internalTransaction.bitstampOrderId, datetime: '389724983274', type: '1', price: '213', amount: '0.343' }] };
      };
      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(1);
    });

    it('periodicStatusChecker #2 - openOrdersAll throws an exception, validating it is being handled and openOrders not being changed', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();
      bitstampWrapperMock.openOrdersAll = function () {
        throw new Error('periodicStatusChecker #2 exception');
      };

      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);
      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(1);
    });

    it('periodicStatusChecker #3 - new order was added, openOrdersAll return empty but orderStatus return "open" status  ', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      bitstampWrapperMock.openOrdersAll = function () {
        return { body: [] };
      };

      bitstampWrapperMock.orderStatus = function () {
        return { body: { status: 'Open' } };
      };
      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(1);
    });

    it('periodicStatusChecker #4 - new order was added, openOrdersAll return empty but orderStatus return "in queue" status ', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      bitstampWrapperMock.openOrdersAll = function () {
        return { body: [] };
      };

      bitstampWrapperMock.orderStatus = function () {
        return { body: { status: 'In Queue' } };
      };
      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(1);
    });

    it('periodicStatusChecker #5 -  new order was added, openOrdersAll return empty but orderStatus return "canceled" status - expected to be deleted', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      bitstampWrapperMock.openOrdersAll = function () {
        return new Promise(function (resolve) {
          resolve({ body: [] });
        });
      };

      bitstampWrapperMock.orderStatus = function () {
        return new Promise(function (resolve) {
          resolve({ body: { status: 'Canceled' } });
        });
      };

      let balanceManager = new BalanceManager(currencyDictionary);
      balanceManager.balances = { BTC: '1.1', USD: '2.2' };
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      return chai.expect(orders).to.be.empty;
    });


    it('periodicStatusChecker #6 - new order was added, openOrdersAll return empty but orderStatus return "finished" status - expected to be deleted', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      bitstampWrapperMock.openOrdersAll = function () {
        return { body: [] };
      };

      bitstampWrapperMock.orderStatus = function () {
        return { body: { status: 'Finished' } };
      };

      let balanceManager = new BalanceManager(currencyDictionary);
      bitstampWrapperMock.balance =  () => { return new FutureMock() ; };
      balanceManager.balances = { BTC: '1.1', USD: '2.2' };
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);

      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      return chai.expect(orders).to.be.empty;

    });

    it('periodicStatusChecker #7 - openOrdersAll throws an expection , make sure the it is being handled ', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      bitstampWrapperMock.openOrdersAll = function () {
        throw new Error('periodicStatusChecker #7 openOrdersAll exception');
      };

      let balanceManager = new BalanceManager(currencyDictionary);
      balanceManager.balances = { BTC: '1.1', USD: '2.2' };

      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(1);

    });

    it('periodicStatusChecker #8 - orderStatus throws an expection , make sure the it is being handled', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      bitstampWrapperMock.openOrdersAll = function () {
        return { body: [] };
      };

      bitstampWrapperMock.orderStatus = function () {
        throw new Error('periodicStatusChecker #8 orderStatus exception');
      };

      let balanceManager = new BalanceManager(currencyDictionary);
      balanceManager.balances = { BTC: '1.1', USD: '2.2' };

      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(1);

    });

    it('periodicStatusChecker #9 - new order was added, openOrdersAll return empty but orderStatus returns empty  ', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      bitstampWrapperMock.openOrdersAll = function () {
        return { body: [] };
      };

      bitstampWrapperMock.orderStatus = function () {
        return null;
      };
      let balanceManager = new BalanceManager(currencyDictionary);
      let eventQueueMock = new EventQueueMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 },
        balanceManager ,eventQueueMock , tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(0);
    });
  });
  describe('BalanceManager module tests', () => {
    it('BalanceManager - constructor dictionary saving', () => {
      let balanceManager = new BalanceManager(currencyDictionary);
      chai.expect(balanceManager.currencyDictionary).to.deep.equal(currencyDictionary);
    });

    it('BalanceManager - updateAllBalance ', () => {
      let balanceManager = new BalanceManager(currencyDictionary);

      let balances =   {
        'bch_available': '10.1',
        'bch_balance'  : '10.1',
        'btc_available': '15.12',
        'btc_balance'  : '15.12',
        'usd_available': '10051',
        'usd_balance'  : '10051'
      };

      let expectedResult = {
        'BCH': 10.1,
        'BCH_ALL'  : 10.1,
        'BTC': 15.12,
        'BTC_ALL'  : 15.12,
        'USD': 10051,
        'USD_ALL'  : 10051
      };
      balanceManager.updateAllBalance(balances);
      // console.log(JSON.stringify(balanceManager.balances));
      chai.expect(balanceManager.balances).to.deep.equal(expectedResult);
    });


    it('BalanceManager - addToBalance ', () => {
      let balanceManager = new BalanceManager(currencyDictionary);

      let balances =   {
        'bch_available': '10.1',
        'bch_balance'  : '10.1',
        'btc_available': '15.11',
        'btc_balance'  : '15.11',
        'usd_available': '10051',
        'usd_balance'  : '10051'
      };

      let expectedResult = {
        'BCH': 10.1,
        'BCH_ALL'  : 10.1,
        'BTC': 16.12,
        'BTC_ALL'  : 16.12,
        'USD': 10051,
        'USD_ALL'  : 10051
      };
      balanceManager.updateAllBalance(balances);
      balanceManager.addToBalance('BTC', 1.01);
      console.log(JSON.stringify(balanceManager.balances));
      chai.expect(balanceManager.getAllBalance()).to.deep.equal(expectedResult);
    });


    it('BalanceManager - subtractFromBalance ', () => {
      let balanceManager = new BalanceManager(currencyDictionary);

      let balances =   {
        'bch_available': '10.1',
        'bch_balance'  : '10.1',
        'btc_available': '15.11',
        'btc_balance'  : '15.11',
        'usd_available': '10051',
        'usd_balance'  : '10051'
      };

      let expectedResult = {
        'BCH': 10.1,
        'BCH_ALL'  : 10.1,
        'BTC': 14.10,
        'BTC_ALL'  : 14.10,
        'USD': 10051,
        'USD_ALL'  : 10051
      };
      balanceManager.updateAllBalance(balances);
      balanceManager.subtractFromBalance('BTC', 1.01);
      console.log(JSON.stringify(balanceManager.balances));
      chai.expect(balanceManager.getAllBalance()).to.deep.equal(expectedResult);
    });
  });
  // describe('eventQueue module tests', () => {

  //   it('eventQueue - ctor ', () => {

  //     let eventQueueP = EventQueue.prototype;
  //     let EventQueue = function() { console.log('CCCCCCCCCCCCCCCCCCCCTOR') ; };
  //     EventQueue.prototype = eventQueueP;

  //     console.log(EventQueue.prototype);
  //   });
  // });

});
