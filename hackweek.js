var Slapp = require("./index");
var config = require("./config"); // gitignored
var slapp = new Slapp(config.token);
var Q = require("q");
var WebSocketServer = require("ws").Server
var channel = "#" + process.argv[2];
console.log("USING CHANNEL", channel);

var TicTacToe = slapp.register({
  state: {
    turn: "X",
    winner: false,
    board: new Array(9).map(function() { return false }),
    numbers: [
      "one", "two", "three",
      "four", "five", "six",
      "seven", "eight", "nine"
    ],
    xEmoji: ":x:",
    oEmoji: ":o:",
    emptyEmoji: ":white_large_square:",
    xUser: null,
    oUser: null
  },
  emojiForSquare: function(square) {
    switch(square) {
      case "X":
        return this.state.xEmoji;
      case "O":
        return this.state.oEmoji;
      default:
        return this.state.emptyEmoji;
    }
  },
  checkWinner: function() {
    var xWinner = 3;
    var oWinner = -3;
    var points = this.state.board.map(function(square) {
      if (square) {
        return square === "X" ? 1 : -1;
      } else {
        return 0;
      }
    });
    for (var y = 0; y < 3; y++) {
      var rowSum = 0;
      for (var x = 0; x < 3; x++) {
        rowSum += points[y*3 + x];
      }
      if (rowSum === xWinner) return "X";
      if (rowSum === oWinner) return "O";
    }

    for (var x = 0; x < 3; x++) {
      var colSum = 0;
      for (var y = 0; y < 3; y++) {
        colSum += points[y*3 + x];
      }
      if (colSum === xWinner) return "X";
      if (colSum === oWinner) return "O";
    }

    var upDiag = points[6] + points[4] + points[2];
    if (upDiag === xWinner) return "X";
    if (upDiag === oWinner) return "O";

    var downDiag = points[0] + points[4] + points[8];
    if (downDiag === xWinner) return "X";
    if (downDiag === oWinner) return "O";

    var allNonzero = true
    for (var i = 0; i < points.length; i++) {
      if (!points[i]) {
        allNonzero = false;
        break;
      }
    }

    return allNonzero ? "cat" : false;
  },
  text: function(state) {
    if (state.winner) {
      if (state.winner === "cat") {
        var detailStr = "\t*:cat2: 's game!*"
      } else {
        var detailStr = "\t*" + state.winner + " won!*";
      }
    } else {
      var detailStr = "\t*It's " + state.turn + "'s turn!*"
    }
    var strs = [];

    if (state.xUser) {
      strs.push("X: " + state.xUser.profile.first_name);
    }
    if (state.oUser) {
      strs.push(", O: " + state.oUser.profile.first_name);
    }
    strs.push("\n");

    for (var y = 0; y < 3; y++) {
      for (var x = 0; x < 3; x++) {
        var square = state.board[y*3 + x];
        strs.push(this.emojiForSquare(square));
      }
      strs.push("\t");
      for (var x = 0; x < 3; x++) {
        strs.push(":" + state.numbers[y*3 + x] + ":");
      }
      if (y === 1) {
        strs.push(detailStr);
      }
      strs.push("\n");
    }
    if (state.winner) {
      strs.push("Press any button for a new game.");
    }
    return strs.join("");
  },
  buttons: function(state) {
    return state.numbers;
  },
  setUsers: function(e) {
    var state = this.state;
    if (state.turn === "X") {
      if (state.xUser) return Q();
      return e.userInfo.then(function(info) {
        state.xUser = info;
      });
    } else {
      if (state.oUser) return Q();
      return e.userInfo.then(function(info) {
        state.oUser = info;
      });
    }
  },
  click: function(e, state) { //e
    if (state.winner) {
      state.winner = false;
      state.board = new Array(9).map(function() { return false })
      state.turn = "X";
      state.xUser = null;
      state.oUser = null;
      return;
    }
    var index = state.numbers.indexOf(e.emoji);
    if (index === -1) return;
    if (state.board[index]) return;
    var that = this;
    return this.setUsers(e).then(function() {
      state.board[index] = state.turn;
      state.turn = state.turn === "X" ? "O" : "X";
      state.winner = that.checkWinner();
    })
  }
});

var scmp3 = require('soundcloud-mp3');

var fs = require('fs');

var http = require('http');
var fs = require('fs');

var http = require('http-request');

var Player = require('player');


//helper function that downloads files
var download = function(url, dest) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
  });
};

var playa = null;

/*
     SLAPP TUNES
    Download your favorite youtube or soundcloud tunes from your favorite Slack Channel and play them back
*/
var SlappTunes = slapp.register({
  state: {
    dl: false,
    playing: false,
    source: "", //YouTube or SoundCloud
    currentSong: "",
    link:"", //the youtube or soundcloud link
    posts: [],
    player: null
  },
  text: function(state) {
    // automatically re-rendered after each event
    return "";
  },
  buttons: function(state) {
    return ["arrow_down", "metal", "mute", "fast_forward"];
  },
  myCustomSetX: function(x) {
  },
  myCustomSetY: function(y) {
  },
  click: function(e) {
    // if no handler for the given emoji is in handlers, this is called instead
    // basically a "fallback" or default
    this.destroy(); // this destroys the message if we want
  },
  handlers: {
    // called instead of click if defined
    // text() is automatically called after this to update the message
    arrow_down: function(e, state) {
      //handler for downloading songs

      if (state.source == "SoundCloud") {
      	//soundcloud dl
      	var n = state.link.lastIndexOf('/');
	    var sc_song = state.link.substring(n + 1);
        scmp3(state.link, function (err, res) {
          //state.currentSong = res;

          var options = {url: res};
          http.get(options, sc_song+'.mp3', function (error, result) {
	        if (error) {
		      console.error(error);
		    } else {
		      console.log('File downloaded at: ' + result.file);
		      if (playa == null) {
            console.log("NEW");
		      	playa = new Player('./'+sc_song+'.mp3');
		      	playa.on('error', function(err){
				          // when error occurs
				    console.log(err);
				    });
		      }
		      else {
            console.log("ADDED");
		        playa.add('./'+sc_song+'.mp3');
		      }
		    }
          });
        })


      }


    },
    metal: function(e, state) {
      //handler for playing a locally downloaded playlist
      if (playa != null) {
      	playa.play(function(err, player){
	      console.log('playend!');
	  	});
      }
    },
    mute: function(e, state) {
      //handler for stopping the playlist
	  if (playa != null) {
	  	state.playing = false;
	    playa.stop();
	  }
    },
    fast_forward: function(e, state) {
   	  //TODO: Issue with this
      if (playa != null) {
        playa.next();
      }
    }
  }
});

var Checklist = slapp.register({ // jshint ignore:line
  state: {
    items: ["Make audio game", "Build Asana integration", "PagerDuty!"],
    done: [false, false, false],
    numberIcons: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
    doneIcon: "ballot_box_with_check",
    incompleteIcon: "white_medium_square"
  },
  text: function(state) {
    var ar = [];
    for (var i = 0; i < state.items.length; i++) {
      ar.push(":" + state.numberIcons[i] + ":");
      ar.push(" :");
      ar.push(state.done[i] ? state.doneIcon : state.incompleteIcon);
      ar.push(":\t");
      ar.push(state.items[i]);
      ar.push("\n");
    }
    return ar.join("");
  },
  buttons: function(state) {
    return state.numberIcons.slice(0, state.items.length);
  },
  click: function(e, state) {
    // use the default click handler instead of individually registering
    var index = state.numberIcons.indexOf(e.emoji);
    state.done[index] = !state.done[index];
  }
});

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

var wss = new WebSocketServer({port: 8080});

var netflix = null;

wss.on("connection", function(ws) {
  ws.on("message", function(raw) {
    // ws.send(JSON.stringify({action: "pong"}));
    if (!netflix) return;
    var m = JSON.parse(raw);
    netflix.state.connection = ws;
    netflix.state.numConnections = 1;
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
    if (!netflix) return;
    netflix.state.numConnections = 0;
    netflix.update();
  });
});

var createNetflix = function() {
  Netflix.create({
    channel: channel
  })
  .then(function(netflix_) {
    netflix = netflix_;
  })
  .done();
}


slapp.on("raw_message", function(m) {
  if (m.type !== "message" || !m.text) return;
  console.log(m);
  var match = function(text) {
    if (m.text.indexOf(text) !== -1) {
      return m.text.replace(text, "");
    } else {
      return false;
    }
  }

  if (match("slapp tictactoe") !== false) {
    TicTacToe.create({channel: channel}).done();
    return;
  }

  if (match("slapp netflix") !== false) {
    createNetflix();
    return;
  }

  if (match("slapp checklist ") !== false) {
    var items = match("slapp checklist ").split(", ");
    Checklist.create({channel: channel}, {
      items: items,
      done: items.map(function() { return false })
    }).done();
    return;
  }

  if (match("slapp musicify") !== false) {
    var lookup = {};
    var music_id;
    channels = slapp.slackApi("channels.list")
      //first lookup a list of all channels and get the id of the music channel
      .then(function(o){
        var channels = o.channels;
        for (var i = 0, len = channels.length; i < len; i++) {
          lookup[channels[i].name] = channels[i];
        }
        var music = lookup[channel.replace("#", "")]; //change this to scrape a different channel
        return music["id"];
      })
      //get the history of all messages in the channel
      .then(function(id){
      	console.log(id);
      	slapp.slackApi("channels.history", {channel: id, count: 300})
      	  .then(function(hist){
      	  	var messages = hist["messages"];

      	  	//filter out messages with youtube/soundcloud links and bind to them
      	  	for (var i = 0, len = messages.length; i < len; i++) {
      	  	  raw_text = messages[i]["text"];
      	  	  attachment = messages[i]["attachments"];
      	  	  ts = messages[i]["ts"];
      	  	  if (!(typeof attachment === 'undefined')){
      	  	  	if (attachment[0]["service_name"]=="SoundCloud" /*|| attachment[0]["service_name"]=="YouTube" ||*/) {
      	  	  	  var music_link = attachment[0]["title_link"];
      	  	  	  var slapp_id = slapp.toId({channel: id, ts: ts});
      	  	  	  SlappTunes.attach({id: slapp_id}, {source: attachment[0]["service_name"], link: music_link});
      	  	  	}
      	  	  }
      	  	}
      	  })
      });
    return;
  }
})
