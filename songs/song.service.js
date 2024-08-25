const config = require('config.json');
const mysql = require('mysql2');
const { Sequelize } = require('sequelize');
const { Op, QueryTypes } = require('sequelize');
const db = require('_helpers/db');

module.exports = { getAllByCompId };

async function getAllByCompId(id) {
  //   console.log('service getAllByCompId', id);
  const songs = await db.Song.findAll({ where: { competitionId: 1 } });
  //   const songs = await db.Song.findAll({ where: { competitionId: 1 } });
  //   console.log('songs: ', songs);
  return songs;
}
