import logging
import os
import hashlib

MIMETYPES = {
		"mp3": ["audio/mpeg", "audio/mp3", "audio/x-mp3", "audio/mpg", "audio/x-mpeg"],
		"wav": ["audio/wav"],
		"mpc": ["audio/x-musepack", "audio/x-mpc"],
		"ogg": ["audio/ogg", "audio/vorbis", "audio/x-vorbis", "application/ogg", "application/x-ogg"],
		"wma": ["audio/x-ms-wma", "video/x-ms-asf", "audio/x-wma"],
		"m4a": ["audio/mp4", "audio/x-m4a", "audio/mpeg4", "audio/aac"],
		"flac": ["audio/flac", "audio/x-flac", "application/x-flac"],
		"webm": ["audio/webm" ]
}

class File(dict, object):
	log = logging.getLogger()


	def __init__(self, filename):
		self["filename"] = filename
		self["filestat"] = os.stat(filename)
		self._load(filename)

	def _info(self, metadata, file):
		if "title" not in metadata or metadata["title"] is None or len(metadata["title"].strip()) == 0:
			metadata["title"] = os.path.splitext(os.path.basename(self["filename"]))[0]

		self.update(metadata)

		for mimetype in file.mime:
			for extension, mimeset in MIMETYPES.items():
				if mimetype in mimeset:
					self["mimetype"] = mimeset[0]
					self["extension"] = extension
					break
			if self["mimetype"] != None:
				break
		if self["mimetype"] == None and len(file.mime) != 0:
			self["mimetype"] = file.mime[0]

		self["length"] = file.info.length

		hash = hashlib.new("sha1")
		hash.update(str(metadata) + self["filename"])
		self["id"] = hash.hexdigest()
	
	def __missing__(self, key):
		return None
