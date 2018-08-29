import Bitstamp from 'Bitstamp';

import BitstampOrderTracer from './bitstampOrderTracer';

import logger from 'logger';

// global const shell be moved to configuration
const BITSTAMP_REQUEST_TIMEOUT = 5000;
// /// global currency pairs
const BTC_USD = 'btcusd';

class BitstampHandler {
    //  TODO GADI  we should call get user data here and save the user current amount of each coin.
    // should hold BTC, USD etc...

    constructor(props) {
        this.bitstampConnector = new Bitstamp({
            key: props.key,
            secret: props.secret,
            clientId: props.clientId,
            timeout: BITSTAMP_REQUEST_TIMEOUT,
            rateLimit: true // turned on by default
        });
        this.bitstampOrderTracer = new BitstampOrderTracer(this.bitstampConnector);
    }

    getUserAccountData(result) {
        this.bitstampConnector.balance().then(({ body: data }) => result.json(data));
    }

    buyImmediateOrCancel(params) {
        const currency = (!params.currency) ? BTC_USD : params.currency;

        return new Promise(function (resolve, reject) {
            this.bitstampConnector.buyLimitOrder(params.amount, params.price, currency, null, null, true).then((result) => {
                if (!result) {
                    return reject({ status: 'failed', reason: 'buy immediate or cancel order request failed' });
                }
                const transactionId = result.body.id;

                this.bitstampOrderTracer.addNewTransaction({
                    bitstampOrderId: transactionId,
                    amount: result.body.amount,
                    price: result.body.price,
                    type: 'sell',
                    bitmainId: null
                });
                resolve({ status: 'order sent', orderId: transactionId });
            }).catch((err) => { return reject(err); });
        }.bind(this));
    }


    sellImmediateOrCancel(params) {
        const currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        return new Promise(function (resolve, reject) {
            this.bitstampConnector.sellLimitOrder(params.amount, params.price, currency, null, null, true).then((result) => {
                if (!result) {
                    return reject({ status: 'failed', reason: 'sell immediate or cancel order request failed' });
                }
                const transactionId = result.body.id;

                logger.debug('transactionId - ' + transactionId + 'is about to be inserted to queue');

                // / will be moved to function
                this.bitstampOrderTracer.addNewTransaction({
                    bitstampOrderId: transactionId,
                    amount: result.body.amount,
                    price: result.body.price,
                    type: 'sell',
                    bitmainId: null
                });
                resolve({ status: 'order sent', orderId: transactionId });
            }).catch((err) => { return reject(err); });
        }.bind(this));
    }


    sellLimit(params) {
        const currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        return new Promise(function (resolve, reject) {
            this.bitstampConnector.sellLimitOrder(params.amount, params.price, currency, params.limitPrice, null).then((result) => {
                if (!result) {
                    return reject({ status: 'failed', reason: 'sell Limit order request failed' });
                }
                const transactionId = result.body.id;

                this.bitstampOrderTracer.addNewTransaction({
                    bitstampOrderId: transactionId,
                    amount: result.body.amount,
                    price: result.body.price,
                    type: 'sell',
                    bitmainId: null
                });

                resolve({ status: 'order sent', orderId: transactionId });

            }).catch((err) => {
                return reject(err);
            });
        }.bind(this));
    }

    buyLimit(params) {
        const currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        return new Promise(function (resolve, reject) {
            this.bitstampConnector.buyLimitOrder(params.amount, params.price, currency, params.limitPrice, null).then((result) => {
                if (!result) {
                    return reject({ status: 'failed', reason: 'buy Limit order request failed' });
                }
                const transactionId = result.body.id;

                this.bitstampOrderTracer.addNewTransaction({
                    bitstampOrderId: transactionId,
                    amount: result.body.amount,
                    price: result.body.price,
                    type: 'sell',
                    bitmainId: null
                });
                resolve({ status: 'order sent', orderId: transactionId });
            }).catch((err) => { return reject(err); });
        }.bind(this));
    }
}


let bitstampHandler;

const getInstance = (parameters) => {
    if (!bitstampHandler) {
        bitstampHandler = new BitstampHandler(parameters);
    }
    return bitstampHandler;
};

module.exports = getInstance;