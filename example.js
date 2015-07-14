var Slapp = require("./index");

var slapp = new Slapp("xoxb-7595285936-2jWAHk7o2uZf133mY2caU82o"); // revoked lol

var SmileyGame = slapp.register({
  state: {
    x: 0,
    y: 0,
    height: 5,
    width: 5,
    icon: ":simple_smile:"
  },
  text: function(state) {
    // automatically re-rendered after each event
    var strs = [];
    strs.push("|")
    for (var i = 0; i < state.y; i++) {
      strs.push("\n|");
    }
    for (var i = 0; i < state.x; i++) {
      strs.push("    ");
    }
    strs.push(state.icon);
    for (var i = 0; i < state.height - state.y - 1; i++) {
      strs.push("\n|");
    }
    return strs.join("");
  },
  buttons: function(state) {
    return ["arrow_up", "arrow_down", "arrow_left", "arrow_right", "x"];
  },
  myCustomSetX: function(x) {
    this.state.x = Math.min(Math.max(x, 0), this.state.width - 1);
  },
  myCustomSetY: function(y) {
    this.state.y = Math.min(Math.max(y, 0), this.state.height - 1);
  },
  click: function(e) {
    // if no handler for the given emoji is in handlers, this is called instead
    // basically a "fallback" or default
    this.destroy(); // this destroys the message if we want
  },
  handlers: {
    // called instead of click if defined
    // text() is automatically called after this to update the message
    arrow_up: function(e, state) {
      this.myCustomSetY(state.y - 1);
      // if you return false it won't update
      // can also return a promise and it'll update once the promise resolves
      // can also manually call this.update() if you want to do something like...
        // state.loading = true;
        // this.update();
        // return someLongCall.then(function() {
        //   state.loading = false;
        // })
    },
    arrow_down: function(e, state) {
      this.myCustomSetY(state.y + 1);
    },
    arrow_left: function(e, state) {
      this.myCustomSetX(state.x - 1);
    },
    arrow_right: function(e, state) {
      this.myCustomSetX(state.x + 1);
    }
  }
});


// create a smiley game
SmileyGame.create({channel: "#testing-slapp"}).done();

// create a smiley game, overriding state
// SmileyGame.create({channel: "#testing-slapp"}, {icon: ":poop:"})
// .then(function(game) {
//   storeInADatabase(game.id);
// });

// re-attach to a previously-created post if your bot restarts
// SmileyGame.attach({id: getIdFromDatabase()});


var Checklist = slapp.register({
  state: {
    items: ["Make audio game", "Build Asana integration", "PagerDuty!"],
    done: [false, false, false],
    numberIcons: ["one", "two", "three", "four", "five", "six"],
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
