# -*- coding: utf-8 -*-
import logging
import warnings
import os
import subprocess
from io import BytesIO
from werkzeug.datastructures import FileStorage
from tempfile import NamedTemporaryFile
from odoo import http
from odoo.addons.whatsapp_connector.controllers import main
from ..models.Message import INSTAGRAM_AUDIO_FORMAT_ALLOWED
from ..models.Message import INSTAGRAM_VIDEO_FORMAT_ALLOWED
_logger = logging.getLogger(__name__)


try:
    saved_warning_state = warnings.filters[:]
    warnings.simplefilter('ignore')
    import pydub
except Exception:
    pydub = None
finally:
    warnings.filters = saved_warning_state


class Binary(main.Binary):

    @http.route('/web/binary/upload_attachment_chat', methods=['POST'], type='http', auth='user')
    def mail_attachment_upload(self, ufile, thread_id, thread_model, is_pending=False, connector_type=None, **kwargs):
        if (connector_type == 'instagram' and ufile and ufile.mimetype):
            ufile = self.check_instagram_file(ufile)

        return super(Binary, self).mail_attachment_upload(ufile, thread_id, thread_model, is_pending=is_pending,
                                                          connector_type=connector_type, **kwargs)

    def check_instagram_file(self, ufile):
        file_type = ufile.mimetype.split('/')[0]
        if (not pydub or file_type not in ['audio', 'video'] or
                ufile.mimetype in INSTAGRAM_AUDIO_FORMAT_ALLOWED or
                ufile.mimetype in INSTAGRAM_VIDEO_FORMAT_ALLOWED):
            return ufile
        data = ufile.read()
        try:
            if file_type == 'audio':
                output_io = self.convert_audio_to_mp4(data)
            else:
                output_io = self.convert_video_to_mp4(data)
            ufile = FileStorage(stream=output_io, filename=f'{file_type}.mp4', content_type=f'{file_type}/mp4')
        except Exception as e:
            _logger.error(e)
            ufile = FileStorage(stream=BytesIO(data), filename=ufile.filename, content_type=ufile.mimetype)
        return ufile

    def convert_audio_to_mp4(self, data):
        file_like = BytesIO(data)
        audio = pydub.AudioSegment.from_file(file_like)
        output_io = BytesIO()
        audio.export(output_io, format='mp4')
        return output_io

    def convert_video_to_mp4(self, data):
        output_io = BytesIO(data)
        encoder = pydub.utils.get_encoder_name()
        if encoder:
            in_file = NamedTemporaryFile(mode='wb', delete=False)
            in_file.write(data)
            in_file.seek(0)
            output = NamedTemporaryFile(mode='w+b', delete=False)
            conversion_command = [
                encoder, '-y', in_file.name,
                '-acodec', 'aac',
                '-vcodec', 'libx264',
                '-f', 'mp4', output.name
            ]
            with open(os.devnull, 'rb') as devnull:
                p = subprocess.Popen(conversion_command, stdin=devnull, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                _p_out, p_err = p.communicate()
            if p.returncode != 0:
                in_file.close()
                output.close()
                raise Exception(p_err.decode(errors='ignore'))
            output.seek(0)
            output_io = BytesIO(output.read())
            output.close()
            in_file.close()
        return output_io
