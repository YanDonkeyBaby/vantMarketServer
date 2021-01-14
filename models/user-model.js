const DataTypes = require( 'sequelize' )
const db = require("./mysql-db")

module.exports = db.define('user', {
  id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  nickName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: {
    type: DataTypes.INTEGER
  },
  language: {
    type: DataTypes.STRING(10)
  },
  city: {
    type: DataTypes.STRING(20)
  },
  province: {
    type: DataTypes.STRING(20)
  },
  country: {
    type: DataTypes.STRING(10)
  },
  openId: {
    type: DataTypes.STRING(32),
    allowNull: false
  }
},{
	freezeTableName: true, 
  timestamps: true
})