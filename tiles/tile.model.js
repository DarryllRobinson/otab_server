const { act } = require("react");
const { DataTypes } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
    // artists: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    actualArtist: { type: DataTypes.STRING },
    artist0: { type: DataTypes.STRING, allowNull: false },
    artist1: { type: DataTypes.STRING, allowNull: false },
    artist2: { type: DataTypes.STRING, allowNull: false },
    chosenArtist: { type: DataTypes.STRING },
    correctArtist: { type: DataTypes.BOOLEAN },
    correctSong: { type: DataTypes.BOOLEAN },
    submitted: { type: DataTypes.BOOLEAN },
  };

  return sequelize.define("tile", attributes);
}
