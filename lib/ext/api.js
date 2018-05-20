'use strict';

const api = require('../api')

const DEFAULT_CONF = {
  host: 'localhost',
  port: 3000,
}

module.exports = {
  handle: 'api',
  init: stumble => {
    const userConf = stumble.config.extensions.api;
    const conf = Object.assign({}, DEFAULT_CONF, userConf)
    const server = api.run(stumble, conf.host, conf.port)
    stumble.space.set('api.server', server);
  },
  term: stumble => {
    const server = stumble.space.get('api.server');
    server.close()
  },
  extensions: []
};
