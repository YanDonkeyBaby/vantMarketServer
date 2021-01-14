const DataTypes = require( 'sequelize' )
const db = require("./mysql-db")

/**
 * {
  openid: 'oKW_h5js3ECnQqezklWz391DivLE',
  nickname: 'LIYI',
  sex: 1,
  language: 'zh_CN',
  city: '',
  province: '',
  country: '中国',
  headimgurl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/jQ2hBLoHpPuC2seBRvfJBQTpJ2TpibFt4AxibBJoDqCIXI4Z4PL02zUjttnVD4QNdNpfvaKX7ffyOtOLH2ObIWCA/132',
  privilege: []
}
 */
module.exports = db.define('mpuser', {
  id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  openid: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  sex: {
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
  headimgurl: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  privilege: {
    type: DataTypes.JSON,
    allowNull: false
  }
},{
  indexes: [{
    unique: true,// 唯一索引
    fields: ['openid']
  }],
  underscored: true,
	freezeTableName: true, 
  timestamps: true
})