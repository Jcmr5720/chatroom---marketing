from odoo import fields, models, api
from odoo.tools.translate import _
import logging

_logger = logging.getLogger(__name__)


class AcruxChatConversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    @api.model
    def get_product_fields_to_read(self):
        fields_search = super().get_product_fields_to_read()
        if 'quantity_in_location' in self.env['product.product']._fields:
            fields_search.extend([
                'quantity_in_location',
                'quantity_in_tulipanes',
                'quantity_in_neutron',
            ])
        return fields_search

    @api.model
    def search_product(self, string, filters=None, limit=32):
        result = super().search_product(string, filters=filters, limit=limit)

        products = result.get('products', [])
        if 'quantity_total' in self.env['product.product']._fields:
            stock_filter = (filters or {}).get('stock_filter', 'positive')
            if stock_filter == 'positive':
                products = [p for p in products if p.get('quantity_total', 0) > 0]
            elif stock_filter == 'negative':
                products = [p for p in products if p.get('quantity_total', 0) < 0]
        result['products'] = products
        categories = {
            prod['categ_id'][0]: prod['categ_id'][1]
            for prod in products
            if prod.get('categ_id')
        }
        result['categories'] = [
            {'id': cid, 'name': cname} for cid, cname in categories.items()
        ]
        return result
