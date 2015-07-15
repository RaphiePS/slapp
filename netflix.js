var Slapp = require("./index");
var config = require("./config"); // gitignored
var WebSocketServer = require("ws").Server

var slapp = new Slapp(config.token);


var Netflix = slapp.register({
  state: {
    numConnections: 0,
    currentStatus: null,
    connection: null
  },
  text: function(state) {
    if (state.numConnections === 0) {
      return "No Netflix currently connected!";
    }

    return JSON.stringify(state.currentStatus);
  },
  buttons: function(state) {
    return [];
  },
  click: function(e) {
  },
  handlers: {

  }
});

Netflix.create({
  channel: "#testing-slapp"
})
.then(function(netflix) {
  var wss = new WebSocketServer({port: 8080});
  wss.on("connection", function(ws) {
    if (netflix.state.numConnections === 0) {
      netflix.state.connection = ws;
    }
    netflix.state.numConnections++;
    netflix.update();
    ws.on("message", function(raw) {
      // ws.send(JSON.stringify({action: "pong"}));
      var m = JSON.parse(raw);
      netflix.state.currentStatus = m;
      netflix.update();
      // console.log(m);
      // if (m.loading) return;
      // counter++;
      // if (counter === 10) {
      //   ws.send(JSON.stringify({action: "toggle-play"}));
      //   counter = 0;
      // }
    });

    ws.on("close", function() {
      netflix.state.numConnections--;
      netflix.update();
    });
  });
})
.done();
