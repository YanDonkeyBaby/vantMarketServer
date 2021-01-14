const DataTypes = require("sequelize");
const db = require("./mysql-db")

module.exports = db.define("goods_carts",{
  id:{
    type:DataTypes.INTEGER(20),
    allowNull:false,
    primaryKey:true,
    autoIncrement:true,
  },
  user_id:{
    type:DataTypes.INTEGER(20),
    allowNull:false
  },
  goods_id:{
    type:DataTypes.INTEGER(20),
    allowNull:false
  },
  goods_sku_desc:{
    type:DataTypes.TEXT('tiny'),
    allowNull:false
  },
  goods_sku_id:{
    type:DataTypes.INTEGER(20),
    allowNull:false
  },
  num:{
    type:DataTypes.INTEGER(4),
    allowNull:false
  }
},{
  freezeTableName:true,
  timestapms:true
})