# ZX2C4 Music
### by Jason A. Donenfeld (<Jason@zx2c4.com>)

ZX2C4 Music provides a web interface for playing and downloading music files using metadata.

![Screenshot](http://data.zx2c4.com/zmusic-ng-small.png)

## Features

* HTML5 `<audio>` support.
* Transcodes unsupported formats on the fly.
* Serves `zip` files of chosen songs on the fly.
* Supports multiple formats: `mp3`, `aac`, `ogg`, `webm`, `flac`, `musepack`, `wav`, `wma`, and more.
* Clean minimalistic design.
* Handles very large directory trees.
* Full metadata extraction.
* Advanced search queries.
* Statistics logging.
* Simple RESTful JSON API design.
* Integration with nginx's `X-Accel-Redirect`.
* Supports multiple different database backends.
* Can run stand-alone or with uwsgi/nginx.

## Dependencies
### Frontend

* [backbone.js](http://backbonejs.org/)
* [underscore.js](http://underscorejs.org/)
* [jQuery](http://jquery.com/)
* [Bootstrap](http://twitter.github.com/bootstrap/)
* [Font Awesome](http://fortawesome.github.com/Font-Awesome/)
* [Closure Compiler](https://developers.google.com/closure/compiler/) and [YUI Compressor](http://developer.yahoo.com/yui/compressor/) for minification (Java required on system)

All frontend dependencies are included in the source.

### Backend

* [Flask](http://flask.pocoo.org/) (`pip install Flask`)
* [Flask-SQLAlchemy](http://packages.python.org/Flask-SQLAlchemy/) (`pip install Flask-SQLAlchemy`)
* [Flask-Login](http://packages.python.org/Flask-Login/) (`pip install Flask-Login`)
* [Mutagen](https://code.google.com/p/mutagen/) (`pip install mutagen`)
* [ffmpeg](http://ffmpeg.org/) (`apt-get install ffmpeg`)
* [Python](http://python.org/) >= 2.7 (`apt-get install python`)

All backend dependencies must be present on system.

## Downloading

The source may be downloaded using `git`:

    $ git clone http://git.zx2c4.com/zmusic-ng/

## Building

The entire project is built using standard makefiles:

    zmusic-ng $ make

The makefiles have the usual targets, such as `clean` and `all`, and some others discussed below. If the environment variable `DEBUG` is set to `1`, `js` and `css` files are not minified.

Want to run the app immediately? Skip down to [Running Standalone](#standalone).

## URLs and APIs

### Frontend

#### `GET /`

The frontend interface supports query strings for controlling the initial state of the application. These query strings wil be replaced with proper HTML5 `pushState` in the near future. Accepted query string keys:

* `username` and `password`: Automatically log in using provided credentials.
* `query`: Initial search query. If unset, chooses a search at random from predefined (see below) list.
* `play`: Integer (1-indexed) specifying which song in the list to autoplay. No song autoplays if not set.

### Backend

The provided frontend uses the following API calls. Third parties might implement their own applications using this simple API. All API endpoints return JSON unless otherwise specified.

#### `GET /query/<search query>`

Queries server for music metadata. Each word is matched as a substring against the artist, album, and title of each song. Prefixes of `artist:`, `album:`, and `title:` can be used to match exact strings against the respective keys. `*` can be used as a wildcard when matches are exact. Posix shell-style quoting and escaping is honored. Example searches:

* `charles ming`
* `changes mingus`
* `artist:"Charles Mingus"`
* `artist:charles*`
* `artist:charles* album:"Changes Two"`
* `goodbye pork artist:"Charles Mingus"`

Requires logged in user. The query strings `offset` and `limit` may be used to limit the number of returned entries.

#### `GET /song/<id>.<ext>`

Returns the data in the music file specified by `<id>` in the format given by `<ext>`. `<ext>` may be the original format of the file, or `mp3`, `ogg`, `webm`, or `wav`. If a format is requested that is not the song's original, the server will transcode it. Use of original formats is thus preferred, to cut down on server load and to enable seeking using HTTP `Content-Range`.

Requires logged in user. The server will add the `X-Content-Duration` HTTP header containing the duration in seconds as a floating point number.

#### `POST /login`

Takes form parameters `username` and `password`. Returns whether or not login was successful.

#### `GET /login`

Returns whether or not user is currently logged in.

#### `GET /logout`

Logs user out. This request lacks proper CSRF protection. Requires logged in user.

#### `GET /scan`

Scans the library for new songs and extracts metadata. This request lacks proper CSRF protection. Requires logged in admin user.

#### `GET /stats`

Returns IP addresses and host names of all downloaders in time-order. Requires logged in admin user.

#### `GET /stats/<ip>`

Returns all downloads and song-plays from a given `<ip>` address in time-order. Requires logged in admin user.

#### Authentication

All end points that require a logged in user may use the cookie set by `/login`. Alternatively, the query strings `username` and `password` may be sent for a one-off authentication.

## Configuration
### Frontend

The frontend should be relatively straight forward to customize. Change the title of the project in `frontend/index.html`, and change the default randomly selected search queries in `frontend/js/app.js`. A more comprehensible configuration system might be implemented at some point, but these two tweaks are easy enough that for now it will suffice.

### <a name="backendconfig"></a>Backend

The backend is configured by modifying the entries in `backend/app.cfg`. Valid configuration options are:

* SQLAlchemy keys: The keys listed [on the Flask-SQLAlchemy configuration page](http://packages.python.org/Flask-SQLAlchemy/config.html), with `SQLALCHEMY_DATABASE_URI` being of particular note.
* Flask keys: The keys listed [on the Flask configuration page](http://flask.pocoo.org/docs/config/#builtin-configuration-values). Be sure to change `SECRET_KEY` and set `DEBUG` to `False` for deployment.
* `STATIC_PATH`: The relative path of the frontend directory from the backend directory. The way this package is shipped, the default value of `../frontend` is best.
* `MUSIC_PATH`: The path of a directory tree containing music files you'd like to be served.
* `ACCEL_STATIC_PREFIX`: By default `False`, but if set to a path, this path is used as a prefix for fetching static files via nginx's `X-Accel-Redirect`. nginx must be configured correctly for this to work.
* `ACCEL_MUSIC_PREFIX`:  By default `False`, but if set to a path, this path is used as a prefix for fetching music files via nginx's `X-Accel-Redirect`. nginx must be configured correctly for this to work.
* `MUSIC_USER` and `MUSIC_PASSWORD`: The username and password of the user allowed to listen to music.
* `ADMIN_USER` and `ADMIN_PASSWORD`: The username and password of the user allowed to scan `MUSIC_PATH` for new music and view logs and statistics.

## Deployment
### <a name="standalone"></a>Running Standalone

By far the easiest way to run the application is standalone. Simply execute `backend/local_server.py` to start a local instance using the built-in Werkzeug server. This server is not meant for production. Be sure to [configure the usernames and music directory first](#backendconfig).

    zmusic-ng $ backend/local_server.py
    * Running on http://127.0.0.1:5000/
    * Restarting with reloader

The collection may be scanned using the admin credentials:

    zmusic-ng $  curl http://127.0.0.1:5000/scan?username=ADMIN_USER&password=ADMIN_PASSWORD

And then the site may be viewed in the browser:

    zmusic-ng $ chromium http://127.0.0.1:5000/

The built-in debugging server cannot handle concurrent requests, unfortuantely. To more robustly serve standalone, read on to running standalone with uwsgi.

### Running Standalone with uwsgi

The built-in Werkzeug server is really only for debugging, and cannot handle more than one request at a time. This means that, for example, one cannot listen to music and query for music at the same time. Fortunately, it is easy to use uwsgi without the more complicated nginx setup (described below) in a standalone mode:

    zmusic-ng $ uwsgi --chdir backend/ -w zmusic:app --http-socket 0.0.0.0:5000

Depending on your distro, you may need to add `--plugins python27` or similar.

Once the standalone server is running you can scan and browse using the URLs above.

### Uploading Music

There is an additional makefile target called `update-collection` for uploading a local directory to a remote directory using `rsync` and running the metadata scanner using `curl`. Of course, uploading is not neccessary if running locally.

    zmusic-ng $ make update-collection

The `server.cfg` configuration file controls the revelent paths for this command:

* `SERVER`: The hostname of the remote server.
* `LOCAL_COLLECTION_PATH`: The path of the music folder on the local system.
* `SERVER_COLLECTION_PATH`: The destination path of the music folder on the remote system.
* `ADMIN_USERNAME` and `ADMIN_PASSWORD` should be the same as those set in `backend/app.cfg`.

### nginx / uwsgi

Deployment to nginx requires use of [uwsgi](http://projects.unbit.it/uwsgi/). A sample configuration file can be found in `backend/nginx.conf`. Make note of the paths used for the `/static/` and `/music/` directories. These should be absolute paths to those specified in `backend/app.cfg` as `STATIC_PATH` and `MUSIC_PATH`.

uwsgi should be run with the `-w zmusic:app` switch, possibly using `--chdir` to change directory to the `backend/` directory, if not already there.

For easy deployment, the makefile has some deployment targets, which are configured by the `server.cfg` configuration file. These keys should be set:

* `SERVER`: The hostname of the deployed server.
* `SERVER_UPLOAD_PATH`: A remote path where the default ssh user can write.
* `SERVER_DEPLOY_PATH`: A remote path where the default ssh user cannot write, but where root can.

The `upload` target uploads relevent portions of the project to `SERVER_UPLOAD_PATH`. The `deploy` target first executes the `upload` target, then copies files from `SERVER_UPLOAD_PATH` to `SERVER_DEPLOY_PATH` with the proper permissions, and then finally restarts the uwsgi processes.

    zmusig-ng $ make deploy

These makefile targets should be used with care, and the makefile itself should be inspected to ensure all commands are correct for custom configurations.

Here is what a full build and deployment looks like:

    zx2c4@Thinkpad ~/Projects/zmusic-ng $ make deploy
    make[1]: Entering directory `/home/zx2c4/Projects/zmusic-ng/frontend'
        JS      js/lib/jquery.min.js
        JS      js/lib/underscore.min.js
        JS      js/lib/backbone.min.js
        JS      js/models/ReferenceCountedModel.min.js
        JS      js/models/Song.min.js
        JS      js/models/SongList.min.js
        JS      js/models/DownloadBasket.min.js
        JS      js/views/SongRow.min.js
        JS      js/views/SongTable.min.js
        JS      js/views/DownloadSelector.min.js
        JS      js/controls/AudioPlayer.min.js
        JS      js/app.min.js
        CAT     js/scripts.min.js
        CSS     css/bootstrap.min.css
        CSS     css/font-awesome.min.css
        CSS     css/page.min.css
        CAT     css/styles.min.css
    make[1]: Leaving directory `/home/zx2c4/Projects/zmusic-ng/frontend'
        RSYNC   music.zx2c4.com:zmusic-ng
        [clipped]
        DEPLOY  music.zx2c4.com:/var/www/uwsgi/zmusic
    + umask 027
    + sudo rsync -rim --delete '--filter=P zmusic.db' zmusic-ng/ /var/www/uwsgi/zmusic
        [clipped]
    + sudo chown -R uwsgi:nginx /var/www/uwsgi/zmusic
    + sudo find /var/www/uwsgi/zmusic -type f -exec chmod 640 '{}' ';'
    + sudo find /var/www/uwsgi/zmusic -type d -exec chmod 750 '{}' ';'
    + sudo /etc/init.d/uwsgi.zmusic restart
     * Stopping uWSGI application zmusic ...
     * Starting uWSGI application zmusic ...

## Bugs? Comments? Suggestions?

Send all feedback, including `git`-formatted patches, to <Jason@zx2c4.com>.

## Disclaimer

The author does not condone or promote using this software for redistributing copyrighted works.

## License

Copyright (C) 2013 Jason A. Donenfeld. All Rights Reserved.

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
