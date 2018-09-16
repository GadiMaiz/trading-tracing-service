import createError from 'http-errors';
import express from 'express';
import indexRouter from './routes';
import usersRouter from './routes/users';
import requestRouter from './routes/requests';
import logger from 'logger';
import EventQueue from '../utils/eventQueue';
import OrderExecuter from './modules/orderExecuter';

let orderExecuter = new (OrderExecuter);
let eventQueue = new EventQueue(orderExecuter);

const server = express();
server.use(express.json());

server.use('/', indexRouter);
server.use('/users', usersRouter);
server.use('/requests', requestRouter);

// catch 404 and forward to error handler
server.use(function(req, res, next) {
    next(createError(404));
});

// error handler
server.use(function(err, req, res, next) {
    // set locals, only providing error in development
    logger.err(err.message);
    res.locals.message = err.message;
    res.locals.error = server.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.end(err.message);
});

export default server;


