var DownloadBasket = ReferenceCountingCollection.extend({
	model: Song,
	initialize: function(models, options) {
		var that = this;
		this.songList = options.songList;
		_(this).bindAll("addRemoveBasket", "emptyBasket", "fillBasket");
		this.listenTo(options.songList, "change:inBasket", this.addRemoveBasket);
		this.on("change:inBasket", this.addRemoveBasket);
	},
	addRemoveBasket: function(song, inBasket) {
		if (inBasket)
			this.add(song);
		else
			this.remove(song);
	},
	url: "zip",
	postParams: function() {
		var params = [];
		for (var i = 0; i < this.length; ++i)
			params.push({ key: "hash", value: this.at(i).id });
		return params;
	},
	emptyBasket: function(success) {
		var copy = this.models.slice(0);
		for (var i = 0; i < copy.length; ++i)
			copy[i].set("inBasket", false);
		if (success)
			success();
	},
	fillBasket: function(success) {
		var that = this;
		var fill = function() {
			that.songList.forEach(function(song) {
				song.set("inBasket", true);
			});
			if (success)
				success();
		};
		if (this.songList.hasMore())
			this.songList.more({ limit: 0, success: fill });
		else
			fill();
	}
});
