const crypto = require('crypto')
const path = require('path')

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const googleTTS = require('google-tts-api')
const request = require('request-promise')

const mkd = Promise.promisify(require('../gutil').mkd)

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0'


const tts = {
  handle: 'tts',
  exec: async function tts(data) {
    try {
      // Prepare cache directory
      const conf = this.config.extensions.tts
      const cacheDir = path.join(conf.directory, "cache")
      await mkd(cacheDir)

      // Generate filename
      const message = data.message.trim()
      const hash = crypto.createHash('md5')
      hash.update(message)
      const digest = hash.digest('hex')
      const filename = path.join(cacheDir, digest)

      // Generate and save voice message if not in cache
      const fileInCache = await fs.accessAsync(filename, fs.constants.F_OK)
        .return(true).catchReturn(false)
      if (!fileInCache) {
        const ttsUrl = await googleTTS(data.message, 'fr', 1)
        const result = await request({
          url: ttsUrl,
          encoding: null,  // return response as a buffer
          headers: {
            'User-Agent': USER_AGENT,
          },
        })
        await fs.writeFileAsync(filename, result)
      }

      this.execute('audio::playfile', {
        filename,
        gain: 1.0,
        targetSessions: data.targetSessions,
        done: perr => {
          if (perr && perr.code !== 'APKILL')
            data.user.sendMessage('Audio output got tied up.');
        }
      });
    } catch(err) {
      data.user.sendMessage(`An error occurred: ${err}`)
      this.emit('error', err)
      console.error(err)
    }
  },
  info: () => `<pre>
USAGE: tts TEXT
SHORTHAND: >TEXT

  </pre>`
}


module.exports = {
  handle: 'tts',
  needs: ['audio'],
  extensions: [],
  commands: [tts],
  init: stumble => {
    const conf = stumble.config.extensions.tts;
    conf.directory = path.resolve(conf.directory);
  },
};
