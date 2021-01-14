const DataTypes = require("sequelize")
const db = require("./mysql-db")

module.exports = db.define("goods_category",{
  id:{
    type:DataTypes.INTEGER(11),
    allowNull:false,
    primaryKey:true,
    autoIncrement:true
  },
  category_name:{
    type:DataTypes.STRING(50),
    allowNull:false
  }
},{
  tableName:"goods_category",
  freezeTableName:true,
  timestapms:true //createdAt、updatedAt
});