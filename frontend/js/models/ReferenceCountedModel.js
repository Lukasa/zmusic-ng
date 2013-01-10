var ReferenceCountedModel = Backbone.Model.extend({
	take: function() {
		if (!this._referenceCount) {
			this._referenceCount = 1;
			ReferenceCountedModel._ids[this.id] = this;
		} else
			++this._referenceCount;
	},
	put: function() {
		if (!this._referenceCount)
			throw "Double free in ReferenceCountedModel";
		if (!--this._referenceCount)
			delete ReferenceCountedModel._ids[this.id];
	}
});

ReferenceCountedModel._ids = {};

var ReferenceCountingCollection = Backbone.Collection.extend({
	_prepareModel: function(attrs, options) {
		if (attrs instanceof Backbone.Model) {
			if (!attrs.collection)
				attrs.collection = this;
			attrs.take();
			return attrs;
		}
		options || (options = {});
		options.collection = this;
		var model = new this.model(attrs, options);
		if (model.id in ReferenceCountedModel._ids)
			model = ReferenceCountedModel._ids[model.id];
		model.take();
		if (!model._validate(attrs, options))
			return false;
		return model;
	},
	_removeReference: function(model) {
		if (this === model.collection)
			delete model.collection;
		model.off('all', this._onModelEvent, this);
		model.put();
	}
});