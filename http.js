/*jslint node: true, esnext: true */
"use strict";

var request = require("request");

var Http = function() {
  this.get = function(url) {
    return new Promise((resolve, reject) => {
      request.get(url, (error, response, body) => {
        if (error) {
          reject(error);
        }

        resolve(body);
      });
    });
  };

  this.post = function(data) {
    // var options = {url: url, data: data};

    return new Promise((resolve, reject) => {
      request.post(data, (error, response, body) => {
        if (error) {
          reject(error);
        }

        resolve(body);
      });
    });
  };
};

module.exports = Http;