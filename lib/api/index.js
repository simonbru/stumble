const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
})

exports.run = function run(stumble, host, port) {
  const server = app.listen(port, host, function () {
    console.log(`HTTP server listening on ${host}:${port} for API calls`)
  })

  return server
}
