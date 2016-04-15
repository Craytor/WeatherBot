var fs = require('fs');
var https = require('https');

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();


var credentials = {
    ca: fs.readFileSync("keys/cert_bundle.ca-bundle"),
    key: fs.readFileSync("keys/botwxalerter.key"),
    cert: fs.readFileSync("keys/bot_wxalerter_com.crt")
};


// You MUST change these values, consult the Messenger Platform Getting Started guide
var verify_token = '358fada66e4f38d09e71e34ffb49c68dc869a0b5';
var token = "EAAQfjguZAxOYBACxlkL8RhnoihwuHYu1JiPlXe8ddqdCOMd9gH4A4UovYiMdjC6odtIm6XphZCwFm9EghTLmwMQWzRWTnWaZB3uYaXiJH3QXpC6Kj7MMvcK30t4GtZCl3ZC96u75FDBAPEIUdsyPNQIZAYques2dL2kApO17VkZCwZDZD";


app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello World! This is the bot\'s root endpoint!');
});

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === verify_token) {
        res.send(req.query['hub.challenge']);
    }

    res.send('Error, wrong validation token');
});

app.post('/webhook/', function (req, res) {
    var messaging_events = req.body.entry[0].messaging;
    for (var i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i];
        if (event.message && event.message.text) {
            //          senderid, message
            // console.log(event.message.text);
            determineText(event.sender.id, event.message.text);
        }
        
        if (event.postback) {
            postback = JSON.parse(JSON.parse(JSON.stringify(event.postback.payload)));

            if(postback.type == "alertDetails") {
                sendTextMessage(event.sender.id, "Postback received: " + postback.id, token);
                continue;
            } else {
                text = JSON.stringify(event.postback);
                sendTextMessage(event.sender.id, "Postback received: " + text.substring(0, 200), token);
                continue;
            }
        }
    }
    res.sendStatus(200);
});

var server = https.createServer(credentials, app);

server.listen(3000, function () {
    console.log('Facebook Messenger echoing bot started on port 3000!');
});

function sendTextMessage(sender, text) {
    var messageData = {
        text: text
    };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, function (error, response) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function sendGenericMessage(sender) {
  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Severe Thunderstorm Warning",
          "subtitle": "Smith – MS",
          "image_url": "https://pbs.twimg.com/media/CgBzvvLWsAQiHpZ.jpg",
          "buttons": [{
            "type": "web_url",
            "url": "https://alerts.myweather.today/alert/a66d89c75d14a2a0d7af10363230f214b0107168",
            "title": "Severe Thunderstorm Warning: Smith – MS"
          }, {
            "type": "postback",
            "title": "Alert Details",
            "payload": JSON.stringify({
                "type": "alertDetails",
                "id": "a66d89c75d14a2a0d7af10363230f214b0107168",
            })
          }],
        },{
          "title": "Tornado Warning",
          "subtitle": "Assumption, Lafourche, St. James – LA",
          "image_url": "https://pbs.twimg.com/media/Cf6suZaW8AAii7b.jpg",
          "buttons": [{
              "type": "web_url",
              "url": "https://alerts.myweather.today/alert/202d45c886ac26701711ab7af94f6d61f57bf73d",
              "title": "Tornado Warning: Assumption, Lafourche, St. James – LA"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  };
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}




// deciper users message
function determineText(senderId, messageText) {
    if(messageText.toLowerCase().indexOf("help") > -1) {
        
        sendCommandList(senderId);
        
    } else if(messageText.toLowerCase().indexOf("status") > -1) {
        
        sendStatus(senderId);
        
    } else if(messageText.toLowerCase() == "locations") {
        // sendTextMessage(senderId, "Comming soon.");
        listLocations(senderId);
        
    } else if(messageText.toLowerCase() == "generic") {
        
        sendGenericMessage(senderId);
        
    } else {
        
        sendTextMessage(senderId, "Hmmm, I didn't understand your request. Please try again.");
    }
    
}

function sendCommandList(senderId) {
    // var commands = [
    //     'Here are a list of commands/keywords you may use:',
    //     'help - lists all commands available',
    //     'status - denotes if you are currnetly recieving alerts',
    //     'locations - lists locations you are recieving alerts for',
    //     'locations add [zip] - adds selected zipcode from your alerts',
    //     'locations remove [zip] - removes selected zipcode from your alerts'
    // ];
        
    sendTextMessage(senderId, "Here are a list of commands/keywords you may use:");
    sendTextMessage(senderId, "help - lists all commands available");
    sendTextMessage(senderId, "status - denotes if you are currnetly recieving alerts");
    sendTextMessage(senderId, "locations - lists locations you are recieving alerts for");
    sendTextMessage(senderId, "locations add [zip] - adds selected zipcode from your alerts");
    sendTextMessage(senderId, "locations remove [zip] - removes selected zipcode from your alerts");
}

function sendStatus(senderId) {
    sendTextMessage(senderId, "You are currently not subscribed to any alerts. Type 'subscribe' to get started!");
}

function listLocations(senderId) {
    var zipCodeArr = ["16423","16511","16513","16411","16417"];
    
    myZipString = "";
    
    for(i=0; i<zipCodeArr.length; i++) {
        if(i === 0) {
            myZipString += zipCodeArr[i];
            continue;
        }
        myZipString += ", " + zipCodeArr[i];
    }
    
    sendTextMessage(senderId, "The locations you are currently recieving alerts for are: " + myZipString + ".");
    
}




