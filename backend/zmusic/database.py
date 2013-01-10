from zmusic import db
from uuid import uuid4
import time

class Song(db.Model):
	__tablename__ = 'songs'

	filename = db.Column(db.String, primary_key=True)
	id = db.Column(db.String, nullable=False, index=True)
	title = db.Column(db.String)
	album = db.Column(db.String)
	artist = db.Column(db.String)
	mimetype = db.Column(db.String)
	year = db.Column(db.Integer)
	track = db.Column(db.Integer)
	disc = db.Column(db.Integer)
	lastmodified = db.Column(db.Integer)
	filesize = db.Column(db.Integer)
	length = db.Column(db.Float)

	def sync_picard(self, songdict):
		self.id = songdict["id"]
		self.filename = songdict["filename"]
		self.lastmodified = songdict["filestat"].st_mtime
		self.filesize = songdict["filestat"].st_size
		self.title = songdict["title"]
		self.album = songdict["album"]
		self.artist = songdict["artist"]
		self.mimetype = songdict["mimetype"]
		self.length = songdict["length"]
		try:
			self.year = int(songdict["date"].split("-")[0])
		except:
			self.year = 0
		try:
			self.track = int(songdict["tracknumber"])
		except:
			self.track = 0
		try:
			self.disc = int(songdict["discnumber"])
		except:
			self.disc = 0
	
	def to_dict(self):
		return { "id": self.id, "track": self.track, "title": self.title, "artist": self.artist,
			 "album": self.album, "mimetype": self.mimetype, "length": self.length }


class Download(db.Model):
	__tablename__ = 'downloads'
	
	id = db.Column(db.String, primary_key=True)
	leader_id = db.Column(db.String)
	time = db.Column(db.Integer)
	ip = db.Column(db.String, index=True)
	useragent = db.Column(db.String)
	song_id = db.Column(db.String, db.ForeignKey(Song.id))
	artist = db.Column(db.String)
	album = db.Column(db.String)
	title = db.Column(db.String)
	is_zip = db.Column(db.Boolean)

	def __init__(self, song, request):
		self.artist = song.artist
		self.album = song.album
		self.title = song.title
		self.song_id = song.id
		self.time = int(round(time.time() * 100000))
		self.useragent = request.headers.get('User-Agent')
		ip = request.remote_addr
		if (ip.find('::ffff:') == 0 and len(ip) > len('::ffff:')):
			ip = ip[len('::ffff:'):]
		self.ip = ip
		self.id = str(uuid4())
		is_zip = False
	
	def to_dict(self):
		return { "artist": self.artist, "album": self.album, "title": self.title,
			 "id": self.song_id, "time": self.time, "useragent": self.useragent,
			 "ip": self.ip }
