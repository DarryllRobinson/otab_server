const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    // competitionId: { type: DataTypes.STRING, allowNull: true },
    // brand: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.STRING, allowNull: false },
  };

  return sequelize.define('board', attributes);
}
