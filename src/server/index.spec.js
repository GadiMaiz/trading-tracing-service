// import { expect } from 'chai';
let chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
import series from 'async/series';

import { Status, returnMessages } from 'status';
import { BitstampHandler } from './modules/bitstamp/bitstampHandler';
import BitstampOrderTracer from './modules/bitstamp/bitstampOrderTracer';
import Bitstamp from './thirdParty/bitstamp/Bitstamp';


const json1 = { body: { username: 'gadi', balance: '100000' } };
const validRetVal = { body: { status_code: 0, status: 'order sent', id: '2088374564' } };
const internalTransaction = { bitstampOrderId: '2092218561', amount: '7358.93', price: '0.06286195', type: 'buy', bitmainId: '1111111' };

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

    openOrders(params = null) {

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

        it('buyImmediateOrCancel buyLimitOrder internal request failure', () => {
            let bitstampWrapperMock = new BitstampWrapperMock();
            let bitstampOrderTracerMock = new BitstampOrderTracerMock();

            let func = function (amount, price, currency, limitPrice, dailyOrder, iocOrder) { return; };
            bitstampWrapperMock.buyLimitOrder = func;

            let bitstampHandler = new BitstampHandler(null, bitstampWrapperMock, bitstampOrderTracerMock);

            let params = { currency: null, price: '6823.2', amount: '12' };

            return chai.expect(bitstampHandler.buyImmediateOrCancel(params)).to.be.rejected;
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


        it('addNewTransaction', () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();
            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 5000 }, tickerStreamMock);

            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(0);
            bitstampOrderTracer.addNewTransaction(internalTransaction);
            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(1);

        });

        it('periodicStatusChecker #1', async () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();
            bitstampWrapperMock.openOrders = function () {
                return { body: [{ id: internalTransaction.bitstampOrderId, datetime: '389724983274', type: '1', price: '213', amount: '0.343' }] };
            };

            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
            await bitstampOrderTracer.addNewTransaction(internalTransaction);

            await setTimeout(bitstampOrderTracer.periodicStatusChecker.bind(bitstampOrderTracer), 1000);
            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(1);
        });

        it('periodicStatusChecker #2', async () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();
            bitstampWrapperMock.openOrders = function () {
                throw new Error('periodicStatusChecker #2 ERROR');
            };

            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
            await bitstampOrderTracer.addNewTransaction(internalTransaction);
            await setTimeout(bitstampOrderTracer.periodicStatusChecker.bind(bitstampOrderTracer), 1000);
            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(1);
        });

        it('periodicStatusChecker #3', async () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();

            bitstampWrapperMock.openOrders = function () {
                return { body: [] };
            };

            bitstampWrapperMock.orderStatus = function () {
                return { body: { status: 'Open' } };
            };
            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
            await bitstampOrderTracer.addNewTransaction(internalTransaction);

            await setTimeout(bitstampOrderTracer.periodicStatusChecker.bind(bitstampOrderTracer), 1000);
            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(1);
        });

        it('periodicStatusChecker #4', async () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();

            bitstampWrapperMock.openOrders = function () {
                return { body: [] };
            };

            bitstampWrapperMock.orderStatus = function () {
                return { body: { status: 'In Queue' } };
            };
            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
            await bitstampOrderTracer.addNewTransaction(internalTransaction);

            setTimeout(bitstampOrderTracer.periodicStatusChecker.bind(bitstampOrderTracer), 1000);
            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(1);
        });

        it('periodicStatusChecker #5 - not working', async () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();

            bitstampWrapperMock.openOrders = function () {
                return { body: [] };
            };

            bitstampWrapperMock.orderStatus = function (param) {
                return { body: { status: 'Canceled' } };
            };

            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
            bitstampOrderTracer.addNewTransaction(internalTransaction);
            setTimeout(bitstampOrderTracer.periodicStatusChecker.bind(bitstampOrderTracer), 1000);

            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(0);

        });

        it('periodicStatusChecker #6 - not working', async () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();

            bitstampWrapperMock.openOrders = function () {
                return { body: [] };
            };

            bitstampWrapperMock.orderStatus = function (param) {
                return { body: { status: 'Finished' } };
            };

            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
            bitstampOrderTracer.addNewTransaction(internalTransaction);
            // await bitstampOrderTracer.periodicStatusChecker();
            setTimeout(bitstampOrderTracer.periodicStatusChecker.bind(bitstampOrderTracer), 1000);

            chai.expect(Object.keys(bitstampOrderTracer.openOrders).length).to.equal(0);

        });

        it('periodicStatusChecker #7 - not working', async () => {
            let tickerStreamMock = new TickerStreamMock();
            let bitstampWrapperMock = new BitstampWrapperMock();

            let bitstampOrderTracer = new BitstampOrderTracer(bitstampWrapperMock, { periodToCheck: 0, oldLimit: 0 }, tickerStreamMock);
            bitstampOrderTracer.addNewTransaction(internalTransaction);
            return await chai.expect(bitstampOrderTracer.addNewTransaction(internalTransaction)).to.eventually.be.rejected;

        });
    });
});
