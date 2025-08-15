# -*- coding: utf-8 -*-
from odoo import models, fields, api


class AcruxChatConversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    tag_ids = fields.Many2many('acrux.chat.conversation.tag', string='Tags')
    note = fields.Text('Note')

    @api.model
    def get_fields_to_read(self):
        out = super().get_fields_to_read()
        out.extend(['tag_ids', 'note'])
        return out

    def build_dict(self, limit, offset=0):
        out = super().build_dict(limit, offset)
        Tags = self.env['acrux.chat.conversation.tag']
        for record in out:
            if record['tag_ids']:
                record['tag_ids'] = Tags.browse(record['tag_ids']).read(['id', 'name', 'color'])
        return out
