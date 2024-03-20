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
    boardId: { type: DataTypes.STRING, allowNull: false },
  };

  return sequelize.define('tbl_tiles', attributes);
}
