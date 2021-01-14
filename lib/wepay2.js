const WXPay = require('weixin-pay')
// const short = require('short-uuid')
const fs = require('fs')

const wxpay2 = WXPay({
  appid: "wxc3db312ddf9bcb01",
  mch_id: "1410138302",
  notify_url: 'https://rxyk.cn/apis/pay_notify', // 支付成功通知地址
  partner_key: "RHG5VbeX9h11oXaRar2FglRcCNVosCBM", //微信商户平台 API secret，非小程序 secret
  pfx: fs.readFileSync(__dirname + '/apiclient_cert.p12'), 
  passphrase: '日行一课'
});

module.exports = wxpay2