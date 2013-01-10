from zmusic import app, db
from zmusic.database import Download
from zmusic.login import admin_required
from flask import jsonify
import socket

@app.route('/stats')
@app.route('/stats/')
@admin_required
def stats_all_ips():
	ips = []
	socket.setdefaulttimeout(2)

	for ip in db.session.query(Download.ip).group_by(Download.ip).order_by(db.desc(db.func.max(Download.time))):
		try:
			host = socket.gethostbyaddr(ip.ip)[0]
		except:
			host = None
		ips.append({ "ip": ip.ip, "host": host })
	response = jsonify(downloaders=ips)
	response.cache_control.no_cache = True
	return response

@app.route('/stats/<ip>')
@admin_required
def stats_for_ip(ip):
	songlist = []
	for song in Download.query.filter((Download.ip == ip) & (Download.leader_id == None)).order_by(Download.leader_id).order_by(db.desc(Download.time)):
		if song.is_zip:
			zipsongs = [song.to_dict()]
			for zipsong in Download.query.filter(Download.leader_id == song.id).order_by(Download.time):
				zipsongs.append(zipsong.to_dict())
			songlist.append({ "zip": zipsongs })
		else:
			songlist.append({ "song": song.to_dict() })
	response = jsonify(downloads=songlist)
	response.cache_control.no_cache = True
	return response
