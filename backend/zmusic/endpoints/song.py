from zmusic import app, db
from zmusic.database import Song, Download
from zmusic.login import login_required
from zmusic.streams import send_process, send_file_partial
from zmusic.filename import generate_download_filename
from zmusic.picard.file import MIMETYPES as mimetypes
from flask import abort, request
from werkzeug.datastructures import Headers
import os

@app.route('/song/<id>.<ext>')
@login_required
def song(id, ext):
	song = db.session.query(Song.id, Song.filename, Song.length, Song.mimetype, Song.artist, Song.album, Song.title, Song.track).filter(Song.id == id).first()
	if song == None or not os.path.exists(song.filename):
		return abort(404)
	headers = Headers()
	headers.add("X-Content-Duration", song.length)
	headers.add("X-Accel-Buffering", "no")
	range_header = request.headers.get('Range', None)
	if range_header is not None:
		range_header = range_header.split("-")
		try:
			range_header = intval(range_header[0])
		except:
			range_header = None
	if range_header is None or range_header == 0:
		db.session.add(Download(song, request))
		db.session.commit()
	
	ext = ext.lower()

	for extension, mimeset in mimetypes.items():
		if song.mimetype in mimeset and extension == ext:
			return send_file_partial(song.filename, mimetype=song.mimetype, attachment_filename=generate_download_filename(song, ext), headers=headers)

	if ext not in [ "ogg", "mp3", "flac", "wav", "webm" ]:
		return abort(404)
	transcode_options = [ 'ffmpeg', '-loglevel', 'quiet', '-i', song.filename, '-f', ext, '-y' ];
	if ext == "ogg" or ext == "webm":
		transcode_options.extend([ '-acodec', 'libvorbis', '-aq', '5' ])
	elif ext == "mp3":
		transcode_options.extend([ '-ab', '160k' ])
	transcode_options.append('-')
	return send_process(transcode_options, mimetype=mimetypes[ext][0], attachment_filename=generate_download_filename(song, ext), headers=headers)
