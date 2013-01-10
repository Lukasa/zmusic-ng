from werkzeug.utils import secure_filename

def generate_download_filename(song, ext):
	filename = []
	if song.artist is not None and len(song.artist.strip()) != 0:
		filename.append(song.artist.strip())
	if song.album is not None and len(song.album.strip()) != 0:
		filename.append(song.album.strip())
	if song.track != 0:
		filename.append(str(song.track))
	if song.title is None or len(song.title.strip()) == 0:
		filename.append("Untitled Track")
	else:
		filename.append(song.title.strip())
	return secure_filename(" - ".join(filename) + "." + ext)
