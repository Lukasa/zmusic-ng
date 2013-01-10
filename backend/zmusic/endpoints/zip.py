from zmusic import app, db
from zmusic.login import login_required
from zmusic.database import Song, Download
from zmusic.filename import generate_download_filename
from flask import Response, request
from zlib import crc32 as crc32sum
from struct import pack
import time
import os

@app.route('/zip', methods=['POST'])
@login_required
def zipfile():
	hashes = request.form.getlist("hash", str)
	if len(hashes) == 0:
		return abort(404)
	filter = None
	for hash in hashes:
		if filter is None:
			filter = Song.id == hash
		else:
			filter |= Song.id == hash
	songs = db.session.query(Song.id, Song.filename, Song.artist, Song.album, Song.title, Song.track).filter(filter)
	if songs.count() == 0:
		return abort(404)
	
	first_id = None
	for song in songs:
		download = Download(song, request)
		if first_id is None:
			first_id = download.id
		else:
			download.leader_id = first_id
		download.is_zip = True
		db.session.add(download)
	db.session.commit()
	
	def do_zip():
		central_directory = ""
		offset = 0
		count = 0
		for song in songs:
			if not os.path.exists(song.filename):
				continue
			count += 1
			filename, ext = os.path.splitext(song.filename)
			if ext[0] == '.' and len(ext) > 1:
				ext = ext[1:]
			filename = generate_download_filename(song, ext)
			file = open(song.filename, 'rb')
			yield "\x50\x4b\x03\x04"			#local file header signature
			yield "\x14\x00"				#version needed to extract
			yield "\x00\x00"				#general purpose bit flag
			yield "\x00\x00"				#compression method
			yield "\x00\x00"				#last mod file time
			yield "\x00\x00"				#last mod file date
			crc32 = 0
			while True:
				data = file.read(8192)
				if not data:
					break
				crc32 = crc32sum(data, crc32)
			file.seek(0)
			crc32 = pack("<I", crc32 & 0xffffffff)
			yield crc32					#crc-32
			size = os.path.getsize(song.filename)
			yield pack("<I", size)				#compressed size
			yield pack("<I", size)				#uncompressed size
			yield pack("<H", len(filename))			#file name length
			yield "\x00\x00"				#extra field length
			yield filename					#file name
			while True:
				data = file.read(8192)
				if not data:
					break
				yield data				#file data
			central_directory += "\x50\x4b\x01\x02"
			central_directory += "\x00\x00"			#version made by
			central_directory += "\x14\x00"			#version needed to extract
			central_directory += "\x00\x00"			#gen purpose bit flag
			central_directory += "\x00\x00"			#compression method
			central_directory += "\x00\x00"			#last mod file time
			central_directory += "\x00\x00"			#last mod file date
			central_directory += crc32			#crc-32
			central_directory += pack("<I", size)		#compressed filesize
			central_directory += pack("<I", size)		#uncompressed filesize
			central_directory += pack("<H", len(filename))	#length of filename
			central_directory += "\x00\x00"			#extra field length
			central_directory += "\x00\x00"			#file comment length
			central_directory += "\x00\x00"			#disk number start
			central_directory += "\x00\x00"			#internal file attributes
			central_directory += "\x20\x00\x00\x00"		#external file attributes - 'archive' bit set (32)
			central_directory += pack("<I", offset)		#relative offset of local header
			offset += 30 + len(filename) + size
			central_directory += filename
			file.close()
		yield central_directory					#central directory
		yield "\x50\x4b\x05\x06"				#end of central directory signature	
		yield "\x00\x00"					#number of this disk
		yield "\x00\x00"					#number of the disk with the start of the central directory
		yield pack("<H", count)					#number of entries on disk
		yield pack("<H", count) 				#number of entries
		yield pack("<I", len(central_directory))		#size of central directory
		yield pack("<I", offset)				#offset to start of central directory
		yield "\x00\x00"					#zip comment size
	response = Response(do_zip(), mimetype="application/zip", direct_passthrough=True)
	response.headers.add('Content-Disposition', 'attachment', filename="ZX2C4Music-Download-" + str(int(time.time())) + ".zip")
	return response
