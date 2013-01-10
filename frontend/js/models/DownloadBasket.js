var DownloadBasket = Backbone.Collection.extend({
	model: Song,
	initialize: function(models, options) {
		var that = this;
		this.songList = options.songList;
		_(this).bindAll("addRemoveBasket", "emptyBasket", "fillBasket", "replace");
		this.listenTo(options.songList, "change:inBasket", this.addRemoveBasket);
		this.on("change:inBasket", this.addRemoveBasket);
		this.songList.localStateFilters.push(function(model, id) {
			if (that.get(id))
				model.inBasket = true;
			return model;
		});
		this.listenTo(options.songList, "add", function(model) {
			that.replace(model);
			that.trigger("reset", that, {});
		});
		var resyncCollection = function(collection) {
			collection.forEach(that.replace);
			that.trigger("reset", that, {});
		};
		this.listenTo(options.songList, "reset", resyncCollection);
		this.listenTo(options.songList, "more", resyncCollection);
	},
	replace: function(model) {
		var old = this._byId[model.id];
		if (!old || old === model)
			return;
		this._byId[model.id] = model;
		for (var key in this._byCid) {
			if (this._byCid[key].id == model.id)
				this._byCid[key] = model;
		}
		for (var i = 0; i < this.models.length; ++i) {
			if (this.models[i].id == model.id)
				this.models[i] = model;
		}
		old.off();
	        model.on("all", this._onModelEvent, this);
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
