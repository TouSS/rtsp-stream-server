const child_process = require('child_process')
const EventEmitter = require('events')

class VideoStream extends EventEmitter {
    constructor(url, options) {
        super()
        options = {
            '-rtsp_transport': 'tcp',
            '-i': url,
            '-f': 'mpegts',
            '-codec:v': 'mpeg1video',
            '-codec:a': 'mp2',
            '-stats': '',
            ...options
        }

        let params = []
        for (let key in options) {
            params.push(key)
            if (String(options[key]) !== '') {
                params.push(String(options[key]))
            }
        }
        params.push('-')
        this.stream = child_process.spawn('ffmpeg', params, { detached: false })
        this.stream.stdout.on('data', (data) => { return this.emit('data', data) })
        this.stream.stderr.on('data', (data) => { return this.emit('error', data) })
        this.stream.on('exit', (code, signal) => { return this.emit('exit', code, signal) })
        this.options = options
    }

    close() {
        this.stream.stdout.removeAllListeners();
        this.stream.stderr.removeAllListeners();
        this.stream.kill();
    }
}

module.exports = VideoStream