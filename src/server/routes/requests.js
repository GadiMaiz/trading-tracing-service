import express from 'express';
import Handler from 'handlerDeligator';

const handler = new Handler();
const router = express.Router();

router.post('/login', async (req, res, next) => {

    const exchange = req.body.exchange.toLowerCase();
    const key = req.body.key;
    const secret = req.body.secret;
    const clientId = req.body.clientId;
    
    try {
        const ret = await handler.login(exchange,{ key, secret, clientId });
        res.json(ret);
    }
    catch (err) {
        res.statusCode = 400;
        res.json(err);
    }
});

router.get('/getUserData', async (req, res, next) => {
    try {
        const userData = await handler.getUserAccountData('bitstamp');
        res.json(userData);
    }
    catch (err) {
        res.statusCode = 400;
        res.json(err);
    }
});

router.post('/buyImmediateOrCancel', async (req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.price;
    if (!amount || !price) {
        return next(new Error('ERROR input parameters are missing'));
    }
    try {
        const status = await handler.buyImmediateOrCancel('bitstamp', { amount: amount, price: price });
        res.json(status);
    }
    catch (err) {
        res.statusCode = 400;
        res.json(err);
    }

});

router.post('/sellImmediateOrCancel', async (req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.price;
    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }
    try {
        const status = await handler.sellImmediateOrCancel('bitstamp', { amount: amount, price: price })
        res.json(status);
    }
    catch (err) {
        res.statusCode = 400;
        res.json(err);
    }
});

router.post('/sellLimit', async (req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.limitPrice;

    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    try {
        const status = await handler.sellLimit('bitstamp', { amount: amount, price: price });
        res.json(status);
    }
    catch (err) {
        res.statusCode = 400;
        res.json(err);
    }
});

router.post('/buyLimit', async (req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.limitPrice;

    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    try {
        const status = await handler.handler.buyLimit('bitstamp', { amount: amount, price: price })
        res.json(status);
    }
    catch (err) {
        res.statusCode = 400;
        res.json(err);
    }
});


export default router;
