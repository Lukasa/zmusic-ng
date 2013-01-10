from zmusic import app
from zmusic.login import query_is_music_user, query_is_admin_user, login_required, music_user, admin_user
from flask_login import current_user, login_user, logout_user
from flask import jsonify, request

@app.route('/login', methods=['POST'])
def login():
	success = False
	if query_is_music_user(request.form):
		success = login_user(music_user, remember=True)
	elif query_is_admin_user(request.form):
		success = login_user(admin_user, remember=True)
	response = jsonify(loggedin=success)
	response.cache_control.no_cache = True
	return response

@app.route('/login', methods=['GET'])
def login_check():
	response = jsonify(loggedin=current_user.is_authenticated())
	response.cache_control.no_cache = True
	return response

@app.route('/logout')
@login_required
def logout():
	response = jsonify(loggedout=logout_user())
	response.cache_control.no_cache = True
	return response
