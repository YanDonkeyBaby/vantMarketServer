const request = require("request-promise")
const sha1 = require('sha1')
const MpUser = require('../models/mpuser-model')

// 必须使用微信认证过的服务号，才可以拉取用户基本信息（包括openId）
const appId =  "wxe3aabb71f2035af0"
const appSecret =  "cca7212fecb67ee68a4e4334ca8416a6"
const REBACK_URL = '/apis/backend'

// 该方法是为jssdk初始化准备的
async function getSignature(url){
  // console.log('url',url);
  //WeChat access_token API endpoint
  const token_url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="+appId+"&secret="+appSecret;
  //WeChat jsapi_ticket API endpoint
  const ticket_url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=";

  let nonceStr = Math.random().toString(36).substr(2, 15);
  let res = await request(token_url).catch(err=>console.log(err))
  if (!res){
    console.log('拉取token发生错误，可能需要检查公众号ip白名单');
    return null 
  }
  let data = JSON.parse(res);
  let access_token = data["access_token"];
  let res2 = await request(ticket_url+access_token).catch(err=>console.log(err))
  data = JSON.parse(res2);
  let ticket = data["ticket"];
  let timestamp = Math.round( Date.now()/1000)
  
  let sha1 = createShaString(ticket,
    timestamp,
    nonceStr,
    url);

  return {
    appId,
    timestamp,
    nonceStr,
    signature:sha1,
    url
  }
}

function createShaString(ticket,timestamp,nonce,url){
  var string1 = "jsapi_ticket="+ticket+"&noncestr="+nonce+"&timestamp="+timestamp+"&url="+url;
  // console.log(string1)
  return sha1(string1)
}

// 准备发生跳转
function startGetUserInfo(ctx, getUserInfo = false){
  let redirectUrl = encodeURIComponent(`${ctx.request.origin}${REBACK_URL}`)
  // console.log('redirectUrl',redirectUrl)
  let scope = getUserInfo?'snsapi_userinfo':'snsapi_base'
  let state = getUserInfo?'userinfo':'base'
  let targetUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUrl}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`
  ctx.status = 301
  ctx.redirect(targetUrl)
}

// 只拉取openid
async function getOpenid(code){
  let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
  let res = await request(url)
  if (typeof res == 'string') res = JSON.parse(res)
  return res 
}

// 拉取详细的用户信息，需要先取到openid
async function getUserInfo(access_token,openid){
  let url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
  console.log('url',url)
  let res = await request(url)
  if (typeof res == 'string') res = JSON.parse(res)
  return res 
}

// 处理网页授权的路由中间件
async function webAuthMiddleware(ctx, next){
  let openid = ctx.cookies.get('user_openid')
  if (!openid){
    // 先看看是不是跳转回来的
    let {code,state} = ctx.request.query 
    // 如果是跳转来的，处理跳转回来的逻辑
    if (code){
      let userinfoRange = state == 'userinfo'
      let res = await getOpenid(code)
      openid = res.openid
      /**
       * {
          errcode: 40163,
          errmsg: 'code been used, hints: [ req_id: tgjf0kMre-iJ48Za ]'
        }
       */
      if (!openid){
        ctx.status = 301
        ctx.redirect(`${ctx.request.origin}${REBACK_URL}`)
        return 
      }
      // console.log('openid',openid,res );
      if (userinfoRange){
        // 如果拉取全部用户信息，更新数据库中的用户信息，没有则先创建
        res = await getUserInfo(res.access_token, res.openid)
        let hasExistRes = await MpUser.findOne({
          where: {
            openid
          }
        })
        let mpuser = null 
        if (hasExistRes){
          await MpUser.update(res, {
            where: {
              openid
            }
          })
          mpuser = Object.assign(hasExistRes, res)
        }else{
          mpuser = await MpUser.create(res)
        }
        ctx.mpuser = mpuser
        ctx.cookies.set('user_openid',ctx.mpuser.openid)
        await next()
      }else{
        // 如果有Openid了，从库中查找用户
        let mpuserRes = await MpUser.findOne({
          where: {
            openid
          }
        })
        if (mpuserRes){
          ctx.mpuser = mpuserRes.dataValues 
          ctx.cookies.set('user_openid', ctx.mpuser.openid)
          await next()
        }else{
          // 查不到用户的话，直接再拉一遍
          startGetUserInfo(ctx, true)
        }
      }
    }else{
      // 先获取openid，看能查得到用户对象
      startGetUserInfo(ctx, false)
    }
  }else{
    let mpuserRes = await MpUser.findOne({
      where: {
        openid
      }
    })
    if (mpuserRes){
      ctx.mpuser = mpuserRes.dataValues 
      ctx.cookies.set('user_openid', ctx.mpuser.openid)
      await next()
    }else{
      // 清除无效的cookie
      ctx.cookies.set('user_openid','')
      // 查不到用户的话，直接再拉一遍
      startGetUserInfo(ctx, true)
    }
  }
}

module.exports = {
  getSignature,
  startGetUserInfo,
  getOpenid,
  getUserInfo,
  webAuthMiddleware
}
