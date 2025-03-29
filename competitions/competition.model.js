const { DataTypes } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
    name: { type: DataTypes.STRING, allowNull: false },
    brand: { type: DataTypes.STRING, allowNull: false },
    numTiles: { type: DataTypes.INTEGER, allowNull: false },
    numArtists: { type: DataTypes.INTEGER, allowNull: false },
  };

  return sequelize.define("competition", attributes);
}
