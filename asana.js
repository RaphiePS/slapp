/*
	API: https://asana.com/developers/api-reference/users
	
	Implemented:

	GET /users <?opt_fields=name,email>
	GET /users/me
	GET /users/:user-id

	GET /workspaces
	GET /workspaces/:workspace-id/tasks

	POST /tasks
	GET /tasks
	GET /tasks/:task-id

	GET /projects
	GET /projects/:project-id/tasks

	POST /tags
	GET /tags
	GET /tags/:tag-id
	PUT /tags/:tag-id
	GET /tags/:tag-id/tasks
*/

/*jslint node: true, esnext: true */
"use strict";

var config = require("./config");
var Http = require("./http");
var Slapp = require("./index");
var slapp = new Slapp(config.token);
var http = new Http();

var instance;
var version = "https://app.asana.com/api/1.0/";
var asanaApi = {
	me: "users/me",
	users: "users"
};

var headers = {
	"User-Agent": "request",
	"Content-Type": "application/json",
	"Authorization": "Basic " + config.asanaKey
};
	
/*
	@params <string> e.g. name,email
*/
var resource = function(resource, params) {
	params = params ? "?opt_fields=" + params : "";
	return asanaApi[resource] ? [version, asanaApi[resource], params].join("") : "";
};

var Asana = slapp.register({
  state: {
    items: [],
    done: [],
    numberIcons: ["one", "two", "three", "four", "five", "six"],
    doneIcon: "ballot_box_with_check",
    incompleteIcon: "white_medium_square"
  },
  text: function() {
  	return "Slapp is listening";
  },
  buttons: function(state) {
    return state.numberIcons.slice(0, state.items.length);
  },
  click: function(e, state) {
    // use the default click handler instead of individually registering
    var index = state.numberIcons.indexOf(e.emoji);
    state.done[index] = !state.done[index];
  },
  command: function(m, cmd) {
	if (cmd === "me"){
		http.get({
			url: resource(cmd, "name, email"),
			headers: headers
		})
		.then(res => {
			var data = JSON.parse(res).data;
			console.log(data);

			var args = {
				channel: m.channel,
				text: ["Name: ", data.name, " Email: ", data.email].join(""),
				as_user: true
			};

			instance.slackApi("chat.postMessage", args);
		})
		.catch(err => {
			console.log(err);
		});
	}
  }
});

Asana.create({channel: "#testing-slapp"}).then((inst) => {
	// console.log("________________");
	// console.log(inst);
	// inst.save(inst.id);

	instance = inst;
});

slapp.on("raw_message", (m) => {
	if (m.type !== "message" ||
		!m.text ||
		m.text.indexOf("Slapp Asana: ") === -1 ) {
		return;
	}

	var cmd = m.text.split("Slapp Asana: ")[1];
	var args = {
		channel: m.channel,
		text: "Not a command",
		as_user: true
	};

	if (!asanaApi[cmd.toLowerCase()]) {
		instance.slackApi("chat.postMessage", args);
		return;
	}

	instance.command(m, cmd);
});


// var ar = [];
    // for (var i = 0; i < state.items.length; i++) {
    //   ar.push(":" + state.numberIcons[i] + ":");
    //   ar.push(" :");
    //   ar.push(state.done[i] ? state.doneIcon : state.incompleteIcon);
    //   ar.push(":\t");
    //   ar.push(state.items[i]);
    //   ar.push("\n");
    // }
    // return ar.join("");
