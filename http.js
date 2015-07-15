/*jslint node: true, esnext: true */
"use strict";

var request = require("request");

var Http = function() {
  this.get = function(url) {
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (error) {
          reject(error);
        }

        resolve(body);
      });
    });
  };
};

module.exports = Http;