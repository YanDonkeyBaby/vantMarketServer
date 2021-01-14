const DataTypes = require('sequelize')
const db = require("./mysql-db")

module.exports = db.define("goods",{
  id:{
    type:DataTypes.INTEGER(11),
    allowNull:false,
    primaryKey:true,
    autoIncrement:true
  },
  spu_no:{
    type:DataTypes.STRING(50),
    allowNull:false
  },
  goods_name:{
    type:DataTypes.STRING(50),
    allowNull:false
  },
  goods_desc:{
    type:DataTypes.TEXT("tiny"),
    allowNull:false
  },
  start_price:{
    type:DataTypes.DECIMAL(9,2),
    allowNull:false
  },
  category_id:{
    type:DataTypes.BIGINT(11),
    allowNull:false
  },
  brand_id:{
    type:DataTypes.BIGINT(11),
    allowNull:false
  }
},{
  freezeTableName:true,
  timestamps:true
});