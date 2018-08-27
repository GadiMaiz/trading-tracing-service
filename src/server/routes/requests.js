let express = require('express');
let Handler = require('../modules/handlerDeligator');
let handler = new Handler();

// var BitstampHandler = require('../modules/bitstampHandler')
// let bitstampHandler// = new BitstampHandler()

let router = express.Router();


router.route('/getUserData').get((req, res, next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    handler.getUserAccountData('bitstamp', res);
});

router.route('/buyImmediateOrCancel').post((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    let amount = req.body.amount;
    let price = req.body.price;
    if (!amount || !price) {
        return next(new Error('ERROR input parameters are missing'));
    }
    handler.buyImmediateOrCancel('bitstamp', { 'amount': amount, 'price' : price })
        .then((status) => {
            res.json(status);
            res.statusCode = 200;
        }).catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });

});

router.route('/sellImmediateOrCancel').post((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    let amount = req.body.amount;
    let price = req.body.price;
    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    handler.sellImmediateOrCancel('bitstamp', { 'amount': amount, 'price' : price })
        .then((status) => {
            res.statusCode = 200;
            res.json(status);

        })
        .catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });
});

router.route('/sellLimit').post((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    let amount = req.body.amount;
    let price = req.body.limitPrice;

    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    handler.sellLimit('bitstamp', { 'amount': amount, 'price' : price }).then((status) => {
        res.statusCode = 200;
        res.json(status);
    })
        .catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });
});

router.route('/buyLimit').post((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    let amount = req.body.amount;
    let price = req.body.limitPrice;

    if (!amount || !price) {
        return next(new Error('ERROR input Params'));
    }

    handler.buyLimit('bitstamp', { 'amount': amount, 'price' : price }).then((status) => {
        res.statusCode = 200;
        res.json(status);
    })
        .catch((err) => {
            res.statusCode = 400;
            res.json({ status: 'failed', reason: err });
        });
});





module.exports = router;
