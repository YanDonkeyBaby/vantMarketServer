const DataTypes = require( 'sequelize' )
const db = require("./mysql-db")
const User = require("./user-model")

module.exports = db.define('session_key', {
  id: {
    type: DataTypes.INTEGER(11),
    // 允许为空
    allowNull: false,
    // 主键
    primaryKey: true,
    // 自增
    autoIncrement: true,
  },
  uid: {
    type: DataTypes.INTEGER(11),
    references: {
      model: User,
      key: 'id',
      deferrable: DataTypes.Deferrable.INITIALLY_IMMEDIATE
    },
    allowNull: false
  },
  sessionKey: {
    type: DataTypes.STRING(24),
    allowNull: false
  }
},{
	freezeTableName: true, 
  timestamps: true
})