import createError from 'http-errors';
import express from 'express';
import indexRouter from './routes';
import usersRouter from './routes/users';
import logger from 'logger';
import OrderExecuter from './modules/orderExecuter';

class Server {
  constructor(params) {
    let orderExecuter = new OrderExecuter(params);
    const  getEventQueue = require('eventQueue');
    getEventQueue(params, (data) => orderExecuter.execute(data));

    this.server = express();
    this.server.use(express.json());

    this.server.use('/', indexRouter);
    this.server.use('/users', usersRouter);

    // catch 404 and forward to error handler
    this.server.use(function(req, res, next) {
      next(createError(404));
    });

    // error handler
    this.server.use(function(err, req, res, next) {
      // set locals, only providing error in development
      logger.error(err.message);
      res.locals.message = err.message;
      // res.locals.error =  this.server.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.end(err.message);
    });
  }
  getServer() {
    return this.server;
  }
}

export default Server;


