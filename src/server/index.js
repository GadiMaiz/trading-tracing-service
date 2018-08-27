const createError = require('http-errors');
const express = require('express');
const path = require('path');
const indexRouter = require('./routes');
const usersRouter = require('./routes/users');
const requestRouter = require('./routes/requests');

const server = express();

// view engine setup
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'jade');

server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(express.static(path.join(__dirname, 'public')));

server.use('/requests', requestRouter);
server.use('/', indexRouter);
server.use('/users', usersRouter);

// catch 404 and forward to error handler
server.use(function(req, res, next) {
    next(createError(404));
});

// error handler
server.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.server.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

export default server;
