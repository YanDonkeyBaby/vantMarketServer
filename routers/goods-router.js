const Router = require("@koa/router")
const GoodsGatetory = require("../models/goods-category-model")
const Goods = require("../models/goods-model")
const GoodsInfo = require("../models/goods-info-model")
const GoodsSku = require("../models/goods-sku-model")
const GoodsAttrKey = require("../models/goods-attr-key-model")
const GoodsAttrValue = require("../models/goods-attr-value-model")

const router = new Router({
    prefix:"/goods"
})

router.get("/categories",async function (ctx){
    let categories = await GoodsGatetory.findAll({
        attributes:["id","category_name"]
    })
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: categories
    }
})

router.get("/goods",async function (ctx){
    let whereObj = {}
    let page_size = 20,page_index = 1;
    if(ctx.query.page_size){
        page_size = Number(ctx.query.page_size)
    }
    if(ctx.query.page_index){
        page_index = Number(ctx.query.page_index)
    }
    if(ctx.query.category_id){
        whereObj['category_id'] = Number(ctx.query.category_id)
    }
    Goods.hasMany(GoodsInfo,{foreignKey:'goods_id',targetKey:'id'})
    let goods = await Goods.findAndCountAll({
        where:whereObj,
        order: [
            ['id', 'desc']
        ],
        limit: page_size,
        offset: (page_index-1)*page_size,
        include:[{
            model:GoodsInfo,
            attributes:['content','kind','goods_id'],
            where:{'kind':0}
        }],
        distinct:true
    })
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: goods
    }
})

router.get("/goods/:id",async function (ctx){
    let goodsId = Number(ctx.params.id)
    Goods.hasMany(GoodsInfo,{foreignKey:'goods_id',targetKey:'id'})
    let goods = await Goods.findOne({
        where: {
            id:goodsId
        },
        include:[{
            model:GoodsInfo,
            attributes:['content','kind','goods_id']
        }]
    })
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: goods
    }
})

router.get("/goods/:id/sku",async function (ctx){
    let goodsId = Number(ctx.params.id)
    GoodsAttrKey.hasMany(GoodsAttrValue,{foreignKey:'attr_key_id',targetKey:'id'})

    let goodsSku = await GoodsSku.findAll({
        where: {
            goods_id:goodsId
        }
    })
    let goodsAttrKeys = await GoodsAttrKey.findAll({
        where:{
            goods_id:goodsId
        },
        attributes:['id','attr_key','goods_id'],
        include:[{
            model:GoodsAttrValue,
            attributes:['id','attr_key_id','attr_value','goods_id']
        }],
        distinct:true
    })
    ctx.status = 200
    ctx.body = {
        code: 200,
        msg: 'ok',
        data: {
            goodsSku,
            goodsAttrKeys
        }
    }
})

module.exports = router