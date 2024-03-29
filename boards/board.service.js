const config = require('config.json');
const { Op } = require('sequelize');
const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
};

async function getAll() {
  const boards = await db.Board.findAll();
  return boards;
}

async function getById(id) {
  const board = await db.Board.getUser(id);
  return board;
}
