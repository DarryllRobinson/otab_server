const config = require('play.config.json');
const { Op } = require('sequelize');
const db = require('_helpers/play.db');

module.exports = {
  retrieve,
};

async function retrieve({ id }) {
  return await db.Board.findOne({ where: { id } });
}
