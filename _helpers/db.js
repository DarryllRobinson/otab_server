const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
  // create db if it doesn't already exist
  const { host, port, user, password, database, socketPath } = config.database;
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
  db.User = require('../users/user.model')(sequelize);
  db.RefreshToken = require('../users/refresh-token.model')(sequelize);
  db.Competition = require('../competitions/competition.model')(sequelize);
  db.Board = require('../boards/board.model')(sequelize);
  db.Tile = require('../tiles/tile.model')(sequelize);

  // define relationships
  db.User.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
  db.RefreshToken.belongsTo(db.User);

  db.User.hasMany(db.Board, { onDelete: 'CASCADE' });
  db.Board.belongsTo(db.User);

  db.Competition.hasMany(db.Board, { onDelete: 'CASCADE' });
  db.Board.belongsTo(db.Competition);

  db.Board.hasMany(db.Tile, { onDelete: 'CASCADE' });
  db.Tile.belongsTo(db.Board);

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
    console.log(
      'Connection to the OTAB database has been established successfully.'
    );
  } catch (error) {
    console.error('Unable to connect to the OTAB database:', error);
  }
  return sequelize;
}
