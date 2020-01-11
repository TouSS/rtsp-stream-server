const EventEmitter = require('events')
const WebSocket = require('ws')
const Crypto = require('crypto')
const VideoStream = require('./video.stream')

class VideoBroadcast extends EventEmitter {
    constructor(url, options) {
        super()
        options = {
            maxIdle: 10 * 60 * 1000,
            ...options
        }
        this.name = Crypto.createHash('md5').update(url).digest('hex')
        this.stream = new VideoStream(url, options.ffmpegOption)
        this.wss = new WebSocket.Server({ noServer: true })
        this.options = options
        this.active = true
        this.init()
    }

    init() {
        this.wss.on('connection', (ws, req) => {
            const ip = req.connection.remoteAddress;
            console.log(`${this.name}: Receive a new connect from ${ip}.`)
            ws.on('close', (code, message) => {
                console.log(`${this.name}: ${ip} has disconnected, code: ${code}, message: ${message}.`)
            })
        })
        this.stream.on("data", data => {
            this.wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(data)
                } else {
                    console.error(`${this.name}: ${client.ip} disconnected with some error.`)
                    client.close()
                }
            })
        })
        this.stream.on("error", data => {
            // TODO 2020-01-11 will do something ???
        })

        this.stream.on("exit", (code, signal) => {
            this.active = false
            this.close()
            console.warn(`${this.name}: video stream has exited with ${code}, ${signal}`)
        })

        this.latestActiveTime = new Date();
    }

    addSubscriber(request, socket, head) {
        this.wss.handleUpgrade(request, socket, head, ws => {
            this.wss.emit('connection', ws, request)
            this.latestActiveTime = new Date();
        })
    }

    isIdle() {
        return (this.wss.clients.size == 0 && new Date().getTime() - this.latestActiveTime.getTime() > this.options.maxIdle)
    }

    isActive() {
        return this.active
    }

    close() {
        this.stream.close()
        this.wss.close()
    }
}

module.exports = VideoBroadcast