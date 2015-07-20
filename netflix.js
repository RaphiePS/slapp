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
    if (state.numConnections === 0 || !state.currentStatus) {
      return "No Netflix currently connected!";
    }

    var s = state.currentStatus;

    if (s.loading) {
      return "Loading...";
    }

    var ar = [];
    ar.push("*Show*: ");
    ar.push(s.showName)
    ar.push("\n");
    ar.push("*Episode*: ");
    ar.push(s.episodeNum + " - " + s.episodeName);
    ar.push("\n");
    ar.push("*Time Remaining*: ");
    ar.push(s.timeRemaining);

    return ar.join("");
  },
  buttons: function(state) {
    return ["arrow_forward", "no_good", "fast_forward"];
  },
  click: function(e) {

  },
  send: function(action) {
    this.state.connection.send(JSON.stringify({action: action}));
  },
  handlers: {
    arrow_forward: function() {
      this.send("play");
    },
    no_good: function() {
      this.send("pause");
    },
    fast_forward: function() {
      this.send("next");
    }
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
