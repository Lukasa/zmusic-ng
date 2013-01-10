from zmusic import app
from flask import jsonify
from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException

def json_error(ex):
	status_code = (ex.code if isinstance(ex, HTTPException) else 500)
	response = jsonify(error=str(ex), status=status_code)
	response.status_code = status_code
	return response

for code in default_exceptions.iterkeys():
	app.error_handler_spec[None][code] = json_error
