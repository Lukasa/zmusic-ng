var DownloadSelector = Backbone.View.extend({
	initialize: function() {
		var that = this;
		_(this).bindAll("render", "inhibitedRender");
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
		this.listenTo(this.collection, "reset", this.render);
		this.listenTo(this.collection, "add", this.render);
		this.listenTo(this.collection, "remove", this.render);
		this.songRows = {};
		this.render();
	},
	render: function() {
		if (this.inhibitRendering)
			return;
		
		var that = this;
		this.$table.empty();

		var newSongRows = {};
		this.collection.forEach(function(song) {
			var row;
			if (song.id in that.songRows)
				row = newSongRows[song.id] = that.songRows[song.id];
			else
				row = newSongRows[song.id] = new SongRow({ model: song, download: true });
			that.$table.append(row.render().el);
		});
		this.songRows = newSongRows;

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
