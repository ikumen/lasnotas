/*
 *  Markdown driven blog publishing system by Thong Nguyen (lasnotas)
 *  Copyright (C) 2014 Thong Nguyen
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 *  Thong Nguyen <thong@gnoht.com>
 *
 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var models = require('./server/models/index');

var app = express();

// load configs
var config = require('./server/config');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.moment = require('moment')

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: config.getProperty("security.session.secret") || "ketchupandmustard",
    resave: true,
    saveUninitialized: true
}));

// load security
var security = require('./server/security')(app, config);

// load routes
app.use('/api', require('./server/routes/api'));
app.use('/', require('./server/routes'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    return next(err);
});

function handleError(error, req, res) {
    res.status(error.status || 500);
    res.format({
        html: function() { res.render('error', {
            error: error,
            user: req.user
        })}
        , json: function() { res.send({ 'error': error}) }
    })
}

if (app.get('env') === 'development') {
    // show pretty html output
    app.locals.pretty = true; 

    // development error handler will take precedence
    // will print stacktrace
    app.use(function(err, req, res, next) {
        console.log(err)
        var error = {
            status: err.status,
            reason: err.reason,
            message: err.message,
            error: err
        }
        handleError(error, req, res);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    var error = {
        status: err.status,
        reason: err.reason,
        message: err.message,
        error: {}
    }
    handleError(error, req, res)
});

module.exports = app;

