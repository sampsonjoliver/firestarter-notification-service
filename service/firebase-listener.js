var firebase = require('firebase-admin');
var request = require('request');

var API_KEY = ""; // Your Firebase Cloud Messaging Server API key
var serviceAccFileDir = "" // Path to your service account file

// Fetch the service account key JSON file contents
var serviceAccount = require(serviceAccFileDir);

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount), // should be able to use admin.credential.applicationDefault(), on GCP
  databaseURL: "https://firestarter-3c2a7.firebaseio.com"
});
ref = firebase.database().ref();

const listenForNotificationRequests = function() {
  console.log("Listening for changes on /notificationRequests");

  var requests = ref.child('notificationRequests');
  requests.on('child_added', function(requestSnapshot) {
    var request = requestSnapshot.val();
    if (request.sessionId == null || request.sessionId.length == 0) {
      return
    }

    sendNotificationToChannel(
      request.sessionId, 
      request,
      function() {
        requestSnapshot.ref.remove();
      }
    );
  }, function(error) {
    console.error(error);
  });
};

const sendNotificationToChannel = function(sessionId, message, onSuccess) {
  console.log("Notifying channel " + sessionId);
  var sessionSubscribers = ref.child("sessionSubscriptions/" + sessionId);

  sessionSubscribers.once('value', function(sessionSnapshot) {
    sessionSnapshot.forEach(function(childSnapshot) {
      if (childSnapshot.val() === true) {
        sendNotificationToUser(
          childSnapshot.key, 
          message,
          onSuccess
        );
      }
    })
  })
}

const sendNotificationToUser = function(userId, message, onSuccess) {
  console.log("Notifying user " + userId);
  var userRef = ref.child("users/" + userId + "/instanceIds");
  userRef.once('value', function(instanceIdSnapshot) {
    instanceIdSnapshot.forEach(function(childSnapshot) {
      if (childSnapshot.val() === true) {
        sendNotificationToInstanceId(
          childSnapshot.key, 
          message,
          onSuccess
        );
      }
    })
  })
}

const sendNotificationToInstanceId = function(instanceId, message, onSuccess) { 
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
        title: message.title,
        body: message.message,
        icon: message.userImageUrl
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

const FirebaseListener = {
    dbRef: ref,
    listenForNotificationRequests: listenForNotificationRequests
}

module.exports = FirebaseListener