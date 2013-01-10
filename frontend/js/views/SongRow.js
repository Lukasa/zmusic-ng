var SongRow = Backbone.View.extend({
	tagName: "tr",
	initialize: function(options) {
		this.download = !!options.download;
		this.listenTo(this.model, "change", this.render);
	},
	render: function() {
		//XXX: Use proper templating.
		var model = this.model;
		this.$el.empty().append($("<td>").text(this.model.get("track")))
				.append($("<td>").text(this.model.get("title")))
				.append($("<td>").text(this.model.get("album")))
				.append($("<td>").text(this.model.get("artist")))
				.append($("<td>").append($("<a>")
					.append($("<i>").addClass(this.download ? "text-error icon-remove" : "icon-download-alt"))
					.addClass(this.download ? "remove" : "btn btn-mini")
					.addClass(model.get("inBasket") && !this.download ? "active btn-info" : "")
					.click(function() {
						model.set("inBasket", !model.get("inBasket"));
						return false;
					})));
		var that = this.model;
		if (!this.download) {
			this.$el.click(function() {
				that.trigger("play", that);
			});
		}
		if (this.model.get("playing"))
			this.$el.addClass("now-playing");
		else
			this.$el.removeClass("now-playing");
		return this;
	}
});
