const DataTypes = require("sequelize")
const db = require("./mysql-db")

module.exports = db.define("goods_info",
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
  kind:{
    type:DataTypes.INTEGER(4),
    allowNull:false
  },
  content:{
    type:DataTypes.TEXT,
    allowNull:true
  }
}
,{
  freezeTableName:true,
  timestamps:true
});