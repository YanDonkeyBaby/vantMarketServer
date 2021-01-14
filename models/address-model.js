const DataTypes = require('sequelize')
const db = require("./mysql-db")

// 
module.exports = db.define("address", {
  id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {//user_id
    type: DataTypes.INTEGER(11),
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  telNumber: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  region: {
    type: DataTypes.JSON,
    allowNull: false
  },
  detailInfo: {
    type: DataTypes.STRING(200),
    allowNull: false
  }
}, {
  indexes: [{
    unique: true,// 唯一索引
    fields: ['tel_number']
  }],
  underscored: true,
  freezeTableName: true,
  timestamps: true
})