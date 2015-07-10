var Slapp = require("./index");

var slapp = new Slapp("your token");

// some errors are reported here some other places lol
slapp.on("error", function(e) {
  console.log("ERROR", e);
});

var generateText = function(x, y, height) {
  var strs = [];
  strs.push("|")
  for (var i = 0; i < y; i++) {
    strs.push("\n|");
  }
  for (var i = 0; i < x; i++) {
    strs.push("    ");
  }
  strs.push(":poop:");
  for (var i = 0; i < height - y - 1; i++) {
    strs.push("\n|");
  }
  return strs.join("");
}

// gives you ALL messages so be sure to filter!
slapp.on("slack_message", function(m) {
  if (!m.text || m.text.indexOf("poop game") === -1 ) return;
  var x = 0;
  var y = 0;
  var height = 7;

  var post = slapp.create({
    channel: m.channel,
    text: generateText(x, y, height)
  });

  post.on("created", function(id) {
    // once this is called, you can add buttons and modify the text
    post.setButtons([
      {emoji: "arrow_left"},
      {emoji: "arrow_right"},
      {emoji: "arrow_down"},
      {emoji: "arrow_up"}
    ]);
  });

  post.on("click", function(event) {
    switch (event.emoji) {
      case "arrow_left":
        x = Math.max(x - 1, 0);
        break;
      case "arrow_right":
        x++;
        break;
      case "arrow_up":
        y = Math.max(y - 1, 0);
        break;
      case "arrow_down":
        y = Math.min(y + 1, height - 1);
        break;
      default:
        break;
    }
    post.setText(generateText(x, y, height)); // async
  });
});
