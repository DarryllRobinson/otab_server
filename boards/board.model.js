const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  // const attributes = {
  //   competition: { type: DataTypes.STRING, allowNull: false },
  //   brand: { type: DataTypes.STRING, allowNull: false },
  //   userId: { type: DataTypes.STRING, allowNull: false },
  // };

  return sequelize.define('board');
}
