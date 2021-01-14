const { wepay: WechatPay } = require('koa3-wechat');
const short = require('short-uuid');
// const fs = require('fs');
const wepay = require("../lib/wepay")
const Order = require("../models/order-model")
const wepay2 = require('../lib/wepay2')
const wepay3 = require('../lib/wepay3')

function init(router) {
  // post /user/my/order
  // 下新定单，准备支付
  router.post('/my/order', async ctx => {
    let { uid: userId, openId } = ctx.user
    let { totalFee, addressId, addressDesc, goodsCartsIds, goodsNameDesc } = ctx.request.body
    // 为测试方便，所有金额支付数均为1分
    totalFee = 1
    let payState = 0
    // 依照Order模型接收参数
    let outTradeNo = `${new Date().getFullYear()}${short().new()}`
    // 获取订单的预支付信息
    var trade = {
      body: goodsNameDesc.substr(0, 127), //最长127字节
      attach: '支付测试', //最长127字节
      out_trade_no: outTradeNo, //
      total_fee: totalFee, //以分为单位，货币的最小金额
      trade_type: 'JSAPI',//NATIVE
      spbill_create_ip: ctx.request.ip, //ctx.request.ip
      openid: openId
    };
    var params = await wepay.getBrandWCPayRequestParams(trade);
    let err = '', res
    if (params && params.package && params.paySign) {
      // 创建记录
      res = await Order.create({
        userId,
        outTradeNo,
        payState,
        totalFee,
        addressId,
        addressDesc,
        goodsCartsIds,
        goodsNameDesc
      })
      if (!res) err = 'db create error'
    } else {
      err = 'error! return null!'
      console.log(err);
    }
    ctx.status = 200
    ctx.body = {
      code: 200,
      msg: !err ? 'ok' : '',
      data: {
        res,
        params
      }
    }
  })

  // post /user/my/order2
  // 使用weixin-pay实现的接口，测试通过
  router.post('/my/order2', async ctx => {
    let { uid: userId, openId } = ctx.user
    let { totalFee, addressId, addressDesc, goodsCartsIds, goodsNameDesc } = ctx.request.body
    // 为测试方便，所有金额支付数均为1分
    totalFee = 1
    let payState = 0
    // 依照Order模型接收参数
    let outTradeNo = `${new Date().getFullYear()}${short().new()}`
    console.log('outTradeNo', outTradeNo);
    // 获取订单的预支付信息
    var trade = {
      body: goodsNameDesc.substr(0, 127), //最长127字节
      out_trade_no: outTradeNo, //
      total_fee: totalFee, //以分为单位，货币的最小金额
      spbill_create_ip: ctx.request.ip, //ctx.request.ip
      notify_url: 'https://rxyk.cn/apis/pay_notify', // 支付成功通知地址
      trade_type: 'JSAPI',
      openid: openId
    };
    let params = await (() => {
      return new Promise((resolve, reject) => {
        wepay2.getBrandWCPayRequestParams(trade, (err, result) => {
          console.log(err, result);
          if (err) reject(err)
          else resolve(result)
        });
      })
    })()
    let err = '', res
    if (params && params.package && params.paySign) {
      // 创建记录
      res = await Order.create({
        userId,
        outTradeNo,
        payState,
        totalFee,
        addressId,
        addressDesc,
        goodsCartsIds,
        goodsNameDesc
      })
      if (!res) err = 'db create error'
    } else {
      err = 'error! getBrandWCPayRequestParams() return null!'
      console.log(err);
    }
    ctx.status = 200
    ctx.body = {
      code: 200,
      msg: !err ? 'ok' : '',
      data: {
        res,
        params
      }
    }
  })

  // 使用小微商户支付
  // post /user/my/order3
  // 使用weixin-pay实现的接口，测试通过
  router.post('/my/order3', async ctx => {
    let { uid: userId, openId } = ctx.user
    let { totalFee, addressId, addressDesc, goodsCartsIds, goodsNameDesc } = ctx.request.body
    // 为测试方便，所有金额支付数均为1分
    totalFee = 1
    let payState = 0
    // 依照Order模型接收参数
    let outTradeNo = `${new Date().getFullYear()}${short().new()}`
    // console.log('outTradeNo', outTradeNo);
    // 获取订单的预支付信息
    var trade = {
      body: goodsNameDesc.substr(0, 127), //最长127字节
      out_trade_no: outTradeNo, //
      total_fee: totalFee, //以分为单位，货币的最小金额
      spbill_create_ip: ctx.request.ip, //ctx.request.ip
      notify_url: 'https://rxyk.cn/apis/pay_notify2', // 支付成功通知地址
      trade_type: 'JSAPI',
      openid: openId
    };
    let params = wepay3.getOrderParams(trade)
    console.log('params', params);
    let err = '', res
    // 在这里还没有产生package，因为prepay_id还没有产生
    if (params && params.sign) {
      // 创建记录
      res = await Order.create({
        userId,
        outTradeNo,
        payState,
        totalFee,
        addressId,
        addressDesc,
        goodsCartsIds,
        goodsNameDesc
      })
      if (!res) err = 'db create error'
    } else {
      err = 'error! return null!'
      console.log(err);
    }
    ctx.status = 200
    ctx.body = {
      code: 200,
      msg: !err ? 'ok' : '',
      data: {
        res,
        params
      }
    }
  })

}

module.exports = {
  init
}