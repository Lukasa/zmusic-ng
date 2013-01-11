# -*- coding: utf-8 -*-
#
# Picard, the next-generation MusicBrainz tagger
# Copyright (C) 2007 Lukáš Lalinský
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

import wave
import os
from zmusic.picard.file import File
from zmusic.picard.metadata import Metadata
from zmusic.picard.util import encode_filename

class WaveInfo(object):
    def __init__(self, file):
        self.length = 1000 * file.getnframes() / file.getframerate()

class Wave(object):
    def __init__(self, file):
        self.mime = "audio/wav"
        self.info = WaveInfo(file)

class WAVFile(File):
    EXTENSIONS = [".wav"]
    NAME = "Microsoft WAVE"

    def _load(self, filename):
        self.log.debug("Loading file %r", filename)
        f = wave.open(encode_filename(filename), "rb")
        metadata = Metadata()
        metadata['~#channels'] = f.getnchannels()
        metadata['~#bits_per_sample'] = f.getsampwidth() * 8
        metadata['~#sample_rate'] = f.getframerate()
        metadata.length = 1000 * f.getnframes() / f.getframerate()
        metadata['~format'] = 'Microsoft WAVE'

        file = Wave(f)

        self._info(metadata, file)

        metadata["title"] = os.path.splitext(os.path.basename(filename))[0]
        metadata["album"] = ''
        metadata["artist"] = ''

        return metadata

    def _save(self, filename, metadata, settings):
        self.log.debug("Saving file %r", filename)
        pass
