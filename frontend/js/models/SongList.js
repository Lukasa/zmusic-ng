var SongList = ReferenceCountingCollection.extend({
	model: Song,
	url: function() {
		return "query/" + encodeURIComponent(this.options.query) +
			"?offset=" + encodeURIComponent(this.offset) +
			(this.options.limit == 0 ? "" : "&limit=" + this.options.limit);
	},
	search: function(options) {
		this.options = _.extend({ limit: 300, queryType: "all", query: "" }, _.pick(options || {}, "limit", "queryType", "query"));
		this.offset = 0;
		this.total = 0;
		if (this.fetch_in_progress === this.url())
			return;
		this.fetch_in_progress = this.url();
		this.fetch({ reset: true, success: function(collection, response) {
			collection.fetch_in_progress = null;
		}});
	},
	hasMore: function() {
		return this.offset < this.total;
	},
	more: function(options) {
		if (!this.hasMore())
			return;
		this.options = _.extend(this.options, { limit: 300 }, _.pick(options || {}, "limit"));
		if (this.fetch_in_progress === this.url())
			return;
		this.fetch_in_progress = this.url();
		this.fetch({ silent: false, remove: false, add: true, update: true, success: function(collection, response) {
			collection.fetch_in_progress = null;
			collection.trigger("more", _(collection.models.slice(response.offset)));
			if (options && options.success)
				options.success();
		}});
	},
	initialize: function(models, player) {
		var that = this;
		this.options = {};
		this.fetch_in_progress = null;
		this.player = player;
		this.player.setCollection(this);
		this.on("play", this.player.playSong);
	},
	parse: function(response) {
		this.total = response.total;
		this.offset = response.offset + response.songs.length;
		return response.songs;
	}
});
