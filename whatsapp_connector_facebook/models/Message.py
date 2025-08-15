# -*- coding: utf-8 -*-

import json
import requests
import base64
from odoo import models, _, fields, api
from odoo.exceptions import ValidationError

INSTAGRAM_AUDIO_FORMAT_ALLOWED = ['audio/x-wav', 'audio/mp4', 'audio/wav', 'audio/wave', 'audio/aac', 'audio/x-m4a',
                                  'audio/m4a']
INSTAGRAM_VIDEO_FORMAT_ALLOWED = ['video/x-msvideo', 'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg',
                                  'video/avi']


class Message(models.Model):
    _inherit = 'acrux.chat.message'

    ttype = fields.Selection(selection_add=[('url', 'URL')],
                             ondelete={'url': 'cascade'})
    url_due = fields.Boolean('Url is Due?', default=False)
    custom_url = fields.Char('Custom URL')

    def get_url_attach(self, att_id):
        attach_id, url = super(Message, self).get_url_attach(att_id)
        if attach_id and attach_id.mimetype and self.connector_id.is_instagram():
            allowed_formats = []
            if attach_id.mimetype.startswith('audio'):
                allowed_formats = INSTAGRAM_AUDIO_FORMAT_ALLOWED
            elif attach_id.mimetype.startswith('video'):
                allowed_formats = INSTAGRAM_VIDEO_FORMAT_ALLOWED
            if allowed_formats and attach_id.mimetype not in allowed_formats:
                file_type = attach_id.mimetype.split('/')[0]
                raise ValidationError(_('Only %s formats are allowed. Try to install pydub and ffmpeg '
                                        'libraries (In debian distros pip install pydub and apt install ffmpeg).')
                                      % file_type)
        return attach_id, url

    def message_parse(self):
        '''
            :overide
            :todo resolver messaging_type
            https://developers.facebook.com/docs/messenger-platform/send-messages
            https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags
        '''
        self.ensure_one()
        out = super(Message, self).message_parse()
        if self.connector_id.is_owner_facebook() and not self.connector_id.is_waba_extern():
            out['messaging_type'] = 'RESPONSE'
            if self.connector_id.is_facebook():
                if out['type'] not in ('text', 'image', 'video', 'audio', 'file'):
                    raise ValidationError(_('Message type is not supported.'))
            elif self.connector_id.is_instagram():
                if out['type'] not in ('text', 'image', 'video', 'audio'):
                    raise ValidationError(_('Message type is not supported.'))
            if out['type'] in ('image', 'video', 'file') and out.get('text', ''):
                raise ValidationError(_('Text in this message is not supported.'))
        return out

    def message_check_allow_send(self):
        super(Message, self).message_check_allow_send()
        if self.connector_id.is_owner_facebook() and not self.connector_id.is_waba_extern():
            self.message_check_time()

    @api.model
    def get_fields_to_read(self):
        out = super(Message, self).get_fields_to_read()
        out.append('url_due')
        out.append('custom_url')
        return out

    def post_create_from_json(self, data):
        super(Message, self).post_create_from_json(data)
        if self.ttype == 'url':
            self.custom_url = data['url']

    def check_url_due(self):
        self.ensure_one()
        datas = None
        mime = None
        try:
            req = requests.get(self.custom_url)
            if req.status_code == 200:
                datas = base64.b64encode(req.content).decode('ascii')
                if '; ' in req.headers['Content-Type']:
                    mime = req.headers['Content-Type'].split('; ')[0]
                else:
                    mime = req.headers['Content-Type']
            else:
                self.url_due = True
        except Exception:
            self.url_due = True
        return {
            'url_due': self.url_due,
            'mime': mime,
            'data': datas
        }

    def clean_content(self):
        message_url = self.filtered(lambda msg: msg.ttype == 'url')
        message_url.write({'url': False})
        return super(Message, self - message_url).clean_content()

    def set_template_data(self, message):
        self.ensure_one()
        if self.connector_id.is_waba_extern():
            message['template_id'] = self.template_waba_id.name
            params = json.loads(self.template_params)
            message['params'] = params['params']
            message['template_lang'] = self.template_waba_id.language_code
        else:
            return super(Message, self).set_template_data(message)
