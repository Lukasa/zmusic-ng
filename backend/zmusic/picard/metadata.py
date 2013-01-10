# -*- coding: utf-8 -*-
#
# Picard, the next-generation MusicBrainz tagger
# Copyright (C) 2006-2007 Lukáš Lalinský
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

import re
import unicodedata
from zmusic.picard.util import format_time, load_release_type_scores

MULTI_VALUED_JOINER = '; '

class Metadata(object):
    """List of metadata items with dict-like access."""

    __weights = [
        ('title', 22),
        ('artist', 6),
        ('album', 12),
        ('tracknumber', 6),
        ('totaltracks', 5),
    ]

    def __init__(self):
        super(Metadata, self).__init__()
        self._items = {}
        self.images = []
        self.length = 0

    def add_image(self, mime, data, filename=None):
        self.images.append((mime, data, filename))

    def __repr__(self):
        return repr(self._items)

    def copy(self, other):
        self._items = {}
        for key, values in other.rawitems():
            self._items[key] = values[:]
        self.images = other.images[:]
        self.length = other.length

    def update(self, other):
        for name, values in other.rawitems():
            self._items[name] = values[:]
        if other.images:
            self.images = other.images[:]
        if other.length:
            self.length = other.length

    def clear(self):
        self._items = {}
        self.images = []
        self.length = 0

    def __get(self, name, default=None):
        values = self._items.get(name, None)
        if values:
            if len(values) > 1:
                return MULTI_VALUED_JOINER.join(values)
            else:
                return values[0]
        else:
            return default

    def __set(self, name, values):
        if not isinstance(values, list):
            values = [values]
        values = [v for v in values if v or v == 0]
        if len(values):
            self._items[name] = values

    def getall(self, name):
        return self._items.get(name, [])

    def get(self, name, default=None):
        return self.__get(name, default)

    def __getitem__(self, name):
        return self.__get(name, u'')

    def set(self, name, value):
        self.__set(name, value)

    def __setitem__(self, name, value):
        self.__set(name, value)

    def add(self, name, value):
        if value or value == 0:
            self._items.setdefault(name, []).append(value)

    def add_unique(self, name, value):
        if value not in self.getall(name):
            self.add(name, value)

    def keys(self):
        return self._items.keys()

    def iteritems(self):
        for name, values in self._items.iteritems():
            for value in values:
                yield name, value

    def items(self):
        """Returns the metadata items.

        >>> m.items()
        [("key1", "value1"), ("key1", "value2"), ("key2", "value3")]
        """
        return list(self.iteritems())

    def rawitems(self):
        """Returns the metadata items.

        >>> m.rawitems()
        [("key1", ["value1", "value2"]), ("key2", ["value3"])]
        """
        return self._items.items()

    def __contains__(self, name):
        return name in self._items

    def __delitem__(self, name):
        del self._items[name]

    def apply_func(self, func):
        new = Metadata()
        for key, values in self.rawitems():
            if not key.startswith("~"):
                new[key] = map(func, values)
        self.update(new)

    def strip_whitespace(self):
        """Strip leading/trailing whitespace.

        >>> m = Metadata()
        >>> m["foo"] = "  bar  "
        >>> m["foo"]
        "  bar  "
        >>> m.strip_whitespace()
        >>> m["foo"]
        "bar"
        """
        self.apply_func(lambda s: s.strip())

    def pop(self, key):
        return self._items.pop(key, None)


_album_metadata_processors = []
_track_metadata_processors = []


def register_album_metadata_processor(function):
    """Registers new album-level metadata processor."""
    _album_metadata_processors.append(function)


def register_track_metadata_processor(function):
    """Registers new track-level metadata processor."""
    _track_metadata_processors.append(function)


def run_album_metadata_processors(tagger, metadata, release):
    for processor in _album_metadata_processors:
        processor(tagger, metadata, release)


def run_track_metadata_processors(tagger, metadata, release, track):
    for processor in _track_metadata_processors:
        processor(tagger, metadata, track, release)
