const accountConfig = require('account.config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
  // create db if it doesn't already exist
  const { host, port, user, password, database, socketPath } =
    accountConfig.database;
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    socketPath,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

  // connect to db
  const sequelize = await initSequelize(
    database,
    user,
    password,
    host,
    socketPath
  );

  // init models and add them to the exported db object
  db.Account = require('../accounts/account.model')(sequelize);
  db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

  // define relationships
  db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
  db.RefreshToken.belongsTo(db.Account);

  // sync all models with database
  await sequelize.sync();
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