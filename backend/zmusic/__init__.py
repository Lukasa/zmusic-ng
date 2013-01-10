#!/usr/bin/env python

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os
import sys
import pkgutil

app = Flask(__name__)
app.config.from_pyfile(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../app.cfg'))

db = SQLAlchemy(app)

login_manager = LoginManager()
import zmusic.login
login_manager.setup_app(app)

import zmusic.endpoints
