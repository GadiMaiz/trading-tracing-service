
let Exchanges = require('./exchanges.js');


const bitstampCredencials = { key : 'qzYpCWQbvQKhnvIXOhMz7tIS5Z9u0xa7',
    secret : 'dj6nw6nxqWHr4GivD73QiauId0DthVeJ',
    clientId : '934248' };

class HandlerDeligartor {

    // initializalize all handlers
    constructor() {
        let getInstance = require(Exchanges['bitstamp']);
        getInstance(bitstampCredencials);

    }

    getUserAccountData(exchange, result) {
        let getInstance = require(Exchanges[exchange]);
        getInstance().getUserAccountData(result);
    }

    buyImmediateOrCancel(exchange, params) {
        let getInstance = require(Exchanges[exchange]);
        return getInstance().buyImmediateOrCancel(params);
    }

    sellImmediateOrCancel(exchange, params) {
        let getInstance = require(Exchanges[exchange]);
        return getInstance().sellImmediateOrCancel(params);
    }

    sellLimit(exchange, params) {
        let getInstance = require(Exchanges[exchange]);
        return getInstance().sellLimit(params);
    }

    buyLimit(exchange, params) {
        let getInstance = require(Exchanges[exchange]);
        return getInstance().buyLimit(params);
    }
}

module.exports = HandlerDeligartor;