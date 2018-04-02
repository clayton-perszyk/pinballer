var restify = require('restify');
var builder = require('botbuilder');
var config = require('./config.js');
var where = require('node-where');
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
      builder.Prompts.choice(session, "How would you like to search for locations?",
                                      "Region|Current Location",
                                      { listStyle: 2});
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

    session.send("Loading...")

    pinballClient.getLocationsByCity(region)
      .then(function(response){
        const locations = response.data.locations.map(function(location) {return location.name});

        builder.Prompts.choice(session, `Here are locations for ${region}`, locations);
      })
      .catch(function(error){
        session.send(`No locations found for ${region}`);
        console.error(error);
      });

    session.endConversation();
  }
]);

bot.dialog('/currentLocation', [
  function (session) {
    builder.Prompts.text(session, 'Please enter your current location (address, city, or landmark).');
  },
  function (session, results) {
    const currLocation = results.response;
    const normalizedCurrLocation = currLocation.split(",").map(function(item){ return item.toLowerCase() }).join(" ");

    session.send("Loading...");

    where.is(normalizedCurrLocation, function(err, result) {
      let currLocationCoords = {};

      currLocationCoords.lat = result.get('lat');
      currLocationCoords.long = result.get('lng');

      pinballClient.getLocationsByCurrentLocation(currLocationCoords)
        .then(function(response){
          const locations = response.data.locations.map(function(location) {return location.name});

          builder.Prompts.choice(session, `Here are locations for ${currLocation}`, locations);
        })
        .catch(function(error){
          session.send(`No locations found for ${currLocation}`);
          console.error(error);
        });
    });
  }
]);

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.info('listening to %s', server.url);
});
