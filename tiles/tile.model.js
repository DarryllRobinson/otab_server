const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    title: { type: DataTypes.STRING, allowNull: false },
    artist1: { type: DataTypes.STRING, allowNull: false },
    artist2: { type: DataTypes.STRING, allowNull: false },
    artist3: { type: DataTypes.STRING, allowNull: false },
    chosenArtist: { type: DataTypes.STRING },
    correctArtist: { type: DataTypes.BOOLEAN },
    correctSong: { type: DataTypes.BOOLEAN },
    submitted: { type: DataTypes.BOOLEAN },
  };

  return sequelize.define('tile', attributes);
}
