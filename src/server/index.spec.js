// import { expect } from 'chai';
let chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
import autoInject from 'async/autoInject';

// import { Status, returnMessages } from 'status';
import { BitstampHandler } from './modules/bitstamp/bitstampHandler';
import BitstampOrderTracer from './modules/bitstamp/bitstampOrderTracer';
// import Bitstamp from './thirdParty/bitstamp/Bitstamp';



const json1 = { body: { username: 'userX', balance: '100000' } };
const validRetVal = { body: { status_code: 0, status: 'order sent', id: '2088374564' } };
const internalTransaction = { bitstampOrderId: '2092218561', amount: '7358.93', price: '0.06286195', type: 'buy', requestId: '1111111' };

class BitstampWrapperMock {
  balance() {
    return json1;
  }
  buyLimitOrder(amount, price, currency, limitPrice, dailyOrder, iocOrder) {
    return validRetVal;
  }

  sellLimitOrder(amount, price, currency, limitPrice, dailyOrder, iocOrder) {
    return validRetVal;
  }

  openOrdersAll(params = null) {

  }

  orderStatus(orderId) {

  }
}

class BitstampOrderTracerMock {
  addNewTransaction(params) {
    // console.log('transaction');

  }
}

class TickerStreamMock {
  subscribe() {
    // console.log('subscribe');
  }

  on(subject, func) {
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
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);
      let ret = await bitstampHandler.getUserAccountData();
      chai.expect(ret).to.equal(json1.body);
    });

    it('buyImmediateOrCancel valid request', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };
      let ret = await bitstampHandler.buyImmediateOrCancel(params);
      chai.expect(ret.status_code).to.equal(0);
    });

    it('buyImmediateOrCancel buyLimitOrder internal request failure', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();

      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.buyLimitOrder = func;

      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };

      return chai.expect(bitstampHandler.buyImmediateOrCancel(params)).to.eventually.be.rejected;
    });

    it('sellImmediateOrCancel valid request', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };
      let ret = await bitstampHandler.sellImmediateOrCancel(params);
      chai.expect(ret.status_code).to.equal(0);
    });

    it('sellImmediateOrCancel sellLimitOrder internal request failure', () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();

      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.sellLimitOrder = func;

      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };

      return chai.expect(bitstampHandler.sellImmediateOrCancel(params)).to.eventually.be.rejected;
    });

    it('sellLimit valid request', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };
      let ret = await bitstampHandler.sellLimit(params);
      return chai.expect(ret.status_code).to.equal(0);
    });

    it('sellLimit sellLimitOrder internal request failure', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();

      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.sellLimitOrder = func;

      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };

      return chai.expect(bitstampHandler.sellLimit(params)).to.eventually.be.rejected;
    });

    it('buyLimit valid request', async () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();
      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };
      let ret = await bitstampHandler.sellLimit(params);
      chai.expect(ret.status_code).to.equal(0);
    });

    it('buyLimit buyLimitOrder internal request failure', () => {
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracerMock = new BitstampOrderTracerMock();

      let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
      bitstampWrapperMock.buyLimitOrder = func;

      let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

      let params = { currency: null, price: '6823.2', amount: '12' };

      return chai.expect(bitstampHandler.buyLimit(params)).to.eventually.be.rejected;
    });

  });
  // //////////////////////////////////////////////////////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////////////////////////////////

  describe('BitstampOrderTracer module tests', () => {


    it('addNewTransaction regular flow', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 5000 }, tickerStreamMock);

      chai.expect(Object.keys(bitstampOrderTracer.openOrders)).to.have.lengthOf(0);
      bitstampOrderTracer.addNewTransaction(internalTransaction);
      chai.expect(Object.keys(bitstampOrderTracer.openOrders)).to.have.lengthOf(1);

    });

    it('addNewTransaction - add new transaction being called twise with the same ID ', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();

      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);
      try {
        bitstampOrderTracer.addNewTransaction(internalTransaction);
      }
      catch (err) {
        chai.expect(err.status_code).to.equal(1); // status code 1 = error
      }
    });

    it('periodicStatusChecker #1 - new order was inserted and openOrdersAll returns the order (still open)', async () => {
      let tickerStreamMock = new TickerStreamMock();
      let bitstampWrapperMock = new BitstampWrapperMock();
      bitstampWrapperMock.openOrdersAll = function () {
        return { body: [{ id: internalTransaction.bitstampOrderId, datetime: '389724983274', type: '1', price: '213', amount: '0.343' }] };
      };

      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
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

      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
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
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
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
      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
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

      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
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

      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
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

      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
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

      let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
      bitstampOrderTracer.addNewTransaction(internalTransaction);

      let orders = await bitstampOrderTracer.periodicStatusChecker();
      chai.expect(Object.keys(orders)).to.have.lengthOf(1);

    });
  });
});
