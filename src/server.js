const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use JWT auth to secure the api
app.use(jwt());

// api routes

// Simple test route
app.get('/', (req, res) => {
  res.send('hello world');
});

app.use('/users', require('./users/users.controller'));

// global error handler
app.use(errorHandler);

// start server
let port = 0;
switch (process.env.REACT_APP_STAGE) {
  case 'development':
    port = 3306;
    break;
  case 'production':
    port = 8081;
    break;
  case 'sit':
    port = 8082;
    break;
  case 'uat':
    port = 8083;
    break;
  default:
    port = 3306;
    break;
}

app.listen(port, () =>
  console.log(process.env.REACT_APP_STAGE + ' server listening on port ' + port)
);
