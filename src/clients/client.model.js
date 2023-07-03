const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    brandName: { type: DataTypes.STRING, allowNull: false },
    tenant: { type: DataTypes.STRING, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    contactFirstName: { type: DataTypes.STRING, allowNull: true },
    contactLastName: { type: DataTypes.STRING, allowNull: true },
    contactEmail: { type: DataTypes.STRING, allowNull: true },
    contactMobile: { type: DataTypes.STRING, allowNull: true },
    accessToken: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: false },
    updatedBy: { type: DataTypes.STRING, allowNull: true },
  };

  //return sequelize.define('account', attributes, options);
  return sequelize.define('brand', attributes, {
    tableName: 'tbl_brands',
  });
}
