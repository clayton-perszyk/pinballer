var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var config = require('./config.js');
var pinballClient = require('./pinballMapClient.js');
var server = restify.createServer();

var connector = new builder.ChatConnector({
    appId: config.appId,
    appPassword: config.appPassword
});
var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

bot.dialog('/', [
    function (session) {
      session.send('Welcome To Pinballer 📍 🎱');
      session.send('Your personal pinball location finder.');
      // builder.Prompts.choice(session, "How would you like to search for locations?",
      //                                 "City|Current Location",
      //                                 { listStyle: 2});
      builder.Prompts.choice(session, 'Choose a demo', ["Region", "Current Location"]);
    },
    function (session, results) {
      if (results.response.entity.toLowerCase() === 'region') {
        session.beginDialog('/region');
      } else if (results.response.entity.toLowerCase() === 'current location') {
        session.beginDialog('/currentLocation');
      }
    }
]);

bot.dialog('/region', [
  function (session) {
    builder.Prompts.text(session, 'Please enter the name of the region where you want to play.');
  },
  function (session, results) {
    const region = results.response;

    session.send("Loading... this could take a while.")

    pinballClient.getLocationsByCity(region)
      .then(function(response){
        const locations = response.data.locations.map(function(location) {return location.name});

        builder.Prompts.choice(session, `Here are locations for ${region}`, locations);
      })
      .catch(function(error){
        session.send(`No locations found for ${region}`);
        console.error(error);
      });
  }
]);

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('listening to %s', server.url);
});
