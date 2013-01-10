from zmusic import app
from flask import Response, send_from_directory
from mimetypes import guess_type
import os

@app.route('/', defaults={ "filename": "index.html" })
@app.route('/<path:filename>')
def index(filename):
	static_dir = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../..", app.config["STATIC_PATH"]))
	if app.config["ACCEL_STATIC_PREFIX"]:
		mimetype = None
		types = guess_type(os.path.join(static_dir, filename))
		if len(types) != 0:
			mimetype = types[0]
		response = Response(mimetype=mimetype)
		response.headers.add("X-Accel-Redirect", os.path.join(app.config["ACCEL_STATIC_PREFIX"], filename))
		return response
	else:
		return send_from_directory(static_dir, filename)
