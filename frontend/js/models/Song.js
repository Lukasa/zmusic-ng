var Song = ReferenceCountedModel.extend({
	defaults: {
		"title": "Untitled Track",
		"artist": "",
		"album": "",
		"track": "",
		"id": "{emptysong}",
		"mimetype": "audio/mpeg",
		"length": 0,
		"playing": false,
		"inBasket": false
	}
});
