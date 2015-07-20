var Slapp = require("./index");

var slapp = new Slapp("your channel"); // revoked lol

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
		      if (state.player == null) {
		      	state.player = new Player('./'+sc_song+'.mp3');
		      	state.player.on('error', function(err){
				  // when error occurs
				  console.log(err);
				});
		      }
		      else {
		        state.player.add('./'+sc_song+'.mp3');
		      }
		    }
          });
        })

        
      }

     
    },
    metal: function(e, state) {
      //handler for playing a locally downloaded playlist
      if (state.player != null) {
      	state.player.play(function(err, player){
	      console.log('playend!');
	  	});
      }
    },
    mute: function(e, state) {
      //handler for stopping the playlist  
	  if (state.player != null) {
	  	state.playing = false;
	    state.player.stop();
	  }
    },
    fast_forward: function(e, state) {
   	  //TODO: Issue with this
      if (state.player != null) {
        state.player.next();
      }
    }
  }
});


/*
  Create SlappTunes

  npm install
  node slapptunes.js
*/

//SlappTunes.create({channel: "#testing-slapp"}).done();
var lookup = {};
var music_id;
channels = slapp.slackApi("channels.list")
  //first lookup a list of all channels and get the id of the music channel
  .then(function(o){
    var channels = o.channels;
    for (var i = 0, len = channels.length; i < len; i++) {
      lookup[channels[i].name] = channels[i];
    }
    var music = lookup["music"]; //change this to scrape a different channel
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