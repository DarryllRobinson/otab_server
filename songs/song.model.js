const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    title: { type: DataTypes.STRING, allowNull: false },
    artist: { type: DataTypes.STRING, allowNull: false },
    fake: { type: DataTypes.BOOLEAN, allowNull: false },
    competitionId: { type: DataTypes.NUMBER, allowNull: false },
  };

  return sequelize.define('song', attributes);
}
