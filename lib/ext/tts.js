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
    let cmdType = 'PLAY'

    if (data.message.trim().toLowerCase() === 'rand') {
      cmdType = 'PLAYRAND'
    }

    // Parse optional lang parameter in the following form: lang>message
    const cmdPattern = /^(.{0,7})>(.+)$/
    const cmdText = this.execute('parser::htmltotext', {
      html: data.message
    }).trim()
    const res = cmdPattern.exec(cmdText)
    let lang = 'fr'
    let message
    if (res !== null) {
      lang = res[1]
      message = res[2]
    } else {
      message = cmdText
    }

    try {
      // Prepare cache directory
      const conf = this.config.extensions.tts
      const cacheDir = path.join(conf.directory, "cache")
      await mkd(cacheDir)

      let filepath
      if (cmdType === 'PLAYRAND') {
        console.log('PLAYRAND')
        const filenames = await fs.readdirAsync(cacheDir)
        const filename = filenames[Math.floor(Math.random() * filenames.length)];
        filepath = path.join(cacheDir, filename)
      } else {
        console.log('PLAY')
        // Generate filename
        const hash = crypto.createHash('md5')
        hash.update(cmdText)
        const digest = hash.digest('hex')
        filepath = path.join(cacheDir, digest)

        // Generate and save voice message if not in cache
        const fileInCache = await fs.accessAsync(filepath, fs.constants.F_OK)
          .return(true).catchReturn(false)
        if (!fileInCache) {
          const ttsUrl = await googleTTS(message, lang, 1)
          const result = await request({
            url: ttsUrl,
            encoding: null,  // return response as a buffer
            headers: {
              'User-Agent': USER_AGENT,
            },
          })
          await fs.writeFileAsync(filepath, result)
        }
      }

      console.log(filepath)
      this.execute('audio::playfile', {
        filename: filepath,
        gain: 1.0,
        targetSessions: data.targetSessions,
        done: perr => {
          if (perr && perr.code !== 'APKILL')
            data.user.sendMessage('Audio output got tied up.');
        }
      })
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
  needs: ['audio', 'parser'],
  extensions: [],
  commands: [tts],
  init: stumble => {
    const conf = stumble.config.extensions.tts;
    conf.directory = path.resolve(conf.directory);
  },
};
