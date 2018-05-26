const express = require('express')

function createApp(stumble) {
  const app = express()

  app.use(express.json({
    type: (req) => true
  }))

  app.get('/', function (req, res) {
    res.send('Hello World!')
  })

  app.use(function errorHandler(err, req, res, next) {
    if (res.headersSent) {
      return next(err)
    }
    res.status(500).send({
      error: { message: err.message }
    })
  })

  app.use(function (req, res, next) {
    res.status(404).send({
      error: { message: "Not Found" }
    })
  })

  return app
}

exports.run = function run(stumble, host, port) {
  const app = createApp(stumble)
  const server = app.listen(port, host, function () {
    console.log(`HTTP server listening on ${host}:${port} for API calls`)
  })

  return server
}
