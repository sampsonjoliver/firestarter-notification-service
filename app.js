var firebase = require('firebase-admin');
var request = require('request');

const app = require('./health');
const http = require('http');

var API_KEY = ""; // Your Firebase Cloud Messaging Server API key

// Fetch the service account key JSON file contents
var serviceAccount = require("./serviceAccount.json");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount), // should be able to use admin.credential.applicationDefault(), on GCP
  databaseURL: "dbUrl"
});
ref = firebase.database().ref();

function listenForNotificationRequests() {
  console.log("Listening for changes on /notificationRequests");

  var requests = ref.child('notificationRequests');
  requests.on('child_added', function(requestSnapshot) {
    var request = requestSnapshot.val();
    sendNotificationToChannel(
      request.sessionId, 
      request.message,
      request.userImageUrl,
      function() {
        requestSnapshot.ref.remove();
      }
    );
  }, function(error) {
    console.error(error);
  });
};

function sendNotificationToChannel(sessionId, message, userImageUrl, onSuccess) {
  console.log("Notifying channel " + sessionId);
  var sessionSubscribers = ref.child("sessionSubscriptions/" + sessionId);

  sessionSubscribers.once('value', function(sessionSnapshot) {
    sessionSnapshot.forEach(function(childSnapshot) {
      if (childSnapshot.val() === true) {
        sendNotificationToUser(
          childSnapshot.key, 
          message,
          userImageUrl,
          onSuccess
        );
      }
    })
  })
}

function sendNotificationToUser(userId, message, userImageUrl, onSuccess) {
  console.log("Notifying user " + userId);
  var userRef = ref.child("users/" + userId + "/instanceIds");
  userRef.once('value', function(instanceIdSnapshot) {
    instanceIdSnapshot.forEach(function(childSnapshot) {
      sendNotificationToInstanceId(
        childSnapshot.val(), 
        message,
        userImageUrl,
        onSuccess
      );
    })
  })
}

function sendNotificationToInstanceId(instanceId, message, userImageUrl, onSuccess) { 
  console.log("Notifying instanceId " + instanceId);
  request({
    url: 'https://fcm.googleapis.com/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type' :' application/json',
      'Authorization': 'key='+API_KEY
    },
    body: JSON.stringify({
      notification: {
        title: message
      },
      to : instanceId.toString()
    })
  }, function(error, response, body) {
    if (error) { console.error(error); }
    else if (response.statusCode >= 400) { 
      console.error('HTTP Error: '+response.statusCode+' - '+response.statusMessage); 
    }
    else {
      onSuccess();
    }
  });
}

// start listening
listenForNotificationRequests();

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


/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || 8080);
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, function () {
  console.log('Example app listening on port ' + port)
});