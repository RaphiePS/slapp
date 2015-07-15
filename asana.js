/*jslint node: true, esnext: true */
"use strict";

// require("babel/register");
var config = require("./config");
var Http = require("./http");

var http = new Http();

http.get({
  url: "https://app.asana.com/api/1.0/users/me",
  headers: {
    "User-Agent": "request",
    "Content-Type": "application/json",
    "Authorization": "Basic " + config.asanaKey //new Buffer(config.asanaKey, 'base64').toString('base64')
  }
})
.then(function(json) {
  console.log(json);
})
.catch(function(err){
  console.log(err);
});