const Router = require("@koa/router")
const GoodsGatetory = require("../models/goods-category-model")

const router = new Router({
    prefix:"/good"
})

router.get("/categories",function (ctx){
    let categories = GoodsGatetory.findAll()
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: categories
    }
})