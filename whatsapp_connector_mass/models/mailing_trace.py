# -*- coding: utf-8 -*-

from odoo import fields, models, api


class MailingTrace(models.Model):
    _inherit = 'mailing.trace'

    ref_name = fields.Char(compute='_compute_ref_name', string='Recipient', store=True)
    # 15 sent_datetime > 14 sent
    # 15 trace_status (error) > 14 state (exception)
    trace_type = fields.Selection(selection_add=[('whatsapp', 'Whatsapp')],
                                  ondelete={'whatsapp': 'set default'})
    ws_message_id = fields.Many2one('acrux.chat.message', string='Whatsapp Message',
                                    index=True, ondelete='set null')
    ws_error_msg_trace = fields.Char()
    ws_error_msg = fields.Char('Error', compute='_compute_ws_error_msg', store=True)
    ws_phone = fields.Char('Phone')
    schedule_date = fields.Datetime(
        related='mass_mailing_id.schedule_date',
        string='Scheduled',
        store=True,
    )

    # some odoo versions removed the ``state`` field from ``mailing.trace``.
    # the views of this module still rely on it, so recreate a compatible
    # computed version based on the dates of delivery events.
    state = fields.Selection(
        [
            ('outgoing', 'Outgoing'),
            ('sent', 'Sent'),
            ('bounced', 'Bounced'),
            ('exception', 'Failed'),
        ],
        compute='_compute_state',
        store=True,
        readonly=True,
    )

    @api.depends('model', 'res_id')
    def _compute_ref_name(self):
        for rec in self:
            ref_name = False
            if rec.model and rec.res_id:
                record = self.env.get(rec.model, False)
                if record and hasattr(record, 'name'):
                    ref_name = record.search([('id', '=', rec.res_id)], limit=1).name
            rec.ref_name = ref_name

    @api.depends('ws_message_id.error_msg', 'ws_error_msg_trace')
    def _compute_ws_error_msg(self):
        for rec in self:
            rec.ws_error_msg = rec.ws_message_id.error_msg or rec.ws_error_msg_trace

    @api.depends('sent', 'bounced', 'exception')
    def _compute_state(self):
        for rec in self:
            if rec.bounced:
                rec.state = 'bounced'
            elif rec.exception:
                rec.state = 'exception'
            elif rec.sent:
                rec.state = 'sent'
            else:
                rec.state = 'outgoing'

    def action_view_contact(self):
        # from O15
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'res_model': self.model,
            'target': 'current',
            'res_id': self.res_id
        }
