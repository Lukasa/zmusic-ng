var DownloadSelector = Backbone.View.extend({
	initialize: function() {
		var that = this;
		_(this).bindAll("add", "remove", "render", "inhibitedRender");
		this.inhibitRendering = false;
		this.$table = this.$el.find("table");
		this.$tableContainer = this.$el.find("#basket-container");
		this.$buttons = this.$el.find(".btn-group");
		this.$basketCount = this.$el.find(".basket-count");
		this.$basketCaret = this.$el.find(".icon-caret-down");
		var animateHide = function() {
			that.$tableContainer.css("overflow", "hidden").animate({ "max-height": "0", "height": "0" }, { complete: function() {
				that.$el.removeClass("basket-shown");
				$(this).css("overflow", "auto").css("height", "auto");
			}});
		};
		var animateShow = function() {
			that.$el.addClass("basket-shown");
			that.$tableContainer.css("overflow", "hidden").animate({ "scroll-top": "0", "max-height": "300px" }, { complete: function() {
				$(this).css("overflow", "auto");
			}});
		};
		this.$el.find(".show-basket").click(function() {
			if (that.collection.length) {
				if (that.$el.hasClass("basket-shown"))
					animateHide();
				else
					animateShow();
			}
		});
		var mouseIn = false;
		this.$el.find("#basket-container, .btn-group").mouseenter(function() {
			mouseIn = true;
		}).mouseleave(function() {
			mouseIn = false;
		});
		$(document).mousedown(function() {
			if (!mouseIn && that.$el.hasClass("basket-shown"))
				animateHide();
		});
		this.$el.find(".empty-basket").click(this.inhibitedRender(this.collection.emptyBasket));
		this.$el.find(".fill-basket").click(this.inhibitedRender(this.collection.fillBasket));
		this.$el.find(".download-basket").click(function() {
			if (!that.collection.length)
				return;
			var form = $("<form>").attr("method", "POST").attr("action", that.collection.url).attr("target", "_blank").css("display", "none");
			var params = that.collection.postParams();
			for (var i = 0; i < params.length; ++i)
				form.append($("<input>").attr("type", "hidden").attr("name", params[i].key).attr("value", params[i].value));
			$(document.body).append(form);
			form[0].submit();
			form.remove();
			that.inhibitedRender(that.collection.emptyBasket)();
		});
		this.songRows = {};
		this.listenTo(this.collection, "add", this.add);
		this.listenTo(this.collection, "remove", this.remove);
		this.listenTo(this.collection, "reset", this.reset);
		this.collection.forEach(this.add);
		this.render();
	},
	reset: function() {
		var that = this;
		var newSongRows = {}
		this.collection.forEach(function(song) {
			if (song.id in that.songRows && song === that.songRows[song.id].model)
				newSongRows[song.id] = that.songRows[song.id];
			else
				newSongRows[song.id] = new SongRow({ model: song, download: true });
		});
		this.songRows = newSongRows;
		this.render();
	},
	add: function(song) {
		var row = new SongRow({ model: song, download: true });
		this.songRows[song.id] = row;
		this.render();
	},
	remove: function(song) {
		var row = this.songRows[song.id];
		delete this.songRows[song.id];
		this.render();
	},
	render: function() {
		if (this.inhibitRendering)
			return;
		var that = this;
		this.$table.empty();
		this.collection.each(function(song) {
			that.$table.append(that.songRows[song.id].render().el);
		});
		this.$basketCount.text(this.collection.length);
		if (this.collection.length) {
			this.$basketCaret.show();
			this.$basketCount.addClass("badge-info");
		} else {
			this.$tableContainer.css("max-height", "0");
			this.$el.removeClass("basket-shown");
			this.$basketCount.removeClass("badge-info");
			this.$basketCaret.hide();
		}
		this.$tableContainer.width(this.$buttons.width());
		return this;
	},
	inhibitedRender: function(bulk) {
		var that = this;
		return function() {
			that.inhibitRendering = true;
			bulk(function() {
				that.inhibitRendering = false;
				that.render();
			});
		};
	}
});
