var Q = require("q");

class App {

  startListening() {
    this.listener = this.onMessage.bind(this);
    this.slapp.on(this.id, this.listener);
  }

  destroy() {
    this.slapp.removeListener(this.id, this.listener);
    return this.slackApi("chat.delete", this.message);
  }

  update() {
    return this.slackApi("chat.update", {
      channel: this.message.channel,
      ts: this.message.ts,
      text: this.text(this.state)
    });
  }

  onMessage(m) {
    var event = {
      emoji: m.reaction,
      userId: m.user,
      type: m.type
    }
    var execute = (fn) => {
      Q.when(fn.call(this, event, this.state))
      .then((res) => {
        if (res !== false) {
          this.update().done();
        }
      });
    };
    if (this.handlers[m.reaction]) {
      execute(this.handlers[m.reaction]);
    } else if (this.click) {
      execute(this.click);
    }
  }

  sequentialMap(arr, promiseFn) {
    return arr.reduce((soFar, a) => {
      return soFar.then(() =>  promiseFn(a));
    }, Q());
  }

  addButtons() {
    return this.sequentialMap(this.buttons(this.state), (emoji) => {
      return this.slackApi("reactions.add", {
        name: emoji,
        channel: this.message.channel,
        timestamp: this.message.ts
      }, ["already_reacted"]);
    });
  }

  onCreation(messaage) {
    this.message = messaage;
    this.id = this.slapp.toId(messaage);
    this.addButtons().done();
    this.startListening();
  }

  static create(args, state) {
    var instance = new this();
    instance.state = Object.assign({}, instance.state); // prototype hack
    if (state) {
      Object.assign(instance.state, state);
    }
    args = args || {}
    instance.slapp.validateField(args, "channel");
    args.text = instance.text(instance.state);
    args.unfurl_links = args.unfurl_links || false;
    args.as_user = true;
    return instance.slackApi("chat.postMessage", args)
    .then((res) => {
      instance.onCreation(res);
      return instance;
    });
  }

  static attach(args, state) {
    var instance = new this();
    instance.state = Object.assign({}, instance.state); // prototype hack
    if (state) {
      Object.assign(instance.state, state);
    }
    args = args || {}
    instance.slapp.validateField(args, "id");
    instance.onCreation(instance.slapp.fromId(args.id));
    instance.update();
    return Q.when(instance);
  }

}

module.exports = App;
