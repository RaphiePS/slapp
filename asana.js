/*jslint node: true, esnext: true */
"use strict";

var config = require("./config");
var Http = require("./http");

var http = new Http();

http.get({
  url: "https://app.asana.com/api/1.0/users/me",
  headers: {
    "User-Agent": "request",
    "Content-Type": "application/json",
    "Authorization": "Basic " + config.asanaKey
  }
})
.then(json => {
  console.log(json);
})
.catch(err => {
  console.log(err);
});