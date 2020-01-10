const http = require('http')
const Koa = require('koa')
const body = require('koa-body')
const Router = require('koa-router')

const VideoServer = require('./lib/video.server')

const app = new Koa()
const httpServer = http.createServer(app.callback())
const router = new Router()
const videoServer = new VideoServer(httpServer)

// 静态资源目录
app.use(require('koa-static')(__dirname + '/static', {
    maxage: 1000 * 60 * 10 // 浏览器缓存时间（毫秒）
}))

// 参数对象处理
app.use(body())

// 路由
router.post('/rtsp', (ctx, next) => {
    let url = ctx.request.body.url
    
    if(!url) {
        ctx.throw(500, `RTSP stream url not found.`)
    }
    ctx.body = {
        channel: videoServer.getVideoBroadcast(url)
    }
})

app.use(router.routes())
app.use(router.allowedMethods())

// 404
app.use(ctx => {
    ctx.throw(404, `No page named: ${ctx.url}.`)
})

videoServer.start()

httpServer.listen(3000)

console.log(`Server started in 3000 ...`)





