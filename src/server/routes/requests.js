import express from 'express';
import Handler from 'handlerDeligator';

const handler = new Handler();
const router = express.Router();

router.get('/getUserData', (req, res, next) => {
    handler.getUserAccountData('bitstamp', res);
});

router.post('/buyImmediateOrCancel', (req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.price;
    if (!amount || !price) {
        return next(new Error('ERROR input parameters are missing'));
    }
    handler.buyImmediateOrCancel('bitstamp', { amount: amount, price : price })
        .then((status) => {
            res.json(status);
        }).catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });

});

router.post('/sellImmediateOrCancel', (req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.price;
    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    handler.sellImmediateOrCancel('bitstamp', { amount : amount, price : price })
        .then((status) => {
            res.json(status);

        })
        .catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });
});

router.post('/sellLimit', (req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.limitPrice;

    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    handler.sellLimit('bitstamp', { amount: amount, price : price }).then((status) => {
        res.json(status);
    })
        .catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });
});

router.post('/buyLimit',(req, res, next) => {
    const amount = req.body.amount;
    const price = req.body.limitPrice;

    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    handler.buyLimit('bitstamp', { amount: amount, price : price }).then((status) => {
        res.json(status);
    })
        .catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });
});

export default router;
