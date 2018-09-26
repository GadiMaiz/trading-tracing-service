import createError from 'http-errors';
import express from 'express';
import indexRouter from './routes';
import usersRouter from './routes/users';
import logger from 'logger';
import OrderExecuter from './modules/orderExecuter';

let orderExecuter = new (OrderExecuter);
let getEventQueue = require('eventQueue');
getEventQueue(orderExecuter);

const server = express();
server.use(express.json());

server.use('/', indexRouter);
server.use('/users', usersRouter);

// catch 404 and forward to error handler
server.use(function(req, res, next) {
  next(createError(404));
});

// error handler
server.use(function(err, req, res, next) {
  // set locals, only providing error in development
  logger.error(err.message);
  res.locals.message = err.message;
  res.locals.error = server.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end(err.message);
});

export default server;


