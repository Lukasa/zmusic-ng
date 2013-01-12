from zmusic import app
from zmusic.login import login_required
from zmusic.database import Song
from flask import request, jsonify
import shlex

@app.route('/query', defaults={ "query": "" })
@app.route('/query/', defaults={ "query": "" })
@app.route('/query/<path:query>')
@login_required
def query(query):
	offset = request.args.get("offset", 0, int)
	limit = request.args.get("limit", None, int)
	if offset < 0:
		offset = 0
	if limit is not None and limit < 0:
		limit = 0

	filter_map = { "artist": Song.artist, "album": Song.album, "title": Song.title, "id": Song.id }
	filter_chain = None
	try:
		terms = shlex.split(query)
	except:
		return jsonify(total=0, offset=offset, songs=[])

	for term in terms:
		field = term.split(':', 1)
		if len(field) == 1 or field[0] not in filter_map:
			word = term.strip().replace('*', "%")
			if len(word) == 0:
				continue
			term_filter = Song.id == word
			word = "%" + word + "%"
			term_filter |= Song.artist.like(word)
			term_filter |= Song.album.like(word)
			term_filter |= Song.title.like(word)
		else:
			term_filter = filter_map[field[0]].like(field[1].replace('*', '%'))
		if filter_chain is None:
			filter_chain = term_filter
		else:
			filter_chain &= term_filter

	query = Song.query
	if filter_chain is not None:
		query = query.filter(filter_chain)
	total = query.count()
	query = query.order_by(Song.artist).order_by(Song.year).order_by(Song.album).order_by(Song.disc).order_by(Song.track).order_by(Song.title)
	query = query.offset(offset)
	if limit != None:
		query = query.limit(limit)
 
	songs = []
	for song in query:
		if song.title is None or len(song.title.strip()) == 0:
			song.title = "Untitled Song"
		if song.track == 0:
			song.track = None
		songs.append(song.to_dict())
	return jsonify(total=total, offset=offset, songs=songs)
