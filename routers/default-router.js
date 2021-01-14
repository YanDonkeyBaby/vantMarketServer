const Router = require("@koa/router")
const getRawBody = require( 'raw-body')
const wepay = require("../lib/wepay")
const Order = require("../models/order-model")
const short = require('short-uuid');
const wepay2 = require('../lib/wepay2')
var debug = require('debug')('app');
const wepay3 = require('../lib/wepay3')

// 开放一个路由
const defaultRouter = new Router()
// 这是一个路由中间件
defaultRouter.use(async (ctx,next) => {
    let n = ~~ctx.session.views +1;
    ctx.session.views = n;
    console.log('views'+n)
    await next()
});
defaultRouter.get('/', function (ctx) {
    let n = ~~ctx.session.views;
    ctx.session.views = n;
    ctx.body = 'views' + n;
});
defaultRouter.get('/hi', function (ctx) {
  ctx.body = `hi,Request Body: ${JSON.stringify(ctx.request.body)}`;
  console.log('hi输出完毕');
});

// all /apis/pay_notify
// 本地测试：http://localhost:3000/apis/pay_notify?test=true
// 微信支付成功通知接口
defaultRouter.all('/apis/pay_notify', async ctx=>{
  const testInLocal = !!ctx.request.query.test
  // console.log('testInLocal',testInLocal);
  var rawText = await getRawBody(ctx.req, {
      encoding: 'utf-8'
  });
  if (testInLocal){
    rawText = `<xml><appid><![CDATA[wxc3db312ddf9bcb01]]></appid>
    <attach><![CDATA[支付测试]]></attach>
    <bank_type><![CDATA[OTHERS]]></bank_type>
    <cash_fee><![CDATA[1]]></cash_fee>
    <fee_type><![CDATA[CNY]]></fee_type>
    <is_subscribe><![CDATA[Y]]></is_subscribe>
    <mch_id><![CDATA[1410138302]]></mch_id>
    <nonce_str><![CDATA[1eTp670VVN04aRlpGBpHH0fKbEUgqMwK]]></nonce_str>
    <openid><![CDATA[o-hrq0EVYOTJHX9MWqk-LF-_KL0o]]></openid>
    <out_trade_no><![CDATA[2020vEPk8sib229F1rDkRgGhPh]]></out_trade_no>
    <result_code><![CDATA[SUCCESS]]></result_code>
    <return_code><![CDATA[SUCCESS]]></return_code>
    <sign><![CDATA[92AB862CF14B22193DDE9D86DC2D3701]]></sign>
    <time_end><![CDATA[20201109140319]]></time_end>
    <total_fee>1</total_fee>
    <trade_type><![CDATA[JSAPI]]></trade_type>
    <transaction_id><![CDATA[4200000728202011097892062758]]></transaction_id>
    </xml>`
  }
  
  try {
    var retobj = await wepay.notifyParse(rawText);
    console.log ("payNotify parsed:", retobj);
    /* retobj示例
    {
      appid: 'wxc3db312ddf9bcb01',
      attach: '附加信息',
      bank_type: 'OTHERS',
      cash_fee: '1',
      fee_type: 'CNY',
      is_subscribe: 'Y',
      mch_id: '1410138302',
      nonce_str: '6ma2Wk08YBGkvAaFAtSYP4el6wDBB4hd',
      openid: 'o-hrq0EVYOTJHX9MWqk-LF-_KL0o',
      out_trade_no: '20201aB6PprMLnwu7ev6aBgSZzw',
      result_code: 'SUCCESS',
      return_code: 'SUCCESS',
      sign: 'BDCFDAD06CCF5254C88F29D69B871FAE',
      time_end: '20201031173616',
      total_fee: '1',
      trade_type: 'JSAPI',
      transaction_id: '4200000727202010317871404188'
    }
    // return_code SUCCESS/FAIL此字段是通信标识，非交易标识
    // 业务结果	result_code SUCCESS/FAIL
    */
    // emitter.wechatSendOut({cmd:'payNotify', payload: retobj});
    if (retobj){
      // 商户单号
      let outTradeNo = retobj.out_trade_no
      let resultCode = retobj.result_code
      let payState = 0
      if (resultCode === 'SUCCESS'){
        // 支付成功，设置订单状态
        console.log("SUCCESS",resultCode, outTradeNo);
        payState = 1
      }else{
        payState = 2
      }
      // 存储交易单号备用
      let transactionId = retobj.transaction_id
      //  成功与失败都要同步订单状态
      let res = await Order.update({
        payState,
        transactionId
      },{
        where:{
          outTradeNo
        }
      })
      console.log(`支付状态更新${res[0] > 0?'成功':'失败'}`)
    }
    var xml = wepay.notifyResult({return_code: 'SUCCESS', return_msg: 'OK'});
    console.log("payNotify process ok: ", xml);
    ctx.body = xml;
  } catch (e) {
    console.log ("payNotify error: ", e);
    var xml = wepay.notifyResult({return_code: 'FAILURE', return_msg: 'FAIL'});
    ctx.body = xml;
  }
})

defaultRouter.all('/apis/pay_notify2', async ctx=>{
  const testInLocal = !!ctx.request.query.test
  // console.log('testInLocal',testInLocal);
  var rawText = await getRawBody(ctx.req, {
      encoding: 'utf-8'
  });
  if (testInLocal){
    rawText = `{"attach":"","mchid":"9c97b8fce69e421ca3b6a4df72754ba2","nonce_str":"cbjrIsllsqSAvOqUS3Od8zD30VUBPQws","order_id":"423378270e69458e9caeba44a4034449","out_trade_no":"2020rVTyC5Uq9E6NbWPkBgJZPA","return_code":"SUCCESS","sign":"8C8BD32B1368B3A3672CC91166759537","status":"complete","time_end":"20201116135620","total_fee":1,"transaction_id":"4200000727202011167385701175"}`
  }
  // console.log(rawText);
  
  try {
    var retobj = JSON.parse(rawText)// await wepay.notifyParse(rawText);
    console.log ("payNotify parsed:", retobj);
    /* retobj示例
    {
      appid: 'wxc3db312ddf9bcb01',
      attach: '附加信息',
      bank_type: 'OTHERS',
      cash_fee: '1',
      fee_type: 'CNY',
      is_subscribe: 'Y',
      mch_id: '1410138302',
      nonce_str: '6ma2Wk08YBGkvAaFAtSYP4el6wDBB4hd',
      openid: 'o-hrq0EVYOTJHX9MWqk-LF-_KL0o',
      out_trade_no: '20201aB6PprMLnwu7ev6aBgSZzw',
      result_code: 'SUCCESS',
      return_code: 'SUCCESS',
      sign: 'BDCFDAD06CCF5254C88F29D69B871FAE',
      time_end: '20201031173616',
      total_fee: '1',
      trade_type: 'JSAPI',
      transaction_id: '4200000727202010317871404188'
    }
    // return_code SUCCESS/FAIL此字段是通信标识，非交易标识
    // 业务结果	result_code SUCCESS/FAIL
    */
    // emitter.wechatSendOut({cmd:'payNotify', payload: retobj});
    if (retobj){
      // 商户单号
      let outTradeNo = retobj.out_trade_no
      let resultCode = retobj.return_code
      let payState = 0
      if (resultCode === 'SUCCESS'){
        // 支付成功，设置订单状态
        console.log("SUCCESS",resultCode, outTradeNo);
        payState = 1
      }else{
        payState = 2
      }
      // 存储交易单号备用
      let transactionId = retobj.transaction_id
      //  成功与失败都要同步订单状态
      let res = await Order.update({
        payState,
        transactionId
      },{
        where:{
          outTradeNo
        }
      })
      console.log(`支付状态更新${res[0] > 0?'成功':'失败'}`)
    }
    ctx.body = 'success';
  } catch (e) {
    console.log ("payNotify error: ", e);
    ctx.body = 'fail';
  }
})

// 这个接口不好使,使用koa3-weixin
// http://localhost:3000/apis/pay_refund?no=20201aB6PprMLnwu7ev6aBgSZzw
defaultRouter.get("/apis/pay_refund",async ctx=>{
  let {no:out_trade_no} = ctx.request.query
  debug('pay_refund....')
  // 尝试退款
  var retobj = await wepay.refund({ 
    out_trade_no,
    out_refund_no: short().new(),
    total_fee: 1,
    refund_fee: 1
   });
  ctx.status = 200
  ctx.body = retobj;
})

// 这个可以，使用weixin-pay
defaultRouter.get("/apis/pay_refund2",async ctx=>{
  let {no:out_trade_no} = ctx.request.query
  var data = {
      out_trade_no,
      out_refund_no: short().new(),
      total_fee: 1,
      refund_fee: 1
  };
  // 尝试退款，封装原方法
  let res = await (()=>{
    return new Promise((resolve, reject)=>{
      wepay2.refund(data,(err, result) => {
        if (err) reject(err)
        else resolve(result)
      });
    })
  })()
  console.log('res',res);
  ctx.status = 200
  ctx.body = res;
})

// get /apis/pay_refund3
// 使用小微商户接口退款
defaultRouter.get("/apis/pay_refund3",async ctx=>{
  let {no:orderId} = ctx.request.query
  // 尝试退款，封装原方法
  let res = await wepay3.refund(orderId)
  console.log('res',res);
  let msg = res.return_code == "SUCCESS"?'退款成功':'重复退款或退款异常'
  ctx.status = 200
  ctx.body = msg;
})

module.exports = defaultRouter