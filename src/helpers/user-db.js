const dbConfig = require('./user-config.js');
const mysql = require('mysql2');
const config = dbConfig.devConfig;
const { QueryTypes, Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
  console.log('Initialising user-db connection');
  // create db if it doesn't already exist
  console.log('REACT_APP_STAGE: ', process.env.REACT_APP_STAGE);
  console.log('Creating db with config: ', config);
  const { host, port, user, password, database, socketPath } = config;

  // connect to db
  console.log(
    '!!!!!!!!!!!!!!!!! connect to db:',
    host,
    port,
    user,
    password,
    database
  );

  const connection = mysql.createConnection({
    host,
    user,
    password,
    socketPath,
  });

  connection.connect(function (err) {
    if (err) {
      console.error('Error connecting: ', err.stack);
      return;
    }
    console.log('Connected as id', connection.threadId);
  });

  connection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${database}\`;`,
    async function (err, results, fields) {
      console.log('Just tried to create user database');
      if (err) console.log('err: ', err); // results contains rows returned by server
      //console.log('results: ', results);
      //console.log('fields: ', fields);

      const sequelize = await initSequelize(
        database,
        user,
        password,
        host,
        socketPath
      );
      console.log('Sequelize created');

      // sync all models with database
      initModels(db, sequelize);
      await sequelize.sync({ force: true });
      console.log('completed sync');
    }
  );

  connection.end();
}

async function initSequelize(database, user, password, host, socketPath) {
  const sequelize = new Sequelize(database, user, password, {
    dialect: 'mysql',
    dialectOptions: { decimalNumbers: true, socketPath },
    host,
    pool: {
      max: 100,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  return sequelize;
}

function initModels(db, sequelize) {
  // init models and add them to the exported db object

  db.User = require('../../bin/users/user.model.js')(sequelize);
  db.RefreshToken = require('../../bin/users/refresh-token.model.js')(
    sequelize
  );
}
