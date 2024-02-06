const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);
// app.use(cors);

// use JWT auth to secure the api
//app.use(jwt());

// api routes

// Simple test route
app.get('/', (req, res) => {
  console.log('test route');
  res.send('hello world');
});

app.use('/api/users', require('./users/user.controller'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.REACT_APP_STAGE === 'development' ? 3306 : 8081;
// let port = 0;
// switch (process.env.REACT_APP_STAGE) {
//   case 'development':
//     port = 3306;
//     break;
//   case 'production':
//     port = 8081;
//     break;
//   case 'sit':
//     port = 8082;
//     break;
//   case 'uat':
//     port = 8083;
//     break;
//   default:
//     port = 3306;
//     break;
// }

app.listen(port, () =>
  console.log(process.env.REACT_APP_STAGE + ' server listening on port ' + port)
);
