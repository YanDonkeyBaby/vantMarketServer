const Router = require("@koa/router")
const { wechat: Koa3Wechat } = require('koa3-wechat');
// const debug = require("debug")('app:server:wechat')

const config = {
    origin: 'gh_258cc5932139',
    appId: 'wxe3aabb71f2035af0',
    appSecret: 'cca7212fecb67ee68a4e4334ca8416a6',
    encodingAESKey: 'sgpc6KQQifgYRmApeea9Uoac28kUNX9HPol56CkBChB',
    token: 'yishulun2005'
}

class WechatMessageHandler {
    constructor() {
        this.router = new Router({
            prefix: "/apis/mp"
        })
        this.registerServices();
    }

    registerServices() {
        var router = this.router;
        this.msgHandler = new Koa3Wechat({
            token: config.token,
            appid: config.appId,
            encodingAESKey: config.encodingAESKey
        })
        // for receive xml message from wechat server.
        router.all('/msg', this.msgHandler.middleware(this.processWechatMessage.bind(this)));
    }

    async processWechatMessage(ctx) {
        // 微信输入信息都在this.weixin上
        var message = ctx.weixin;
        console.log("message", message)
        switch (message.MsgType) {
            case 'event': {
                var event = message.Event && message.Event.toLowerCase();
                switch (event) {
                    case 'subscribe': {
                        //关注事件
                        if (message.EventKey && (message.EventKey.indexOf('qrscene_') >= 0)) {
                            //扫描带参数二维码事件-1. 用户未关注时，进行关注后的事件推送
                            var qrscene = message.EventKey;
                            var sceneId = qrscene.substr("qrscene_".length);
                            var info = sceneId;
                            // debug ("processWechatMessage subscribe qrscene:", qrscene, ", sceneId=", sceneId, ", info=", info);
                            ctx.body = info;
                        } else {
                            // debug ("normal subscribe, not from scene id.");
                        }
                        // await this.onSubscribe(message.FromUserName);
                        break;
                    }
                    case 'unsubscribe': {
                        //取消关注事件
                        // await this.onUnsubscribe(message.FromUserName);
                        break;
                    }
                    case 'scan': {
                        //扫描带参数二维码事件-2. 用户已关注时的事件推送
                        var qrscene = message.EventKey;
                        // debug ("processWechatMessage scan qrscene:"+ qrscene);
                        ctx.body = "";
                        break;
                    }
                    case 'location': {
                        //上报地理位置事件
                        break;
                    }
                    case 'click': {
                        //自定义菜单事件-点击菜单拉取消息时的事件推送
                        break;
                    }
                    case 'view': {
                        //自定义菜单事件-点击菜单跳转链接时的事件推送
                        break;
                    }
                    default:
                        break;
                }
                break;
            }
            case 'text':
                ctx.body = {
                    content: 're' + message.Content,
                    type: 'text'
                };
                break;
            case 'image':
                break;
            case 'voice':
                break;
            case 'video':
                break;
            case 'location':
                break;
            case 'link':
                break;
            default:
                ctx.body = 'fail';
                break;
        }
    }

}

let handler = new WechatMessageHandler()
module.exports = handler.router