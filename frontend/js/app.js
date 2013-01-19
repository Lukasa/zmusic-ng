$(function() {
	//XXX: Support for old zx2c4 music query strings. Replace query string with Backbone.Router hash urls
	function qParam(name) {
		var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
		return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
	}

	var startApp = function() {
		$("#loading").fadeOut();

		var audioPlayer = new AudioPlayer($("#controls"));
		var songList = new SongList([], audioPlayer);
		var songTable = new SongTable({
			el: $(document.body),
			collection: songList
		});
		new DownloadSelector({
			el: $("#basket"),
			collection: new DownloadBasket([], { songList: songList })
		});


		var song = parseInt(qParam("play"));
		if (!isNaN(song) && song > 0) {
			songList.once("sync", function() {
				var loadSong = function() {
					if (song > songList.length)
						return;
					audioPlayer.playSong(songList.models[song - 1]);
					songTable.scrollTo(songList.models[song - 1]);
				};
				if (song > songList.length && songList.hasMore())
					songList.more({ success: loadSong, limit: songList.options.limit * Math.ceil((song - songList.length) / songList.options.limit) });
				else
					loadSong();
			});
		}
		var defaultChoices = [ "Dire Straits", "Paramore", "Barenaked Ladies",
							   "Roy Buchanan", "Johnny Cash", "Kirsty MacColl",
							   "Counting Crows", "Tracy Chapman"];
		$("#query").val(qParam("query") || defaultChoices[Math.floor(Math.random() * defaultChoices.length)]).change();
	};

	var startAuth = function() {
		var login = $("#login").fadeIn();
		$("#loading").fadeOut();
		login.find("input").first().focus();
		login.find("form").submit(function() {
			var username = $(this.username).val();
			var password = $(this.password).val();
			var button = login.find("button").removeClass("btn-primary").addClass("disabled");
			login.find("input").val("").removeClass("incorrect-login").attr("disabled", "disabled");
			$.ajax("login", { type: "POST", data: { "username": username, "password": password } }).success(function(response) {
				if (response.loggedin) {
					button.addClass("btn-success");
					login.fadeOut();
					startApp();
				} else {
					login.find("input").removeAttr("disabled").val("").addClass("incorrect-login").first().focus();
					button.addClass("btn-danger").removeClass("disabled");
				}
			});
			return false;
		});
	};

	var processLogin = function(response) {
		if (response.loggedin)
			startApp();
		else
			startAuth();
	};

	if (qParam("username") && qParam("password"))
		$.ajax("login", { type: "POST", data: { "username": qParam("username"), "password": qParam("password") } }).success(processLogin);
	else
		$.ajax("login").success(processLogin);

});
