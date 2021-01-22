const Router = require("@koa/router")
const koajwt = require('koa-jwt')
const jsonwebtoken = require('jsonwebtoken')
const util = require('util');
const WeixinAuth = require("../lib/koa2-weixin-auth")
const WXBizDataCrypt = require('../lib/WXBizDataCrypt')
const config = require("../config")
const User = require("../models/user-model")
const SessionKey = require("../models/session-key-model")
const GoodsCarts = require("../models/goods-carts-model")
const db = require("../models/mysql-db")
const Address = require("../models/address-model")
const Order = require("../models/order-model")
const wepay3 = require('../lib/wepay3')
const short = require('short-uuid');

const router = new Router({
    prefix: "/user"
})

// 错误处理，被koajwt挡住的请求
// 没有token或者token过期，则会返回401。
// 与下面的koajwt设置是组合使用的

router.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        if (err.status === 401) {
            ctx.status = 401
            ctx.body = "Protected resource"
        } else {
            throw err
        }
    }
})

// 如果没有验证通过，会返回404
router.use(koajwt({secret: config.jwtSecret}).unless({
    // 登录不需要验证
    path: ['/user/wexin-login', '/user/web-view']
}));

router.use(async (ctx, next) => {
    if (!ctx.url.includes('login') && !ctx.url.includes('web-view')) {
        try {
            let token = ctx.request.header.authorization;
            // console.log('token', token);
            token = token.split(' ')[1]
            // 如果签名不对，这里会报错，走到catch分支
            let payload = await util.promisify(jsonwebtoken.verify)(token, config.jwtSecret);
            // console.log('payload', payload);
            let {openId, nickName, avatarUrl, uid} = payload
            ctx['user'] = {openId, nickName, avatarUrl, uid}
            // console.log("openId,nickName, avatarUrl", openId, nickName, avatarUrl);
            // 404 bug
            await next()
        } catch (err) {
            console.log('err', err);
            throw err;
        }
    } else {
        // 这里status状态不对，也会返回404
        // 所有next都要加await，重要！
        await next()
    }
})


// 小程序的机要信息
const weixinAuth = new WeixinAuth(config.miniProgram.appId, config.miniProgram.appSecret);

router.post("/wexin-login", async (ctx) => {
    let {
        code,
        userInfo,
        encryptedData,
        iv,
        sessionKeyIsValid
    } = ctx.request.body

    console.log("sessionKeyIsValid", sessionKeyIsValid);

    let sessionKey
    // 如果客户端有token，则传来，解析
    if (sessionKeyIsValid) {
        let token = ctx.request.header.authorization;
        token = token.split(' ')[1]
        console.log('token', token)
        // token有可能是空的
        if (token) {
            let payload = await util.promisify(jsonwebtoken.verify)(token, config.jwtSecret).catch(err => {
                console.log('err', err);
            })
            console.log('payload', payload);
            if (payload) sessionKey = payload.sessionKey
        }
    }
    // 除了尝试从token中获取sessionKey，还可以从数据库中或服务器redis缓存中获取
    // 如果在db或redis中存储，可以与cookie结合起来使用，
    // 目前没有这样做，sessionKey仍然存在丢失的时候，又缺少一个wx.clearSession方法
    //
    console.log("ctx.session.sessionKeyRecordId", ctx.session.sessionKeyRecordId);
    if (sessionKeyIsValid && !sessionKey && ctx.session.sessionKeyRecordId) {
        let sessionKeyRecordId = ctx.session.sessionKeyRecordId
        console.log("sessionKeyRecordId", sessionKeyRecordId);
        // 如果还不有找到历史上有效的sessionKey，从db中取一下
        let sesskonKeyRecordOld = await SessionKey.findOne({
            where: {
                id: ctx.session.sessionKeyRecordId
            }
        })
        if (sesskonKeyRecordOld) sessionKey = sesskonKeyRecordOld.sessionKey
        console.log("从db中查找sessionKey3", sessionKey);
    }
    // 如果从token中没有取到，则从服务器上取一次
    if (!sessionKey) {
        const token = await weixinAuth.getAccessToken(code)
        // 目前微信的 session_key, 有效期3天
        console.log(token, '====')
        sessionKey = token.data.session_key;
        console.log('sessionKey2', sessionKey);
    }

    let decryptedUserInfo
    var pc = new WXBizDataCrypt(config.miniProgram.appId, sessionKey)
    // 有可能因为sessionKey不与code匹配，而出错
    // 通过错误，通知前端再重新拉取code
    decryptedUserInfo = pc.decryptData(encryptedData, iv)
    console.log('解密后 decryptedUserInfo.openId: ', decryptedUserInfo.openId)

    let user = await User.findOne({where: {openId: decryptedUserInfo.openId}})
    if (!user) {//如果用户没有查到，则创建
        let createRes = await User.create(decryptedUserInfo)
        console.log("createRes", createRes);
        if (createRes) user = createRes.dataValues
    }
    let sessionKeyRecord = await SessionKey.findOne({where: {uid: user.id}})
    if (sessionKeyRecord) {
        await sessionKeyRecord.update({
            sessionKey: sessionKey
        })
    } else {
        let sessionKeyRecordCreateRes = await SessionKey.create({
            uid: user.id,
            sessionKey: sessionKey
        })
        sessionKeyRecord = sessionKeyRecordCreateRes.dataValues
        console.log("created record", sessionKeyRecord);
    }
    // ctx.cookies.set("sessionKeyRecordId", sessionKeyRecord.id)
    ctx.session.sessionKeyRecordId = sessionKeyRecord.id
    console.log("sessionKeyRecordId", sessionKeyRecord.id);

    // 添加上openId与sessionKey
    let authorizationToken = jsonwebtoken.sign({
            uid: user.id,
            nickName: decryptedUserInfo.nickName,
            avatarUrl: decryptedUserInfo.avatarUrl,
            openId: decryptedUserInfo.openId,
            sessionKey: sessionKey
        },
        config.jwtSecret,
        {expiresIn: '3d'}//修改为3天，这是sessionKey的有效时间
    )
    Object.assign(decryptedUserInfo, {authorizationToken})

    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: decryptedUserInfo
    }
})


router.get("/my/carts", async (ctx) => {
    let {uid: user_id} = ctx.user
    let res = await db.query(`SELECT (select d.content from goods_info as d where d.goods_id = a.goods_id and d.kind = 0 limit 1) as goods_image,
  a.id,a.goods_sku_id,a.goods_id,a.num,b.goods_sku_desc,b.goods_attr_path,b.price,b.stock,c.goods_name,c.goods_desc 
  FROM goods_carts as a 
  left outer join goods_sku as b on a.goods_sku_id = b.id 
  left outer join goods as c on a.goods_id = c.id 
  where a.user_id = :user_id;`, {replacements: {user_id}, type: db.QueryTypes.SELECT})

    // 使用循环查询找到匹配的规格
    if (res) {
        for (let j = 0; j < res.length; j++) {
            let item = res[j]
            let goods_attr_path = item.goods_attr_path
            let attr_values = await db.query("select id,attr_value from goods_attr_value where find_in_set(id,:attr_value_ids)", {
                replacements: {attr_value_ids: goods_attr_path.join(',')},
                type: db.QueryTypes.SELECT
            })
            item.attr_values = attr_values
            item.sku_desc = goods_attr_path.map(attr_value_id => {
                return attr_values.find(item => item.id == attr_value_id).attr_value
            }).join(' ')
        }
    }

    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: res
    }
})

router.put("/my/carts/:id", async (ctx) => {
    let id = Number(ctx.params.id)
    let {num} = ctx.request.body
    let hasExistRes = await GoodsCarts.findOne({
        where: {
            id
        }
    })
    if (hasExistRes) {
        let res = await GoodsCarts.update(
            {
                num
            },
            {
                where: {
                    id
                }
            }
        )
        ctx.status = 200
        ctx.body = {
            code: 200,
            msg: res[0] > 0 ? 'ok' : '',
            data: res
        }
    } else {
        ctx.status = 200
        ctx.body = {
            code: 200,
            msg: '',
            data: ''
        }
    }
})

router.delete("/my/carts", async (ctx) => {
    let {ids} = ctx.request.body
    let res = await GoodsCarts.destroy({
        where: {
            id: ids
        }
    })
    ctx.status = 200;
    ctx.body = {
        code: 200,
        msg: res > 0 ? 'ok' : '',
        data: res
    }
})

router.post("/my/carts", async (ctx) => {
    let {uid: user_id} = ctx.user
    let {goods_id, goods_sku_id, goods_sku_desc} = ctx.request.body
    let num = 1
    let hasExistRes = await GoodsCarts.findOne({
        where: {
            user_id,
            goods_id,
            goods_sku_id
        }
    })
    if (hasExistRes) {//如果存在更新num
        let res = await GoodsCarts.update({
            num: hasExistRes.num + 1
        }, {
            where: {
                user_id,
                goods_id,
                goods_sku_id
            }
        })
        ctx.status = 200
        ctx.body = {
            code: 200,
            msg: res[0] > 0 ? 'ok' : '',
            data: res
        }
    } else {//不存在则创建新的记录
        let res = await GoodsCarts.create({
            user_id,
            goods_id,
            goods_sku_id,
            goods_sku_desc,
            num
        })
        ctx.status = 200
        ctx.body = {
            code: 200,
            msg: res ? 'ok' : '',
            data: res
        }
    }

})

router.get("/my/address", async (ctx) => {
    let {uid: userId} = ctx.user
    let res = await Address.findAll({
        where: {
            userId
        }
    })
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: res
    }
})

router.post("/my/address", async (ctx) => {
    let {uid: userId} = ctx.user
    let {userName, telNumber, region, detailInfo} = ctx.request.body
    let hasExistRes = await Address.findOne({
        where: {
            tel_number: telNumber
        }
    })
    let res = null
    if (!hasExistRes) {
        res = await Address.create({
            userId,
            userName,
            telNumber,
            region,
            detailInfo
        })
    }
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: res
    }
})

router.put("/my/address", async (ctx) => {
    let {id, userName, telNumber, region, detailInfo} = ctx.request.body
    let res = await Address.update(
        {
            userName,
            telNumber,
            region,
            detailInfo
        }, {
            where: {
                id
            }
        })
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: res[0] > 0 ? 'ok' : '',
        data: res
    }
})

router.delete("/my/address",async (ctx)=>{
    let {id} = ctx.request.body
    let {uid:userId} = ctx.user
    let res = await Address.destroy({
        where:{
            id,
            userId
        }
    })
    ctx.status = 200
    ctx.body= {
        code:200,
        msg:res>0?'ok':'',
        data:res
    }
})

router.post("/my/order3",async (ctx)=>{
    let {uid:userId,openId} = ctx.user
    let {totalFee, addressId, addressDesc, goodsCartsIds, goodsNameDesc } = ctx.request.body
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

module.exports = router