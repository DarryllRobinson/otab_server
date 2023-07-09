const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
//const cors = require('cors');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Check to see if there is anything worth copying from here
// /Users/darryllrobinson/projects/node_rest_api_mysql/app.js

// bcrypt config

// allow cors requests from any origin and with credentials
// app.use(
//   cors({
//     origin: (origin, callback) => callback(null, true),
//     credentials: true,
//   })
// );

// api routes
// Simple test route
app.get('/', (req, res) => {
  res.send('hello world');
});

// Health check
app.use('/healthcheck', require('./helpers/healthchecker'));

//app.use('/api/users', require('./users/users.controller'));
// app.get('/api/users', (req, res) => {
//   res.send('users');
// });

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

app.listen(port, () => console.log('Server listening on port ' + port));
