# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import UserError


class AcruxMergeChatsWizard(models.TransientModel):
    _name = 'acrux.chat.merge.chat.wizard'
    _description = 'ChatRoom Merge Chats'

    private_conversation = fields.Many2one('acrux.chat.conversation', string='Private Chat', readonly=True,
                                           ondelete='set null')
    connector_id = fields.Many2one('acrux.chat.connector', related='private_conversation.connector_id',
                                   string='Connector', store=True, readonly=True)
    normal_conversation = fields.Many2one('acrux.chat.conversation', string='Public Chat', required=True,
                                          domain=("[('connector_id', '=', connector_id),"
                                                  "('conv_type', '=', 'normal'),"
                                                  "('id', '!=', private_conversation)]"))

    @api.model
    def _ensure_table_exists(self):
        """Create the transient table when it is missing."""
        self.env.cr.execute('SELECT to_regclass(%s)', (self._table,))
        if self.env.cr.fetchone()[0]:
            return
        self.env.cr.execute(
            f'''
            CREATE TABLE IF NOT EXISTS "{self._table}" (
                id SERIAL NOT NULL PRIMARY KEY,
                create_date timestamp,
                create_uid int4,
                write_date timestamp,
                write_uid int4,
                private_conversation int4,
                connector_id int4,
                normal_conversation int4
            )
            '''
        )

    @api.model
    def default_get(self, fields_list):
        self._ensure_table_exists()
        return super().default_get(fields_list)

    def merge_chats(self):
        if not self.private_conversation:
            raise UserError(_('Required field is missing.'))
        Message = self.env['acrux.chat.message']
        domain = [('contact_id', '=', self.private_conversation.id)]
        Message.search(domain).write({'contact_id': self.normal_conversation.id})
        self.normal_conversation.write({'chat_id': self.private_conversation.number})
        if self.env.context.get('is_acrux_chat_room'):
            conv_delete_ids = self.private_conversation.read(['id', 'agent_id'])
            conv_data = self.normal_conversation.build_dict(22)
            self.normal_conversation._sendmany([
                (self.private_conversation.get_channel_to_many(), 'delete_taken_conversation', conv_delete_ids),
                (self.private_conversation.get_channel_to_many(), 'delete_conversation', conv_delete_ids),
                (self.private_conversation.get_channel_to_one(), 'init_conversation', conv_data)
            ])
            out = {
                'type': 'ir.actions.act_window',
                'res_model': self._name,
                'res_id': self.id,
                'view_mode': 'form',
                'target': 'new',
                'context': self.env.context,
            }
        else:
            out = {
                'type': 'ir.actions.act_window',
                'res_model': 'acrux.chat.conversation',
                'view_mode': 'form',
                'target': 'main',
                'res_id': self.normal_conversation.id,
                'views': [
                    (self.env.ref('whatsapp_connector.view_whatsapp_connector_conversation_form_admin').id, 'form'),
                ],
            }
        self.private_conversation.unlink()
        return out

    def _transient_clean_rows_older_than(self, seconds):
        """Ensure the transient table exists before letting the base logic clean it."""
        self._ensure_table_exists()
        return super()._transient_clean_rows_older_than(seconds)
