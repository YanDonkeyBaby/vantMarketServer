const {wepay:WechatPay} = require('koa3-wechat');
const fs = require('fs');

 // 普通商户的参数
 let config = {
  appId: 'wxc3db312ddf9bcb01', // 小程序APPID
  mchId: '1410138302',
  notifyUrl: 'https://rxyk.cn/apis/pay_notify', // 支付成功通知地址
  partnerKey: 'RHG5VbeX9h11oXaRar2FglRcCNVosCBM', // 微信商户平台的api key，在pay.weixin.qq.com设置
  pfx: fs.readFileSync(__dirname + '/apiclient_cert.p12'),
  // passphrase: '日行一课',// 添加了无法退款
}

// 初始化
let wepay = new WechatPay(config);

module.exports = wepay