var AudioPlayer = function(controls) {
	this.playing = null;
	this.collection = null;
	var that = this;

	_(this).bindAll("playSong", "nextSong", "prevSong", "stopSong", "playPauseSong", "seekSong", "setNowPlaying");

	this.$playPause = controls.find(".play-pause").click(this.playPauseSong);
	this.$stop = controls.find(".stop").click(this.stopSong);
	this.$progress = controls.find(".bar");
	this.$progressContainer = controls.find(".progress");
	this.$prev = controls.find(".prev").click(this.prevSong);
	this.$next = controls.find(".next").click(this.nextSong);
	this.$nowPlaying = controls.find(".current-track");
	this.$audio = $("<audio>");
	this.audio = this.$audio[0];
	if (!(function() {
		if (!that.audio.canPlayType)
			return false;
		for (var i = 0; i < AudioPlayer.preferredMimes.length; ++i) {
			if (that.audio.canPlayType(AudioPlayer.preferredMimes[i]))
				return true;
		}
		return false;
	})()) {
		alert("Your browser doesn't support any codecs for HTML5 audio.");
		window.location.href = "http://www.google.com/chrome";
	}
	controls.append(this.$audio);
	var setStatusText = function(text) {
		return function() {
			that.$nowPlaying.text(text);
		};
	};
	this.audio.addEventListener("ended", this.nextSong);
	this.audio.addEventListener("playing", this.setNowPlaying);
	this.audio.addEventListener("loadstart", setStatusText("Loading..."));
	this.audio.addEventListener("error", setStatusText("Error playing."));
	this.audio.addEventListener("loadeddata", setStatusText("Loaded..."));
	this.audio.addEventListener("play", function() {
		that.$playPause.find("i").removeClass().addClass("icon-pause");
		that.$progressContainer.addClass("active");
	});
	this.audio.addEventListener("pause", function() {
		that.$playPause.find("i").removeClass().addClass("icon-play");
		that.$progressContainer.removeClass("active");
	});
	this.audio.addEventListener("timeupdate", function() {
		function formatTime(time) {
			function pad(number) {
				var ret = number.toString();
				if (ret.length < 2)
					return "0" + ret;
				return ret;
			}
			var hours, minutes, seconds;
			hours = Math.floor(time / (60 * 60));
			minutes = Math.floor(time % (60 * 60) / 60);
			seconds = Math.floor(time % (60 * 60) % 60);
			if (hours == 0)
				return pad(minutes) + ":" + pad(seconds);
			return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
		}
		var width, text;
		if (isNaN(this.duration) || isNaN(this.currentTime)) {
			width = 0;
			text = "";
		} else {
			var duration = this.duration;
			if (that.playing != null && (!isFinite(this.duration) || this.duration == this.currentTime))
				duration = that.playing.get("length");
			if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
				width = 100;
				text = formatTime(this.currentTime);
			} else {
				width = this.currentTime / duration * 100;
				text = formatTime(this.currentTime) + " / " + formatTime(duration);
			}
		}
		that.$progress.css("width", width.toString() + "%");
		that.$progress.text(text);
	});

	//XXX: Relocate this elsewhere.
	var seekEvent = function(e) {
		that.seekSong((e.pageX - that.$progressContainer.offset().left) / that.$progressContainer.width());
	};
	var buttonDown = false;
	this.$progressContainer.mousemove(function(e) {
		if (buttonDown)
			seekEvent(e);
	}).mousedown(function(e) {
		buttonDown = true;
		seekEvent(e);
	});
	$(document).mouseup(function() {
		buttonDown = false;
	});
};
AudioPlayer.prototype.setCollection = function(collection) {
	this.collection = collection;
};
AudioPlayer.preferredMimes = [ "audio/webm", "audio/ogg", "audio/mpeg", "audio/flac", "audio/wav" ]
AudioPlayer.mimeMap = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/wav": "wav",
			"audio/ogg": "ogg", "audio/x-ms-wma": "wma", "audio/flac": "flac",
			"audio/x-musepack": "mpc", "audio/mpeg": "mp3" };
AudioPlayer.prototype.getSources = function(id, mimetype) {
	var sources = [];
	if (mimetype in AudioPlayer.mimeMap)
		sources.push({ src: "song/" + id + "." + AudioPlayer.mimeMap[mimetype], type: mimetype });
	for (var i = 0; i < AudioPlayer.preferredMimes.length; ++i) {
		if (mimetype == AudioPlayer.preferredMimes[i])
			continue;
		sources.push({ src: "song/" + id + "." + AudioPlayer.mimeMap[AudioPlayer.preferredMimes[i]],
				type: AudioPlayer.preferredMimes[i] });
	}
	return sources;
};
AudioPlayer.prototype.setNowPlaying = function() {
	if (this.playing == null)
		return;
	var tokens = [];
	if (this.playing.get("artist").length)
		tokens.push(this.playing.get("artist"));
	if (this.playing.get("album").length)
		tokens.push(this.playing.get("album"));
	if (this.playing.get("title").length)
		tokens.push(this.playing.get("title"));
	this.$nowPlaying.text(tokens.join(" - "));
};
AudioPlayer.prototype.playSong = function(song) {
	if (this.playing != null && song.id == this.playing.id)
		return;
	this.stopSong();
	song.set("playing", true);
	this.playing = song;
	this.setNowPlaying();
	var sources = this.getSources(song.id, song.get("mimetype"));
	for (var i = 0; i < sources.length; ++i)
		this.$audio.append($("<source>").attr("src", sources[i].src).attr("type", sources[i].type));
	this.audio.load();
	this.audio.play();
};
AudioPlayer.prototype.nextSong = function() {
	if (this.collection == null)
		return;
	if (this.playing == null) {
		if (this.collection.length != 0)
			this.playSong(this.collection.at(0));
		return;
	}

	var i;
	for (i = 0; i < this.collection.length; ++i) {
		if (this.playing.id == this.collection.at(i).id)
			break;
	}
	if (i >= this.collection.length - 1) {
		if (i == this.collection.length - 1 && this.collection.hasMore()) {
			var that = this;
			this.collection.more({ success: function() {
				that.playSong(that.collection.at(i + 1))
			}});
		}
		this.stopSong();
		return;
	}
	this.playSong(this.collection.at(i + 1));
};
AudioPlayer.prototype.prevSong = function() {
	if (this.collection == null)
		return;
	if (this.playing == null) {
		if (this.collection.length != 0)
			this.playSong(this.collection.at(this.collection.length - 1));
		return;
	}
	if (this.audio.currentTime > 10) {
		this.audio.currentTime = 0;
		return;
	}
	var i;
	for (i = 0; i < this.collection.length; ++i) {
		if (this.playing.id == this.collection.at(i).id)
			break;
	}
	if (i == 0) {
		this.stopSong();
		return;
	}
	this.playSong(this.collection.at(i - 1));
};
AudioPlayer.prototype.playPauseSong = function() {
	if (this.playing == null) {
		this.nextSong();
		return;
	}
	if (this.audio.paused)
		this.audio.play();
	else
		this.audio.pause();
};
AudioPlayer.prototype.stopSong = function() {
	if (this.playing != null) {
		this.playing.set("playing", false);
		this.playing = null;
	}
	this.audio.pause();
        this.$audio.empty();
	this.audio.load();
	this.$playPause.find("i").removeClass().addClass("icon-play");
	this.$progressContainer.removeClass("active");
	this.$progress.css("width", "0%");
	this.$progress.text("");
	this.$nowPlaying.text("");
};
AudioPlayer.prototype.seekSong = function(fraction) {
	if (this.playing == null || !isFinite(this.audio.duration) || isNaN(this.audio.duration) || fraction > 1 || fraction < 0)
		return;
	if (this.audio.duration == this.audio.currentTime)
		return;
	this.audio.currentTime = this.audio.duration * fraction;
};
