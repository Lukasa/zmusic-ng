var SongTable = Backbone.View.extend({
	initialize: function() {
		var that = this;
		_(this).bindAll("add", "remove", "render", "renderMore");

		this.$songlistContainer = this.$el.find("#songlist-container");
		this.$tbody = this.$songlistContainer.find("tbody");
		this.$songlistContainer.scroll(function() {
			if (that.collection.hasMore() && this.scrollHeight - (this.scrollTop + this.clientHeight) < 2000)
				that.collection.more();
		});
		this.$searchProgress = this.$el.find("#search-progress");
		this.collection.on("request", function() {
			that.$searchProgress.removeClass().addClass("icon-spinner").addClass("icon-spin");
		}).on("sync", function() {
			that.$searchProgress.removeClass().addClass("icon-search");
		});
		this.$query = this.$el.find("#query");
		var doSearch = function() {
			var val = that.$query.val();
			if (val != that.collection.options.query)
				that.collection.search({ query: val });
		};
		var latestSearchTimer = null;
		this.$query.change(doSearch).keyup(function() {
			if (latestSearchTimer != null)
				clearTimeout(latestSearchTimer);
			latestSearchTimer = setTimeout(doSearch, 350);
		});

		this.listenTo(this.collection, "add", this.add);
		this.listenTo(this.collection, "remove", this.remove);
		this.listenTo(this.collection, "reset", this.render);
		this.listenTo(this.collection, "more", this.renderMore);
		this.render();
	},
	add: function(song) {
		var row = new SongRow({ model: song });
		this.songRows[song.id] = row;
	},
	remove: function(song) {
		var row = this.songRows[song.id];
		delete this.songRows[song.id];
	},
	appendSongs: function(songs) {
		var that = this;
		songs.each(function(song) {
			that.$tbody.append(that.songRows[song.id].render().el);
		});
	},
	render: function() {
		this.$tbody.empty().scrollTop(0);
		this.songRows = {};
		this.collection.each(this.add);
		this.appendSongs(this.collection);
		return this;
	},
	renderMore: function(more) {
		this.appendSongs(more);
	}
});
