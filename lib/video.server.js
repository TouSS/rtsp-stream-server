const Url = require('url');
const Crypto = require('crypto')
const VideoBroadcast = require('./video.broadcast')

class VideoServer {
    constructor(httpServer, options) {
        options = {
            context: '/',
            ...options
        }
        this.httpServer = httpServer
        this.videoBroadcasts = {}
        this.options = options
        setInterval(() => {
            for(let name in this.videoBroadcasts) {
                if(this.videoBroadcasts[name].isIdle()) {
                    this.videoBroadcasts[name].close()
                    delete this.videoBroadcasts[name]
                }
            }
        }, 10 * 60 * 1000)
    }

    start() {
        this.httpServer.on('upgrade', (request, socket, head) => {
            const pathname = Url.parse(request.url).pathname
            if (pathname.indexOf(this.options.context) === 0) {
                let videoBroadcastName = pathname.substring(this.options.context.length, pathname.length).replace('/', '')
                if (this.videoBroadcasts.hasOwnProperty(videoBroadcastName)) {
                    this.videoBroadcasts[videoBroadcastName].addSubscriber(request, socket, head);
                    return
                }
            }
            socket.destroy()
        })
    }

    getVideoBroadcast(url) {
        let name = Crypto.createHash('md5').update(url).digest('hex')
        if(this.videoBroadcasts.hasOwnProperty(name)) {
            return name
        }
        let videoBroadcast = new VideoBroadcast(url, {
            ffmpegOption: {
                '-r': 30
            }
        })
        this.videoBroadcasts[videoBroadcast.name] = videoBroadcast
        return videoBroadcast.name
    }
}

module.exports = VideoServer