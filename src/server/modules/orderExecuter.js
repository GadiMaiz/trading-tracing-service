import { orderTypes } from '../../utils/orderTypes';
import { Status, returnMessages } from 'status';
import logger from 'logger';
import Handler from 'handlerDeligator';
const handler = new Handler();

class OrderExecuter {

    async execute(order) {
        let parameters = JSON.parse(order.value);
        switch (Number(order.key)) {
            case (orderTypes.getUserData):
                console.log('getUserData');
                this.getUserData(parameters);
                break;
            case (orderTypes.login): {
                console.log('login');
                this.login(parameters);
                break;
            }
            case (orderTypes.buyImmediaOrCancel):
                console.log('buyImmediaOrCancel');
                this.buyImmediateOrCancel(parameters);
                break;
            case (orderTypes.sellImmediaOrCancel):
                console.log('sellImmediaOrCancel');
                this.sellImmediateOrCancel(parameters);
                break;
            case (orderTypes.timeBuyTaking):
                console.log('timeBuyTaking');
                break;
            case (orderTypes.timeSellTaking):
                console.log('timeSellTaking');
                break;
            case (orderTypes.timedBuyMaking):
                console.log('timedBuyMaking');
                this.timedBuyMaking(parameters);
                break;
            case (orderTypes.timedSellMaking):
                this.timedSellMaking(parameters);
                console.log('timedSellMaking');
                break;
        }
    }
    // console.log('order : ' + JSON.stringify(order));
    async login(params) {
        const exchange = params.exchange.toLowerCase();
        const key = params.key;
        const secret = params.secret;
        const clientId = params.clientId;

        try {
            const ret = await handler.login(exchange, { key, secret, clientId });
            logger.info('successfuly logged in to ' + exchange + ' exchange');
            // res.json(ret);
        }
        catch (err) {
            logger.err('could not log in to ' + exchange + ' exchange, err = ' + err);
            // res.statusCode = 400;
            // res.json(err);
        }
    }


    async getUserData(params) {
        if (!params.exchange) {
            let err = new Error(returnMessages.InputParametersMissing);
            logger.err(err);
            // err.status = 400;
            // return next(err);
        }
        const exchange = params.exchange.toLowerCase();
        try {
            const userData = await handler.getUserAccountData(exchange);
            console.log(JSON.stringify(userData));
            // res.json(userData);
        }
        catch (err) {
            logger.err(err);
            // res.statusCode = 400;
            // res.json(err);
        }
    }

    async buyImmediateOrCancel(params) {
        const amount = params.amount;
        const price = params.price;
        if (!amount || !price || !params.exchange) {
            let err = new Error(returnMessages.InputParametersMissing);
            logger.err(err);
            // err.status = 400;
            // return next(err);
        }
        const exchange = params.exchange.toLowerCase();
        try {
            const status = await handler.buyImmediateOrCancel(exchange, { amount: amount, price: price });
            console.log(status);
        }
        catch (err) {
            logger.err(err);
            // res.statusCode = 400;
            // res.json(err);
        }
    }

    async sellImmediateOrCancel(params) {
        const amount = params.amount;
        const price = params.price;
        if (!amount || !price || !params.exchange) {
            let err = new Error(returnMessages.InputParametersMissing);
            logger.err(err);
            // err.status = 400;
            // return next(err);
        }
        const exchange = params.exchange.toLowerCase();
        try {
            const status = await handler.sellImmediateOrCancel(exchange, { amount: amount, price: price });
            console.log(status);
        }
        catch (err) {
            logger.err(err);
            // res.statusCode = 400;
            // res.json(err);
        }
    }

    async timedBuyMaking(params) {
        const amount = params.amount;
        const price = params.limitPrice;
        if (!amount || !price || !params.exchange) {
            let err = new Error(returnMessages.InputParametersMissing);
            logger.err(err);
            // err.status = 400;
            // return next(err);
        }
        const exchange = params.exchange.toLowerCase();
        try {
            const status = await handler.buyLimit(exchange, { amount: amount, price: price });
            console.log(status);
        }
        catch (err) {
            logger.err(err);
            // res.statusCode = 400;
            // res.json(err);
        }
    }

    async timedSellMaking(params) {
        const amount = params.amount;
        const price = params.limitPrice;
        if (!amount || !price || !params.exchange) {
            let err = new Error(returnMessages.InputParametersMissing);
            logger.err(err);
            // err.status = 400;
            // return next(err);
        }
        const exchange = params.exchange.toLowerCase();
        try {
            const status = await handler.sellLimit(exchange, { amount: amount, price: price });
            console.log(status);
        }
        catch (err) {
            logger.err(err);
            // res.statusCode = 400;
            // res.json(err);
        }
    }

}



export default OrderExecuter;