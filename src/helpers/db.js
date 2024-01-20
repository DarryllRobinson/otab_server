const dbConfig = require('./config.js');
const mysql = require('mysql2');
const { QueryTypes, Sequelize } = require('sequelize');

// Determine which config to use for which environment
let config;

switch (process.env.REACT_APP_STAGE) {
  case 'development':
    config = dbConfig.devConfig;
    break;
  case 'sit':
    config = dbConfig.sitConfig;
    break;
  case 'uat':
    config = dbConfig.uatConfig;
    break;
  case 'production':
    config = dbConfig.prodConfig;
    break;
  default:
    config = dbConfig.devConfig;
    break;
}

module.exports = db = {};

// Connect to the sql server using mysql2 then
// create the database if it doesn't exist
// initialize sequelize then
// initialize the models
//initialize();

async function newinitialize() {
  const { host, port, user, password, database, socketPath } = config;
  console.log('connect to db: ', database, user, password);
  const sequelize = new Sequelize(database, user, password, {
    dialect: 'mysql',
    dialectOptions: { decimalNumbers: true, socketPath },
  });
  //console.log('sequelize before: ', sequelize.config);
  await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

  // update sequelize instance with database
  //sequelize.connectionManager.config.database = database;
  //sequelize.config.database = database;
  //console.log('sequelize after: ', sequelize.config);
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  // sync all models with database
  initModels(db, sequelize);
  await sequelize.sync();
  console.log('initialized');
}

async function initialize() {
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
      console.log('just tried to create database');
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

  //connection.end();
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
  //console.log('initModels ', db, sequelize);
  // init models and add them to the exported db object
  db.Client = require('../../bin/clients/client.model.js')(sequelize);

  db.User = require('../../bin/users/user.model.js')(sequelize);
  db.RefreshToken = require('../../bin/users/refresh-token.model.js')(
    sequelize
  );

  /*db.Account = require('../accounts/account.model')(sequelize);
  db.Case = require('../cases/case.model')(sequelize);
  db.Contact = require('../contacts/contact.model')(sequelize);
  db.Customer = require('../customers/customer.model')(sequelize);
  db.Invoice = require('../invoices/invoice.model')(sequelize);
  db.Outcome = require('../outcomes/outcome.model')(sequelize);
  db.Mapping = require('../mappings/mapping.model')(sequelize);*/

  // define relationships
  // add relationships for clients
  // db.Client.hasMany(
  //   db.User,
  //   { foreignKey: 'f_clientId' },
  //   { onDelete: 'CASCADE' }
  // );

  // db.User.belongsTo(
  //   db.Client,
  //   { foreignKey: 'f_clientId' },
  //   { targetKey: 'id' }
  // );
  // db.User.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
  // db.RefreshToken.belongsTo(db.User);

  // // Mapping integration
  // db.Client.hasOne(
  //   db.Mapping,
  //   { foreignKey: 'f_clientId' },
  //   { onDelete: 'CASCADE' }
  // );
  // db.Mapping.belongsTo(db.Client);

  // db.Customer.hasMany(
  //   db.Invoice,
  //   { foreignKey: 'f_customerRefNo' },
  //   { onDelete: 'CASCADE' }
  // );

  // db.Invoice.belongsTo(db.Customer, {
  //   foreignKey: 'f_customerRefNo',
  //   targetKey: 'customerRefNo',
  // });

  // db.Customer.hasMany(
  //   db.Account,
  //   { foreignKey: 'f_customerRefNo' },
  //   { onDelete: 'CASCADE' }
  // );

  // db.Account.belongsTo(db.Customer, {
  //   foreignKey: 'f_customerRefNo',
  //   targetKey: 'customerRefNo',
  // });

  // db.Account.hasMany(
  //   db.Case,
  //   {
  //     foreignKey: 'f_accountNumber',
  //   },
  //   { onDelete: 'CASCADE' }
  // );

  // db.Account.hasOne(
  //   db.Contact,
  //   {
  //     foreignKey: 'f_accountNumber',
  //   },
  //   { onDelete: 'CASCADE' }
  // );

  // db.Contact.belongsTo(db.Account, {
  //   foreignKey: 'f_accountNumber',
  //   targetKey: 'accountNumber',
  // });

  // db.Case.belongsTo(db.Account, {
  //   foreignKey: 'f_accountNumber',
  //   targetKey: 'accountNumber',
  // });
  // db.Case.hasMany(
  //   db.Outcome,
  //   {
  //     foreignKey: 'f_caseNumber',
  //   },
  //   { onDelete: 'CASCADE' }
  // );

  // db.Outcome.belongsTo(db.Case, {
  //   foreignKey: 'f_caseNumber',
  //   targetKey: 'caseNumber',
  // });
}
