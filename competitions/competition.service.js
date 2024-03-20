const config = require('config.json');
const { Op } = require('sequelize');
const db = require('_helpers/db');

module.exports = {
  getAll,
  getById,
};

async function getAll() {
  const competitions = await db.Competition.findAll();
  return competitions;
}

async function getById(id) {
  const competition = await db.Competition.getUser(id);
  return competition;
}
