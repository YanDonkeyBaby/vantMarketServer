const DataTypes = require( 'sequelize' )//修改类型名称从Sequelize变成DataTypes
const db = require("./mysql-db")

module.exports = db.define("goods_attr_value",
{
  id:{
    type:DataTypes.INTEGER(11),
    allowNull:false,
    primaryKey:true,
    autoIncrement:true
  },
  goods_id:{
    type:DataTypes.INTEGER(20),
    allowNull:false
  },
  attr_key_id:{
    type:DataTypes.INTEGER(20),
    allowNull:false
  },
  attr_value:{
    type:DataTypes.STRING(50),
    allowNull:false
  }
},{
  freezeTableName:true,
  timestamps:true
})