var Slapp = require("./index");
var config = require("./config"); // gitignored
var slapp = new Slapp(config.token);
var Q = require("q");
var rp = require("request-promise");

var log = function(x) { console.log(x); }

var id = config.deliveryClientId;
var secret = config.deliverySecret;

console.log("https://api.delivery.com?address=826 Broadway St, New York, NY&client_id=" + id);

rp("https://api.delivery.com?address=826 Broadway St, New York, NY&client_id=" + id, {
  headers: {
    "Authorization": secret
  }
})
