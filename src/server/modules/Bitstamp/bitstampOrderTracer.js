import TickerStream from 'TickerStream';

import logger from 'logger';

const OLD_LIMIT = 5000;
const PERIOD_TO_CHECK = 1500;

class BitstampOrderTracer {

    /**
     * as part of the construction we initialize the ticker stream listener, and run periodic task that monitor old orders status
     * @param {object} bitstampHandler - bitstamp handler
     */
    constructor(bitstampHandler) {
        // data members
        this.openOrders = {};
        this.bitstampHandler = bitstampHandler;
        this.tickerStream = new TickerStream();
        this.tickerStreamTopic = this.tickerStream.subscribe();
        this.timeout = PERIOD_TO_CHECK; // will be taken form configuration file


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
                    this.openOrders[order.bitstampOrderId].amount = order.amount; // not sure the types match
                }
            }
        });
        setTimeout(this.periodicStatusChecker.bind(this), this.timeout);
    }

    // the function checks the status of all orders that were updated < OLD_LIMIT
    async periodicStatusChecker() {
        const date = new Date();
        const currentTime = date.getTime();
        for (const bitstampOrderId in this.openOrders) {
            if (currentTime - this.openOrders[bitstampOrderId]['updateTime'] > OLD_LIMIT) {

                const result = await this.bitstampHandler.orderStatus(bitstampOrderId);
                if (!result) {
                    logger.err('order status request of order ' + bitstampOrderId + ' has failed');
                    delete this.openOrders[bitstampOrderId];
                }
                if (result.body.status === 'Open' || result.body.status === 'In Queue') {
                    logger.info('status = OPEN or InQueue');
                    this.openOrders[bitstampOrderId]['updateTime'] = currentTime;
                }
                else if (result.body.status === 'Canceled') {
                    logger.info('NOTIFICATION : status = CANCELED');
                    delete this.openOrders[bitstampOrderId];
                }
                else if (result.body.status === 'Finished') {
                    logger.info('NOTIFICATION status = FINISHED');
                    delete this.openOrders[bitstampOrderId];
                }
                else {
                    logger.err('status :' + result.body.status + ' is unknown');
                }
            }
        }
        setTimeout(this.periodicStatusChecker.bind(this), this.timeout);
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
        const date = new Date();
        transactionDetails['updateTime'] = date.getTime();
        this.openOrders[String(transactionDetails.bitstampOrderId)] = transactionDetails;
    }

}

export default BitstampOrderTracer;