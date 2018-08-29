import TickerStream from 'TickerStream';

import logger from 'logger';

const PERIOD_TO_CHECK = 5000;

class BitstampOrderTracer {
    // as part of the constructor we initialize the ticker stream listener
    constructor(bitstampConnector) {
        this.openOrders = {};
        this.bitstampConnector = bitstampConnector;
        this.tickerStream = new TickerStream();
        this.tickerStreamTopic = this.tickerStream.subscribe();

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
        setInterval(this.periodicStatusChecker.bind(this), 1500);
    }

    // the function checks the status of all orders that were updated < PERIOD_TO_CHECK
    periodicStatusChecker() {
        const date = new Date();
        const currentTime = date.getTime();
        for (const bitstampOrderId in this.openOrders) {
            if (currentTime - this.openOrders[bitstampOrderId]['updateTime'] > PERIOD_TO_CHECK) {

                this.bitstampConnector.orderStatus(bitstampOrderId).then((result) => {
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
                });
            }
        }
    }

    //  *** function addNewTransaction inserts a transaction into tracing list
    addNewTransaction(transactionDetails) {
        // transactionDetails  => {bitstampOrderId : num or string, amount: double, price : double, type  : buy / sell, bitMainID : num or string}
        const date = new Date();
        transactionDetails['updateTime'] = date.getTime();
        this.openOrders[String(transactionDetails.bitstampOrderId)] = transactionDetails;
    }

}

export default BitstampOrderTracer;