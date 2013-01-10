from flask import Response, request
from werkzeug.wsgi import FileWrapper
from werkzeug.datastructures import Headers
from zmusic import app
import subprocess
import os
import re

class ProcessWrapper(object):
	def __init__(self, process, buffer_size=8192):
		self.process = process
		self.buffer_size = buffer_size
	def close(self):
		if self.process.returncode is not None:
			return
		self.process.stdout.close()
		self.process.terminate()
		self.process.wait()
	def __iter__(self):
		return self
	def __del__(self):
		self.close()
	def next(self):
		try:
			data = self.process.stdout.read(self.buffer_size)
		except:
			self.close()
			raise StopIteration()
		if data:
			return data
		self.close()
		raise StopIteration()

def send_process(args, mimetype=None, attachment_filename=None, headers=Headers()):
	headers.add('Content-Disposition', 'attachment', filename=attachment_filename)
	def close_fds():
		# For some reason, ffmpeg flips out if stdin is closed, so we dup2 /dev/null to it.
		os.dup2(os.open('/dev/null', os.O_RDONLY), 0)
		os.close(2)
	process = subprocess.Popen(args, close_fds=True, stdout=subprocess.PIPE, preexec_fn=close_fds)
	response = ProcessWrapper(process)
	return Response(response, mimetype=mimetype, headers=headers, direct_passthrough=True)

class PartialFileWrapper(object):
	def __init__(self, file, offset=0, length=None, buffer_size=8192):
		self.file = file
		self.file.seek(offset, os.SEEK_CUR)
		self.length = length
		self.buffer_size = buffer_size
	def close(self):
		if hasattr(self.file, 'close'):
			self.file.close()
	def __iter__(self):
		return self
	def next(self):
		if self.length is not None:
			if self.length <= 0:
				raise StopIteration()
			data = self.file.read(min(self.length, self.buffer_size))
			if not data:
				raise StopIteration()
			if len(data) == 0:
				raise StopIteration()
			self.length -= len(data)
			return data
		else:
			data = self.file.read(self.buffer_size)
			if data:
				return data
			raise StopIteration()

def send_file_partial(path, mimetype=None, attachment_filename=None, headers=Headers()):
	headers.add('Content-Disposition', 'attachment', filename=attachment_filename)
	if app is not None and app.config['ACCEL_MUSIC_PREFIX']:
		headers.add('X-Accel-Redirect', os.path.join(app.config['ACCEL_MUSIC_PREFIX'], os.path.relpath(path, app.config['MUSIC_PATH'])))
		return Response(mimetype=mimetype, headers=headers)
	
	file = open(path, 'rb')
	size = os.path.getsize(path)
	headers.add('Accept-Ranges', 'bytes')
	range_header = request.headers.get('Range', None)
	if not range_header:
		headers.add('Content-Length', size)
		return Response(FileWrapper(file), mimetype=mimetype, headers=headers, direct_passthrough=True)

	byte1, byte2 = 0, None
	m = re.search('(\d+)-(\d*)', range_header)
	g = m.groups()
	if g[0]:
		byte1 = int(g[0])
	if g[1]:
		byte2 = int(g[1])

	length = size - byte1
	if byte2 is not None:
		length = byte2 - byte1
	headers.add('Content-Range', 'bytes {0}-{1}/{2}'.format(byte1, byte1 + length - 1, size))
	headers.add('Content-Length', length)

	return Response(PartialFileWrapper(file, offset=byte1, length=length), 206, mimetype=mimetype, headers=headers, direct_passthrough=True)
