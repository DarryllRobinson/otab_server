const config = require('config.json');
const mysql = require('mysql2');
const { Sequelize } = require('sequelize');
const { Op, QueryTypes } = require('sequelize');
const db = require('_helpers/db');

module.exports = { getSong, getTiles, update, create };

function getSong() {
  console.log('service getting song');
  return true;
}

async function getTiles(boardId) {
  const sequelize = await connect(
    config.database.user,
    config.database.password
  );
  const tiles = await sequelize.query(
    `SELECT otab.tiles.* 
      FROM otab.tiles
      WHERE tiles.boardId = '${boardId}';`,
    { type: QueryTypes.SELECT }
  );
  // console.log('found board tiles: ', tiles);
  return collapsedArtists(tiles);
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

async function update(id, params) {
  const tile = await getTile(id);

  // Check if tile already submitted
  if (tile.submitted) {
    throw 'Tile already submitted';
  }
  // copy params to tile and save
  Object.assign(tile, params);
  await tile.save();

  return tile;
}

async function getTile(id) {
  const tile = await db.Tile.findByPk(id);
  if (!tile) throw 'Tile not found';
  return tile;
}

async function create(params) {
  // console.log('********************* create service: ', params);
  const tile = new db.Tile(params);
  // console.log('********************* tile: ', params);
  // Save tile
  try {
    const result = await tile.save();
    // console.log('result: ', result);
    return tile;
  } catch (error) {
    console.log('Save error: ', error);
    return error;
  }
}

function collapsedArtists(tiles) {
  // console.log('tiles: ', tiles);

  // Step through array of tiles to collapse artists in each object
  tiles.forEach((tile) => {
    const {
      artist0,
      artist1,
      artist2,
      chosenArtist,
      correctArtist,
      correctSong,
      submitted,
      createdAt,
      updatedAt,
      boardId,
    } = tile;

    // Push artists into an array
    let artists = [];
    artists.push(artist0, artist1, artist2);
    tile.artists = artists;

    // Remove string artists as now they're in an array
    delete tile.artist0;
    delete tile.artist1;
    delete tile.artist2;
  });
  // console.log('collapsed tiles: ', tiles);
  return tiles;
}
