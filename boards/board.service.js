const config = require('config.json');
const mysql = require('mysql2');
const { Sequelize } = require('sequelize');
const { Op, QueryTypes } = require('sequelize');
const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
  getBoardByCompUserId,
};

async function getAll() {
  const boards = await db.Board.findAll();
  return boards;
}

async function getById(id) {
  const board = await db.Board.getUser(id);
  return board;
}

async function connect(user, password) {
  // console.log('about to try: ', user, password);
  try {
    // console.log('****************** connecting to db: ', user, password);
    const { host, port, database, socketPath } = config.database;
    const connection = mysql.createConnection({
      host,
      port,
      user,
      password,
      socketPath,
    });

    // connect to db
    // console.log('!!!!!!!!!!!!!!!!! connect to db: ', database, user, password);
    const sequelize = new Sequelize(
      database,
      user,
      password,
      {
        dialect: 'mysql',
        dialectOptions: { decimalNumbers: true, socketPath },
      },
      function (err, results) {
        if (err) throw err;
        console.log('result', results);
      }
    );
    return sequelize;
  } catch (e) {
    console.log('!@##@! Error connecting to database: ' + e.message);
    return;
  }
}

async function getBoardByCompUserId(compId, userId) {
  const sequelize = await connect(
    config.database.user,
    config.database.password
  );
  const board = await sequelize.query(
    `SELECT otab.tiles.* 
      FROM otab.users, otab.boards, otab.tiles
      WHERE users.id = boards.userId
      AND boards.id = tiles.boardId
      AND users.id = '${userId}'
      AND boards.competitionId = '${compId}';`,
    { type: QueryTypes.SELECT }
  );
  console.log('found a board: ', board);
  return board;
}
