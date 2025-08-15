odoo.define("whatsapp_connector_tags.acrux_chat", (function(require) {
    "use strict";
    var AcruxChatAction = require("whatsapp_connector.acrux_chat").AcruxChatAction;
    return AcruxChatAction.include({
        destroy: function() {
            return $(".acrux-note-popover").remove(), this._super.apply(this, arguments);
        }
    }), AcruxChatAction;
})), odoo.define("whatsapp_connector_tags.conversation", (function(require) {
    "use strict";
    var config = require("web.config"), Conversation = require("whatsapp_connector.conversation"), _t = require("web.core")._t;
    return Conversation.include({
        events: _.extend({}, Conversation.prototype.events, {
            mouseenter: "_onMouseEnter",
            mouseleave: "_onMouseLeave"
        }),
        start: function() {
            return this._super().then((() => {
                this.note && this.$el.popover({
                    trigger: "manual",
                    animation: !0,
                    html: !0,
                    title: function() {
                        return _t("Note");
                    },
                    container: "body",
                    placement: "left",
                    template: '<div class="popover acrux-note-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
                }).on("inserted.bs.popover", (() => {
                    config.device.isMobile || setTimeout((() => this.fix_popover_position()), 50);
                }));
            }));
        },
        update: function(options) {
            this._super.apply(this, arguments), this.tag_ids = options.tag_ids || !1, this.note = options.note || !1;
        },
        fix_popover_position: function() {
            let popover = $(".acrux-note-popover");
            if (popover.length) {
                let data = this.$el[0].getBoundingClientRect(), left = data.left, width = data.width, transform = popover.css("transform");
                if (transform) {
                    let matrix = transform.replace(/[^0-9\-.,]/g, "").split(","), x = matrix[12] || matrix[4];
                    x = isNaN(x) ? 0 : x < 0 ? Math.abs(x) : -1 * x, popover.css("left", left + width + x);
                }
            }
        },
        _onMouseEnter: function(_ev) {
            this.note && (clearTimeout(this.note_timeout), this.note_timeout = setTimeout((() => {
                this.$el.is(":hover") && !$(".acrux-note-popover:visible").length && (this.$el.data("bs.popover").config.content = "<h5>" + this.note + "</h5>", 
                this.$el.popover("show"), $(".acrux-note-popover").on("mouseleave", (() => {
                    this.$el.trigger("mouseleave");
                })));
            }), 500));
        },
        _onMouseLeave: function(_ev) {
            if (this.note) {
                if ($(".acrux-note-popover:hover").length) return;
                this.$el.is(":hover") || this.$el.popover("hide");
            }
        }
    }), Conversation;
}));