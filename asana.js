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
	tasks: "tasks"
};

const LIMIT = 20;
const CMD_TRIGGER = "Asana: ";

var cache = {};


	
var resource = function(resource, params) {
	return asanaApi[resource] ? [version, asanaApi[resource], params].join("") : "";
};

var stringBuilder = function(data) {
	if (Array.isArray(data)) {
		return data.map(item => stringBuilder(item));
	}

	return Object.keys(data).map(val => {
		var dv = data[val];

		if (Array.isArray(dv)) {
			// dv = dv.map(item => stringBuilder(item));
			dv = stringBuilder(dv);
			dv.unshift("\n");
		}

		// if (Array.isArray(dv)) {
		// 	dv = dv.map(item => stringBuilder(item));
		// 	console.log(dv);
		// 	dv.unshift("\n");
		// }

		return [" ", val, ": ", dv, "\n"].join("");
	}).join("");
};

var userCmdHelper = function(subCmd) {
	// id
	if (subCmd && typeof parseInt(subCmd, 10) === "number") {
		return subCmd;
	}
};

var cmdSwitch = function (m) {
	var params, cacheKey;
	var cmdArray = m.text.replace(CMD_TRIGGER, "").split(" ");
	var cmd = cmdArray.shift();
	var subCmd = cmdArray.length ? cmdArray.shift() : "";

	console.log("Cmd ------------------");
	console.log(cmd, subCmd);
	console.log("/Cmd ------------------");

	var args = {
		channel: m.channel,
		as_user: true
	};

	switch (cmd.toLowerCase()) {
		case "me":
			cacheKey = params = "?opt_fields=name,email";
			break;
		case "users":
			cacheKey = params = "?opt_fields=name,email";//&limit=" + LIMIT;
			break;
		case "user":
			params = userCmdHelper(subCmd);
			cacheKey = cmd + params;
			break;
		// case "tasks":
		// 	// params = "?opt_fields=name,email";//&limit=" + LIMIT;
		// 	break;

		default:
			args.text = "Not a Known Command";
			instance.slackApi("chat.postMessage", args);
			return;
	}

	return fetchInfo(cmd, params, cacheKey).then((data) => {
		args.text = stringBuilder(data);
		console.log(args.text);
		instance.slackApi("chat.postMessage", args);
	});
};

var fetchInfo = function (cmd, params, cacheKey) {
	return new Promise((resolve, reject) => {
		if (cache[cacheKey]) {
			console.log("Cache: _______________\n");
			return resolve(cache[cacheKey]);
		}

		// Fetch from Asana
		http.get({
			url: resource(cmd, params),
			headers: headers
		})
		.then(res => {
			// console.log(JSON.parse(res));
			// cache response
			cache[cacheKey] = JSON.parse(res).data;
			return resolve(cache[cacheKey]);
		})
		.catch(err => {
			console.log(err);
			reject(err);
		});
	});
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
  command: cmdSwitch
});

Asana.create({channel: "#testing-slapp"}).then((inst) => {
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



var timer = setTimeout(function (){
	// cmdSwitch({channel: "#testing-slapp", text: "Asana: test"});
	
	// testing cache
	// cmdSwitch({channel: "#testing-slapp", text: "Asana: me"});
	// var timer2 = setTimeout(function (){
	// 	cmdSwitch({channel: "#testing-slapp", text: "Asana: me"});
	// 	clearTimeout(timer2);
	// }, 1000);


	// cmdSwitch({channel: "#testing-slapp", text: "Asana: users"});
	// cmdSwitch({channel: "#testing-slapp", text: "Asana: user 40357631998916"}); 
	cmdSwitch({channel: "#testing-slapp", text: "Asana: user 40357631998928"});
	// cmdSwitch({channel: "#testing-slapp", text: "Asana: tasks"});

	clearTimeout(timer);
}, 1000);

/*
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
*/
