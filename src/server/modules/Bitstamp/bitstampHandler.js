let Bitstamp = require('../../ThirdParty/bitstamp/Bitstamp');

let BitstampOrderTracer = require('./bitstampOrderTracer');

import logger from 'logger';

// /// global currency pairs
const BTC_USD = 'btcusd';
// //// global parameters
const NUM_OF_TRANSACTIONS_FOR_VALIDATIONS = 5;
// /////////////////////

class BitstampHandler {
    //  TODO GADI  we should call get user data here and save the user current amount of each coin.
    // should hold BTC, USD etc...

    constructor(props) {
        this.bitstampConnector = new Bitstamp({
            key : props.key,
            secret : props.secret,
            clientId : props.clientId,
            timeout: 5000,
            rateLimit: true // turned on by default
        });
        this.bitstampOrderTracer = new BitstampOrderTracer(this.bitstampConnector);
    }

    getUserAccountData(result) {
        this.bitstampConnector.balance().then(({ body: data }) => result.json(data));
    }

    buyImmediateOrCancel(params) {
        let currency = (params.currency == null) ? BTC_USD : params.currency;

        return new Promise(function (resolve, reject) {
            this.bitstampConnector.buyLimitOrder(params.amount, params.price, currency, null, null, true).then((result) => {
                let transactionId = result.body.id;

                this.bitstampOrderTracer.addNewTransaction({
                    'bitstampOrderId': transactionId,
                    'amount': result.body.amount,
                    'price': result.body.price,
                    'type': 'sell',
                    'bitmainId': null
                });
                resolve({ status :'order sent', orderId : transactionId });
            }).catch((err) => { return reject(err); });
        }.bind(this));
    }


    sellImmediateOrCancel(params) {
        let currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        return new Promise(function (resolve, reject) {
            this.bitstampConnector.sellLimitOrder(params.amount, params.price, currency, null, null, true).then((result) => {
                let transactionId = result.body.id;

                logger.debug('transactionId - ' + transactionId + 'is about to be inserted to queue');

                // / will be moved to function
                this.bitstampOrderTracer.addNewTransaction({
                    'bitstampOrderId': transactionId,
                    'amount': result.body.amount,
                    'price': result.body.price,
                    'type': 'sell',
                    'bitmainId': null
                });
                resolve({ status :'order sent', orderId : transactionId });
            }).catch((err) => { return reject(err); });
        }.bind(this));
    }


    sellLimit(params) {
        let currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        return new Promise(function (resolve, reject) {
            this.bitstampConnector.sellLimitOrder(params.amount, params.price, currency, params.limitPrice, null).then((result) => {
                let transactionId = result.body.id;
                let sold_amount = result.body.amount;
                let sold_price = result.body.price;

                this.bitstampOrderTracer.addNewTransaction({
                    'bitstampOrderId': transactionId,
                    'amount': result.body.amount,
                    'price': result.body.price,
                    'type': 'sell',
                    'bitmainId': null
                });

                resolve({ status :'order sent', orderId : transactionId });

            }).catch((err) => {
                return reject(err);
            });
        }.bind(this));
    }

    buyLimit(params) {
        let currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        return new Promise(function (resolve, reject) {
            this.bitstampConnector.buyLimitOrder(params.amount, params.price, currency, params.limitPrice, null).then((result) => {
                let transactionId = result.body.id;

                this.bitstampOrderTracer.addNewTransaction({
                    'bitstampOrderId': transactionId,
                    'amount': result.body.amount,
                    'price': result.body.price,
                    'type': 'sell',
                    'bitmainId': null
                });
                resolve({ status :'order sent', orderId : transactionId }); return resolve('order sent');
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