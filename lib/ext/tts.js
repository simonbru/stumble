const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const googleTTS = require('google-tts-api')
const request = require('request-promise')


const tts = {
  handle: 'tts',
  exec: async function tts(data) {
    try {
      const ttsUrl = await googleTTS(data.message, 'fr', 1)
      const result = await request({
        url: ttsUrl,
        encoding: null,  // return response as a buffer
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0',
        },
      })

      const aconf = this.config.extensions.audio
      const filename = `${aconf.directory}/tempfile-${Date.now()}`
      await fs.writeFileAsync(filename, result)

      this.execute('audio::playfile', {
        filename,
        gain: 1.0,
        done: perr => {
          if (perr && perr.code !== 'APKILL')
            data.user.sendMessage('Audio output got tied up.');

          fs.unlinkSync(filename);
        }
      });
    } catch(err) {
      data.user.sendMessage(`An error occurred: ${err}`)
      console.error(err)
    }
  },
  info: () => `<pre>
USAGE: tts TEXT
SHORTHAND: >TEXT

  </pre>`
}


function shorthand (message, user) {
  const conf = this.config.extensions.tts;

  if (conf.operator && message.startsWith(conf.operator)) {
    message = message.substring(conf.operator.length);

    if (message) {
      const handle = 'tts';
      const data = { handle, user, message };

      if (this.space.has('_STANDARD_PERMISSIONS_'))
        this.execute('permissions::invoke', data);
      else
        this.invoke(handle, data);
    }
  }
}

module.exports = {
  handle: 'tts',
  needs: ['audio'],
  extensions: [],
  commands: [tts],
  init: stumble => {
    stumble.on('message', shorthand);
  },
  term: stumble => {
    stumble.removeListener('message', shorthand);
  },
};
