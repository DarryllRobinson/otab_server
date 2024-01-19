const { initialize } = require('redux-form');
const dbConfig = require('./user-config.js');
const mysql = require('mysql2');
const config = dbConfig.devConfig;

module.exports = db = {};

initialize();

async function initialize() {
  console.log('Initialising user-db connection');
}
