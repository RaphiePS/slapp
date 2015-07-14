var WebSocket = require("ws");
var Slack = require("slack-node");
var Q = require("q");
var App = require("./App");
var EventEmitter = require("events").EventEmitter;

class Slapp extends EventEmitter {
  constructor(token) {
    super();
    this.slack = new Slack(token);
    this.startConnection();
  }

  startConnection() {
    this.slackApi("rtm.start").then((res) => {
      this.selfId = res.self.id;
      this.ws = new WebSocket(res.url);
      this.ws.on("message", this.onMessage.bind(this));
      this.ws.on("error", this.onError.bind(this));
      this.ws.on("close", this.onClose.bind(this));
    })
    .done();
  }

  toId(info) {
    return info.channel + " " + info.ts;
  }

  fromId(id) {
    var split = id.split(" ");
    return {
      channel: split[0],
      ts: split[1]
    };
  }

  onMessage(raw) {
    var m = JSON.parse(raw);
    this.emit("raw_message", m);
    if (m.type !== "reaction_added" && m.type !== "reaction_removed") return;
    if (!m.item || m.item.type !== "message") return;
    if (m.user === this.selfId) return;
    this.emit(this.toId(m.item), m);
  }

  onError(e) {
    throw e;
  }

  onClose() {
    throw new Error("Websocket connection to slack closed. TODO reconnection");
  }

  slackApi(method, args, okErrors) {
    okErrors = okErrors || [];
    return Q.ninvoke(this.slack, "api", method, args).then((res) => {
      if (res.ok || okErrors.indexOf(res.error) !== -1) {
        return res;
      } else {
        throw new Error(res.error);
      }
    });
  }

  validateField(obj, field) {
    if (!(field in obj)) {
      throw new Error(`field ${field} is required!`);
    }
  }

  register(appInfo) {
    this.validateField(appInfo, "text");
    this.validateField(appInfo, "buttons");
    class AppClass extends App {}
    for (var key in appInfo) {
      AppClass.prototype[key] = appInfo[key];
    }
    AppClass.prototype.state = Object.assign({}, appInfo.state);
    AppClass.prototype.handlers = appInfo.handlers || {};
    AppClass.prototype.slackApi = this.slackApi.bind(this);
    AppClass.prototype.slapp = this;
    return AppClass;
  }
}

module.exports = Slapp;
