/*jslint node: true, esnext: true */
"use strict";

// require("babel/register");
var request = require("request");

var Http = function() {
  this.get = function(url) {
    return new Promise(function(resolve, reject) {
      request(url, function(error, response, body) {
        if (error) {
          reject(error);
        }

        resolve(body);
      });
    });
  };
};

module.exports = Http;