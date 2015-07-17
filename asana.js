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
var headers = {
	"User-Agent": "request",
	"Content-Type": "application/json",
	"Authorization": "Basic " + config.asanaKey
};
var version = "https://app.asana.com/api/1.0/";
var asanaApi = {
	me: "users/me",
	users: "users",
	user: "users/",
	workspaces: "workspaces",
	tasks: "tasks",
	// subTasks: "tasks/{task-id}/subtasks"
};

const LIMIT = 20;
const CMD_TRIGGER = "Asanabot: ";

var cache = {};


	
var resource = function(resource, params) {
	return asanaApi[resource] ? [version, asanaApi[resource], params].join("") : "";
};

// FUGLY STUFF GOTTA CLEAN
var stringBuilder = function(data) {
	if (Array.isArray(data)) {
		return data.map(item => stringBuilder(item).join(""));
	}

	return Object.keys(data).map(val => {
		var dv = data[val];

		if (Array.isArray(dv)) {
			dv = dv.map(item => "\n\t" + stringBuilder(item).join("\t")).join("");
		}

		return dv === null ? "" : ["*", val, ":* ", dv, "\n"].join("");
	});
};

/*var paramsCmdHelper = function(p) {
	if (!p || typeof parseInt(p, 10) !== "number" || p !== "me") {
		return;
	}

	return p;
};*/

var cmdSwitch = function (m) {
	var args = {};
	var cmdArray = m.text.replace(CMD_TRIGGER, "").split(" ");
	var params = cmdArray.length ? cmdArray : "";

	args.cmd = cmdArray.shift().toLowerCase();

	console.log("Cmd ------------------");
	console.log(args.cmd, params);
	console.log("/Cmd ------------------");

	// params.map((p) => paramsCmdHelper);

	switch (args.cmd) {
		case "me":
			args.params = "?opt_fields=name,email";
			args.cacheKey = args.cmd + args.params;
			break;
		case "users":
			args.params = "?opt_fields=name,email"; //&limit=" + LIMIT;
			args.cacheKey = args.cmd + args.params;
			break;
		case "user":
			args.params = params[0];
			args.cacheKey = args.cmd + args.params;
			break;
		case "workspaces":
			args.cacheKey = args.cmd;
			break;
		case "tasks": 
			// requires workspace id and assignee id
			args.params = ["?workspace=", params[0],"&assignee=", params[1]].join("");
			args.cacheKey = args.cmd;
			break;

		default:
			return new Promise((resolve) => {
				resolve("Not a Known Command");
			});
	}

	return fetchInfo(args);
};

var fetchInfo = function (args) {
	return new Promise((resolve, reject) => {
		if (cache[args.cacheKey]) {
			console.log("Cache: _______________\n");
			return resolve(cache[args.cacheKey]);
		}

		// Fetch from Asana
		http.get({
			url: resource(args.cmd, args.params),
			headers: headers
		})
		.then(res => {
			// console.log(JSON.parse(res));
			// cache response
			cache[args.cacheKey] = JSON.parse(res).data;
			return resolve(cache[args.cacheKey]);
		})
		.catch(err => {
			console.log(err);
			reject(err);
		});
	});
};

slapp.register({
  state: {
    items: [],
    done: [],
    numberIcons: ["one", "two", "three", "four", "five", "six"],
    doneIcon: "ballot_box_with_check",
    incompleteIcon: "white_medium_square"
  },
  text: function() {
  	return "Power up!";
  },
  buttons: function(state) {
    return state.numberIcons.slice(0, state.items.length);
  },
  click: function(e, state) {
    // use the default click handler instead of individually registering
    var index = state.numberIcons.indexOf(e.emoji);
    state.done[index] = !state.done[index];
  },
  command: (m) => {
  		var args = {
  			username: "Asanabot",
			channel: m.channel,
			markdown: true,
			// icon_url: "https://chartbeat.com/favicon.ico"
			icon_emoji: ":koala:"
		};

		cmdSwitch(m).then((data) => {
			if (typeof data === "string") {
				return [data];
			}

			return stringBuilder(data);
		})
		.then((formattedData) => {
			console.log(formattedData);

			//  don't push all users to Slack
			if (formattedData.length >= LIMIT){
				formattedData = ["*_Too Large to render on Slack_*"];
			} 

			args.text = formattedData.join("");
			instance.slackApi("chat.postMessage", args);
		});
	}
})
.create({
	channel: "#testing-slapp",
	username: "Asanabot",
	// icon_url: "https://chartbeat.com/favicon.ico"
	icon_emoji: ":koala:"
})
.then((inst) => {
	instance = inst;
});

slapp.on("raw_message", (m) => {
	if (m.type !== "message" ||
		!m.text ||
		m.text.indexOf(CMD_TRIGGER) === -1) {
		return;
	}

	instance.command(m);
});


// Tests
var timer = setTimeout(() => {
	// var cmd = instance.command;

	// cmdSwitch({channel: "#testing-slapp", text: "Asana: user 40357631998916"}).then(data => {
	// 	console.log(data);
	// });

	// cmd({channel: "#testing-slapp", text: "Asana: test"});
	// cmd({channel: "#testing-slapp", text: "Asana: user me"});
	
	// cmd({channel: "#testing-slapp", text: "Asana: user 40357631998916"}); // alex
	// cmd({channel: "#testing-slapp", text: "Asana: user 40357631998928"}); // albert
	
	// cmd({channel: "#testing-slapp", text: "Asana: workspaces"});
	// cmdSwitch({channel: "#testing-slapp", text: "Asana: tasks 730375869140 40357631998916"}).then(data => {
	// 	console.log(data);
	// });

	// cmdSwitch just fetches data on command
	// not publishing to Slack 
	// cmdSwitch({channel: "#testing-slapp", text: "Asana: users"}).then(data => {
	// 	console.log(data);
	// });

	clearTimeout(timer);
}, 1000);

// var timer2 = setTimeout(() => {
// 	var cmd = instance.command;
// 	cmd({channel: "#testing-slapp", text: "Asana: me"});
// 	clearTimeout(timer2);
// }, 10000);


