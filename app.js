const express = require('express');
const app = express();
const http = require('http');
const FirebaseListener = require('./service/firebase-listener')

// start listening to firebase branch
FirebaseListener.listenForNotificationRequests();

// Set up express endpoints
app.use('/', require('./routes/health'));
const port = normalizePort(process.env.PORT || 8080);
app.set('port', port);

const server = http.createServer(app);
server.listen(port, function () {
  console.log('Example app listening on port ' + port)
});

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}