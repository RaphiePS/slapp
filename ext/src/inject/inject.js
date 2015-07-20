$(function() {
	var socket = new WebSocket("ws://localhost:8080");

	var playButton = function() {
		return document.querySelector(".player-control-button.player-play-pause")
	}

	var isPlaying = function() {
		var button = playButton();
		return Array.prototype.slice.call(button.classList).indexOf("pause") !== -1;
	}

	socket.onmessage = function(raw) {
		console.log(raw);
		var m = JSON.parse(raw.data);
		if (m.action === "next") {
			document.querySelector(".player-control-button.player-next-episode").click();
		}
		// if (m.action === "toggle-mute") {
		// 	document.querySelector(".player-control-button.volume").click();
		// }
		if (m.action === "play") {
			if (!isPlaying()) {
				playButton().click();
			}
		}

		if (m.action === "pause") {
			if (isPlaying()) {
				playButton().click();
			}
		}
	}

	var isMuted = function() {
		var volButton = document.querySelector(".player-control-button.volume");
		for (var i = 0; i < volButton.classList.length; i++) {
			var str = volButton.classList[i];
			if (str === "icon-player-volume-full") continue;
			var match = str.match(/icon-player-volume-(.+)/);
			if (!match) continue;
			return match[1] === "0";
		}
	}

	setInterval(function() {
		var statusEl = document.querySelector(".player-status");
		var status = {};
		if (statusEl && statusEl.firstChild) {
			status.loading = false;
			status.showName = statusEl.children[0].innerText;
			status.episodeNum = statusEl.children[1].innerText;
			status.episodeName = statusEl.children[2].innerText;
			status.timeRemaining = document.querySelector(".player-slider").firstChild.innerText;
			status.isMuted = isMuted();
			status.isPlaying = isPlaying();
		} else {
			status.loading = true;
		}
		socket.send(JSON.stringify(status));
	}, 1000);
})
