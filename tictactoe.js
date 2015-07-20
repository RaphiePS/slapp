var Slapp = require("./index");
var config = require("./config"); // gitignored
var slapp = new Slapp(config.token);
var Q = require("q");

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

var log = function(info) {
  console.log({channel: info.message.channel, id: info.id});
}

// TicTacToe.create({channel: "#testing-slapp"}).done();
TicTacToe.create({channel: "intern-squad"}).then(log). done();
