﻿require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');
// const helmet = require('helmet');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Helmet stuff to go here but I don't know enough about it yet
// helmetjs.github.io/?ref=hackernoon.com
// app.use(helmet());

// allow cors requests from any origin and with credentials
https: app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

// api routes
app.use('/users', require('./users/users.controller'));
app.use('/boards', require('./boards/boards.controller'));
app.use('/competitions', require('./competitions/competitions.controller'));
app.use('/tiles', require('./tiles/tiles.controller'));
app.use('/songs', require('./songs/songs.controller'));

// swagger docs route
app.use('/api-docs', require('_helpers/swagger'));

// global error handler
app.use(errorHandler);

// start server
const port =
  process.env.NODE_ENV === 'production' ? process.env.PORT || 80 : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));

// run this when you need to find the pid to kill
// sudo lsof -i -P | grep LISTEN | grep :$PORT
// mysql.server restart
