const Router = require("@koa/router")
const jssdk = require('../lib/jssdk')

const router = new Router({
  prefix:"/apis/backend"
})
router.use(jssdk.webAuthMiddleware)

router.get("/", async function(ctx) {
  let pkg = await jssdk.getSignature(`${ctx.request.origin}${ctx.request.url}`);
  // console.log('mpuser:',ctx.mpuser);
  await ctx.render('backend/index', {
    hi: new Date(),
    jssdkConfig:pkg,
    user:ctx.mpuser
  })
})

module.exports = router