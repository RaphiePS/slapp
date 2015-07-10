// TODO CONVERT NON-OK TO ERROR
// TODO ADD A WAY TO ATTACH TO AN EXISTING POST
// TODO ADD A WAY TO DELETE A POST


var Slack = require("slack-node");
var WebSocketClient = require("websocket").client;
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var Q = require("q");


var sequentialMap = function(arr, promiseify) {
    return arr.reduce(function (soFar, a) {
        return soFar.then(function() {
            return promiseify(a);
        });
    }, Q());
};

var Post = function(slack, slapp) {
  this.slack = slack;
  this.slapp = slapp;
  this._info = null;
};
util.inherits(Post, EventEmitter);

Post.prototype._dispatch = function(m) {
  if (!this._info) return;
  if (this._info.user === m.user) return;
  this.emit("click", {
    user_id: m.user,
    user_name: "TODOTODO",
    emoji: m.reaction,
    action: m.type === "reaction_removed" ? "remove" : "add"
  });
};

Post.prototype._created = function(id) {
  this.emit("created", id);
};

Post.prototype.setText = function(text, cb) {
  var that = this;
  cb = cb || function() {};

  if (!this._info) {
    throw new Error("must get 'created' event before setting text!")
  }

  this.slack.api("chat.update", {
    channel: that._info.channel,
    ts: that._info.ts,
    text: text
  }, function(err, res) {
    cb(err);
  });
};

Post.prototype.setButtons = function(buttons, cb) {
  var that = this;
  cb = cb || function() {};

  if (!this._info) {
    throw new Error("must get 'created' event before setting buttons!")
  }
  // TODO GET A FULL LIST
  // TODO ERROR HANDLING
  return sequentialMap(buttons, function(b) {
    if (!b.emoji) {
      throw new Error("Each button must have an 'emoji' property'")
    }
    return Q.Promise(function(resolve, reject) {
      that.slack.api("reactions.add", {
        name: b.emoji,
        channel: that._info.channel,
        timestamp: that._info.ts
      }, function(err, res) {
        if (err) return reject(err);
        resolve();
      });
    });
  })
  .then(function() {
    cb(null);
  })
  .catch(function(e) {
    cb(e);
  });
};

var Slapp = function(key) {
  var that = this;

  this._posts = {}

  this.slack = new Slack(key);

  this.ws = new WebSocketClient();
  this.ws.on("connectFailed", function(error) {
    that.emit("error", error);
  });
  this.ws.on("connect", function(connection) {
    connection.on("error", function(error) {
      that.emit("error", error);
    })
    connection.on("message", function(raw) {
      that._handleSlackMessage(JSON.parse(raw.utf8Data));
    });
  });

  this.slack.api("rtm.start", function(error, res) {
    if (error) {
      return that.emit("error", error);
    }
    that.ws.connect(res.url);
  });
};
util.inherits(Slapp, EventEmitter);

Slapp.toId = function(info) {
  return info.channel + " " + info.ts;
};

Slapp.fromId = function(id) {
  var split = id.split(" ");
  return {
    channel: split[0],
    ts: split[1]
  };
};

Slapp.prototype._handleSlackMessage = function(m) {
  this.emit("slack_message", m);
  if (m.type !== "reaction_removed" && m.type !== "reaction_added") return;
  if (!m.item) return;
  if (m.item.type !== "message") return;
  var id = Slapp.toId(m.item);
  if (!(id in this._posts)) return;
  this._posts[id]._dispatch(m);
};

Slapp.prototype.create = function(info) {
  var that = this;
  if (!info.channel) {
    throw new Error("you must specify a channel when creating");
  }
  var channel = info.channel;
  var text = info.text || "SET ME WITH setText()";
  var post = new Post(this.slack, this);
  this.slack.api("chat.postMessage", {
    channel: channel,
    text: text,
    as_user: true
  }, function(error, res) {
    if (error) {
      return that.emit("error", error);
    }
    var info = {
      channel: res.channel,
      ts: res.message.ts,
      user: res.message.user
    };
    var id = Slapp.toId(info);
    that._posts[id] = post;
    post._info = info;
    post._created(id);
  });
  return post;
}

module.exports = Slapp;
