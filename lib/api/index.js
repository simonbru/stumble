const express = require('express')

function createApp(stumble, cmdWhitelist) {
  const app = express()

  app.use(express.json({
    type: (req) => true
  }))

  app.get('/', function (req, res) {
    res.send('Hello World!')
  })

  app.post('/commands/:cmd/invoke', function (req, res) {
    const cmd = req.params.cmd
    if (!cmdWhitelist.includes(cmd)) {
      res.status(403).send({
        error: { message: "Command not in whitelist" }
      })
      return
    }
    const data = {
      message: req.body.message || "",
    }
    stumble.invoke(cmd, data)
    res.status(200).send({ status: "ok" })
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

exports.run = function run(stumble, host, port, cmdWhitelist) {
  cmdWhitelist = cmdWhitelist || []
  const app = createApp(stumble, cmdWhitelist)
  const server = app.listen(port, host, function () {
    console.log(`HTTP server listening on ${host}:${port} for API calls`)
  })

  return server
}
