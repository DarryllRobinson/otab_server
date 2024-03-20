const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    song: { type: DataTypes.STRING, allowNull: false },
    artist1: { type: DataTypes.STRING, allowNull: false },
    artist2: { type: DataTypes.STRING, allowNull: false },
    artist3: { type: DataTypes.STRING, allowNull: false },
    chosenArtist: { type: DataTypes.STRING },
    submitted: { type: DataTypes.BOOLEAN },
    correct: { type: DataTypes.BOOLEAN },
  };

  return sequelize.define('tile', attributes);
}
