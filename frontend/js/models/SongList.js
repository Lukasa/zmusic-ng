var SongList = Backbone.Collection.extend({
	model: Song,
	url: function() {
		return "query/" + encodeURIComponent(this.options.query) +
			"?offset=" + encodeURIComponent(this.offset) +
			(this.options.limit == 0 ? "" : "&limit=" + this.options.limit);
	},
	search: function(options) {
		this.options = _.extend({ limit: 150, queryType: "all", query: "" }, _.pick(options || {}, "limit", "queryType", "query"));
		this.offset = 0;
		this.total = 0;
		this.fetch({ reset: true });
	},
	hasMore: function() {
		return this.offset < this.total;
	},
	more: function(options) {
		if (!this.hasMore())
			return;
		this.options = _.extend(this.options, { limit: 150 }, _.pick(options || {}, "limit"));
		this.fetch({ silent: false, remove: false, add: true, update: true, success: function(collection, response) {
			collection.trigger("more", _(collection.models.slice(response.offset)));
			if (options && options.success)
				options.success();
		}});
	},
	initialize: function(models, player) {
		var that = this;
		this.options = {};
		this.localStateFilters = [ function(model, id) {
			if (that.player.playing != null && id == that.player.playing.id)
				model.playing = true;
			return model;
		} ];
		this.player = player;
		this.player.setCollection(this);
		this.on("change:playing", this.switchNowPlaying);
		this.on("play", this.player.playSong);
	},
	switchNowPlaying: function(model) {
		if (!model.get("playing"))
			return;
		this.forEach(function(other) {
			if (model.id != other.id && other.get("playing"))
				other.set("playing", false);
		});
	},
	parse: function(response) {
		this.total = response.total;
		this.offset = response.offset + response.songs.length;
		var that = this;
		return _.map(response.songs, function(song) {
			for (var i = 0; i < that.localStateFilters.length; ++i)
				song = that.localStateFilters[i](song, song.id);
			return song;
		});
	}
});
