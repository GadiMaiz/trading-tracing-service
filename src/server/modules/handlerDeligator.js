
import Exchanges from './exchanges.js';

class HandlerDeligartor {

    // initializalize all handlers
    constructor() {
        const getInstance = require(Exchanges['bitstamp']); // todo for loop
        getInstance(bitstampCredencials);

    }

    getUserAccountData(exchange, result) {
        const getInstance = require(Exchanges[exchange]);
        getInstance().getUserAccountData(result);
    }

    buyImmediateOrCancel(exchange, params) {
        const getInstance = require(Exchanges[exchange]);
        return getInstance().buyImmediateOrCancel(params);
    }

    sellImmediateOrCancel(exchange, params) {
        const getInstance = require(Exchanges[exchange]);
        return getInstance().sellImmediateOrCancel(params);
    }

    sellLimit(exchange, params) {
        const getInstance = require(Exchanges[exchange]);
        return getInstance().sellLimit(params);
    }

    buyLimit(exchange, params) {
        const getInstance = require(Exchanges[exchange]);
        return getInstance().buyLimit(params);
    }
}

export default HandlerDeligartor;