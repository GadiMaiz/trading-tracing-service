import Bitstamp from 'Bitstamp';

import BitstampOrderTracer from './bitstampOrderTracer';

import logger from 'logger';

import { Status, returnMessages } from 'status';

// global const shell be moved to configuration
const BITSTAMP_REQUEST_TIMEOUT = 5000;
// /// global currency pairs
const BTC_USD = 'btcusd';

class BitstampHandler {

    /**
     * as part of the construction bitstamp order tracer is being instantiated
     * @param {object} props
     * @param {string} props.key
     * @param {string} props.secret
     * @param {string} props.clientId
     */
    constructor(props) {
        this.bitstampHandler = new Bitstamp({
            key: props.key,
            secret: props.secret,
            clientId: props.clientId,
            timeout: BITSTAMP_REQUEST_TIMEOUT,
            rateLimit: true // turned on by default
        });
        this.bitstampOrderTracer = new BitstampOrderTracer(this.bitstampHandler);
    }

    /**
     * the function returnes user data returned from the client
     */
    async getUserAccountData() {
        const ret = await this.bitstampHandler.balance();
        logger.debug('about to send get user data request');
        return ret.body;
    }

    /**
     * if it is possible to buy the whole amount of coins at the requested price or cheaper the transaction will happened
     * if not the request will fail
     * @param {object} params
     * @param {string} params.amount - (double as string) how many coins should be sold
     * @param {string} params.price -  (double as string) the price per single coin
     */
    async buyImmediateOrCancel(params) {
        const currency = (!params.currency) ? BTC_USD : params.currency;
        logger.debug('sending buy immediate or cancel order request');
        return await this.sendOrder('buy', { amount: params.amount, price: params.price, currency: currency, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: true });
    }

    /**
     * if it is possible to sell the whole amount of coins at the requested price or higher the transaction will happened
     * if not the request will fail
     * @param {object} params
     * @param {string} params.amount - (double as string) how many coins should be bought
     * @param {string} params.price -  (double as string) the price per single coin
     */
    async sellImmediateOrCancel(params) {
        const currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        logger.debug('sending sell immediate or cancel order request');
        return await this.sendOrder('sell', { amount: params.amount, price: params.price, currency: currency, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: true });
    }

    /**
     * a make sell order request being sent
     * @param {object} params
     * @param {string} params.amount - (double as string) how many coins should be sold
     * @param {string} params.price -  (double as string) the price per single coin
     */
    async sellLimit(params) {
        const currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        logger.debug('sending sell limit order request');
        return await this.sendOrder('sell', { amount: params.amount, price: params.price, currency: currency, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: null });
    }


    /**
     * a make buy order request being sent
     * @param {object} params
     * @param {string} params.amount - (double as string) how many coins should be bought
     * @param {string} params.price -  (double as string) the price per single coin
     */
    buyLimit(params) {
        const currency = (params.currency == null) || (params.currency == undefined) ? BTC_USD : params.currency;
        logger.debug('sending buy limit order request');
        return this.sendOrder('buy', { amount: params.amount, price: params.price, currency: currency, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: null });
    }

    async sendOrder(type, params) {
        let result = null;

        if (type === 'sell') {
            result = await this.bitstampHandler.sellLimitOrder(params.amount, params.price, params.currency, params.limitPrice, params.dailyOrder, params.iocOrder);
        }
        else {
            result = await this.bitstampHandler.buyLimitOrder(params.amount, params.price, params.currency, params.limitPrice, params.dailyOrder, params.iocOrder);
        }

        if (!result) {
            throw new ERROR('request to bitstamp failed');
        }
        const transactionId = result.body.id;

        await this.bitstampOrderTracer.addNewTransaction({
            bitstampOrderId: transactionId,
            amount: result.body.amount,
            price: result.body.price,
            type: 'sell',
            bitmainId: null
        });
        return { status: returnMessages.OrderSent, orderId: transactionId };
    }
}

let bitstampHandler;

/**
 * this is an implemintation of singletone
 * if the object already exist returnes the instance else creates the object and retunes the instance
 * @param {object} parameters -  being dligated to the BitstampHandler constructor
 */
const getInstance = (parameters) => {
    if (!bitstampHandler) {
        bitstampHandler = new BitstampHandler(parameters);
    }
    return bitstampHandler;
};

module.exports = getInstance;