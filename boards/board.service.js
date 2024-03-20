const config = require('config.json');
const { Op } = require('sequelize');
const db = require('_helpers/db');

module.exports = {
  retrieveBoard,
  retrieveBoards,
};

async function retrieveBoard({ id }) {
  return await db.Board.findOne({ where: { id } });
}

async function retrieveBoards() {
  return await db.Board.findAll();
}
