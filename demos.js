var Slapp = require("./index");
var config = require("./index");

var slapp = new Slapp(config.token);
// some errors are reported here some other places lol
slapp.on("error", function(e) {
  console.log("ERROR", e);
});


// gives you ALL messages so be sure to filter!
slapp.on("slack_message", function(m) {
  if (m.text && m.text.indexOf("github") !== -1 ) {
    var post = slapp.create({
      channel: m.channel,
      title: "GitHub: Pull Request",
      text: "<http://google.com|Awesome Feature> by RaphiePS\nMerge 3 commits from `feature-branch` to `master`."
    });
    post.on("created", function(id) {
      post.setButtons([
        {emoji: "white_check_mark"},
        {emoji: "x"}
      ]);
    });
    post.on("click", function(event) {
      switch (event.emoji) {
        case "white_check_mark":
          post.setText("Awesome Feature *approved by RaphiePS*");
          break;
        case "x":
        post.setText("Awesome Feature *rejected by RaphiePS*");
          break;
        default:
          break;
      }
    });
    return;
  }
  if (m.text && m.text.indexOf("asana") !== -1 ) {
    var points = [1, 2, 3, 5, 8, 13];
    var index = 1;
    var post = slapp.create({
      channel: m.channel,
      title: "Asana Task",
      text: "[" + points[index] + "] Make slack awesome - assigned to `raphie`."
    });
    post.on("created", function(id) {
      post.setButtons([
        {emoji: "white_check_mark"},
        {emoji: "arrow_up"},
        {emoji: "arrow_down"}
      ]);
    });
    post.on("click", function(event) {
      switch (event.emoji) {
        case "white_check_mark":
          post._info.title = "Asana Task - Completed!"
          post.setText("[" + points[index] + "] Make slack awesome - assigned to `raphie`.");
          break;
        case "arrow_up":
          index = Math.min(index + 1, points.length - 1);
          post.setText("[" + points[index] + "] Make slack awesome - assigned to `raphie`.");
          break;
        case "arrow_down":
          index = Math.max(index - 1, 0);
          post.setText("[" + points[index] + "] Make slack awesome - assigned to `raphie`.");
          break;
        default:
          break;
      }
    });
    return;
  }
  if (m.text && m.text.indexOf("pagerduty") !== -1 ) {
    var post = slapp.create({
      channel: m.channel,
      title: "PagerDuty Alert",
      text: "All our servers are down!\n:raising_hand: Acknowledge\n:sunglasses: Resolve\n:scream: Escalate"
    });
    post.on("created", function(id) {
      post.setButtons([
        {emoji: "raising_hand"},
        {emoji: "sunglasses"},
        {emoji: "scream"}
      ]);
    });
    post.on("click", function() {
      // console.log("CLICKED PAGERDUTY");
      // post.setText("FOOBAZ");
      post.setText("All our servers are down!\n:raising_hand: Acknowledge\n:sunglasses: *Resolved by Raphie*\n:scream: Escalate");
    })
    return;
  }
  if (m.text && m.text.indexOf("checklist") !== -1 ) {
    var numbers = ["one", "two", "three", "four", "five", "six", "seven", "eight"];
    var text = ["Scan it", "Send it", "Fax", "Rename it"];
    var done = [false, false, false, false];
    var genText = function() {
      var ar = [];
      for (var i = 0; i < text.length; i++) {
        ar.push(":" + numbers[i] + ":");
        ar.push(" ");
        ar.push(done[i] ? ":ballot_box_with_check:" : ":white_medium_square:");
        ar.push("\t");
        ar.push(text[i]);
        ar.push("\n");
      }
      return ar.join("");
    }
    var post = slapp.create({
      channel: m.channel,
      // title: "Technologic",
      text: genText()
    });
    post.on("created", function() {
      post.setButtons(numbers.slice(0, text.length).map(function(n) {
        return {emoji: n};
      }));
    });
    post.on("click", function(e) {
      var index = numbers.indexOf(e.emoji);
      if (index === -1) return;
      done[index] = !done[index];
      post.setText(genText());
    })
    return;
  }
  //
  //
  // post.on("created", function(id) {
  //   // once this is called, you can add buttons and modify the text
  //   post.setButtons([
  //     {emoji: "arrow_left"},
  //     {emoji: "arrow_right"},
  //     {emoji: "arrow_down"},
  //     {emoji: "arrow_up"}
  //   ]);
  // });
  //
  // post.on("click", function(event) {
  //   switch (event.emoji) {
  //     case "arrow_left":
  //       x = Math.max(x - 1, 0);
  //       break;
  //     case "arrow_right":
  //       x++;
  //       break;
  //     case "arrow_up":
  //       y = Math.max(y - 1, 0);
  //       break;
  //     case "arrow_down":
  //       y = Math.min(y + 1, height - 1);
  //       break;
  //     default:
  //       break;
  //   }
  //   post.setText(generateText(x, y, height)); // async
  // });
});

slapp.on("slack_message", function(m) {
  console.log(m);
});
