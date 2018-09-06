import TickerStream from 'TickerStream';

import logger from 'logger';
import { Status } from 'status';


class BitstampOrderTracer {

    /**
     * as part of the construction we initialize the ticker stream listener, and run periodic task that monitor old orders status
     * @param {object} bitstampWrapper - bitstamp handler
     * @param {object} params - all parameters
     * @param {integer} params.periodToCheck - milisec
     * @param {integer} params.oldLimit - milisec
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
                logger.err('something went wrong, order stream was triggered without data');
            }
            let order = this.openOrders[String(data.buy_order_id)];
            if (!order) {
                order = this.openOrders[String(data.sell_order_id)];
            }

            if (order) {
                // /// TO-DO GADI here we should write an event to the DB
                if (order.type === 'buy') {
                    logger.info('bought ' + data.amount_str + ' for price: ' + data.price_str);
                }
                else {
                    logger.info('sold ' + data.amount_str + ' for price: ' + data.price_str);
                }
                order.amount -= parseFloat(data.amount);
                if (order.amount === 0) {
                    // here we should send a notification to kafka
                    logger.info('NOTIFICATION : transaction was successfull !');
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


    // the function checks the status of all orders that were updated < oldLimit
    async periodicStatusChecker() {

        let found = false;
        let userOrders = null;
        const date = new Date();
        const currentTime = date.getTime();
        for (const bitstampOrderId in this.openOrders) {
            if (currentTime - this.openOrders[bitstampOrderId]['updateTime'] > this.oldLimit) {
                if (found === false) {
                    try {
                        userOrders = await this.bitstampWrapper.openOrders('btcusd');
                    }
                    catch (err) {
                        logger.err('Error requesting open orders ' + err);
                        return;
                    }
                }
                let orderFound = false;
                for (const itr in userOrders.body) {
                    if (userOrders.body[itr].id === bitstampOrderId) {
                        logger.debug('status = OPEN or InQueue');
                        this.openOrders[bitstampOrderId]['updateTime'] = currentTime;
                        orderFound = true;
                        break;
                    }
                }
                if (!orderFound) {
                    const result = await this.bitstampWrapper.orderStatus(bitstampOrderId);
                    if (!result) {
                        logger.err('order status request of order ' + bitstampOrderId + ' has failed');
                        await delete this.openOrders[bitstampOrderId];
                    }
                    if (result.body.status === 'Open' || result.body.status === 'In Queue') {
                        logger.debug('status = OPEN or InQueue');
                        this.openOrders[bitstampOrderId]['updateTime'] = currentTime;
                    }
                    else if (result.body.status === 'Canceled') {
                        logger.info('NOTIFICATION : status = CANCELED');
                        await delete this.openOrders[bitstampOrderId];
                    }
                    else if (result.body.status === 'Finished') {
                        logger.info('NOTIFICATION status = FINISHED');
                        await delete this.openOrders[bitstampOrderId];
                    }
                    else {
                        logger.err('status :' + result.body.status + ' is unknown');
                    }
                }
            }
        }
        if (this.timeout) {
            setTimeout(this.periodicStatusChecker.bind(this), this.timeout);
        }
    }

    /**
     * inserts a transaction into tracing list
     * @param {object} transactionDetails
     * @param {string} transactionDetails.bitstampOrderId - the order id that Bistamp generated for the current order
     * @param {string} transactionDetails.amount - (double as string) how many coins should be bought
     * @param {string} transactionDetails.price - (double as string) the price per single coin
     * @param {string} transactionDetails.type  - buy / sell depends on the request
     * @param {string} transactionDetails.bitmainId - the internal request id was generated upon user request
     */
    addNewTransaction(transactionDetails) {
        if (this.openOrders[String(transactionDetails.bitstampOrderId)]) {
            throw new Error('order id already exist');
        }
        const date = new Date();
        transactionDetails['updateTime'] = date.getTime();
        this.openOrders[String(transactionDetails.bitstampOrderId)] = transactionDetails;
    }

}

export default BitstampOrderTracer;