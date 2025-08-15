odoo.define('@0a61f12f360213c6df5052b3b539fa09f797d47c74565cc71c7d8d0535f91c71',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const chatroomActionTabFacebook={_contextHook(context){this._super(context)
if(['res.partner','crm.lead'].includes(this.props.viewModel)&&this.props.selectedConversation&&this.props.selectedConversation.isOwnerFacebook()&&!this.props.selectedConversation.isWabaExtern()){if('default_mobile'in context){delete context.default_mobile}
if('default_phone'in context){delete context.default_phone}}}}
patch(ChatroomActionTab.prototype,'chatroomActionTabFacebook',chatroomActionTabFacebook)
return __exports;});;
odoo.define('@1daa7e2ee803ab10df17b4fa7517bd18bf83e9650d381ab3ede961deb8a0b8b6',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{Dialog}=require('@web/core/dialog/dialog')
const{Message}=require('@cd88eb6ddbd39307a4d8acd1cff882374d40d987a801fff227eb08b73df94690')
const{Component,xml}=owl
const StoryDialog=__exports.StoryDialog=class StoryDialog extends Component{static template=xml`
<Dialog size="'lg'" fullscreen="true" bodyClass="'text-center'" title="props.title">
    <div href=""
        t-attf-style="background-image:url('{{props.url}}');width: auto;height: auto;"
        t-attf-data-mimetype="{{props.mime}}"
        class="o_Attachment_image o_image o-attachment-viewable o-details-overlay o-medium">
        <img t-attf-src="{{props.url}}" style="visibility: hidden;max-width: 100%; max-height: calc(100vh/1.5);" />
    </div>
</Dialog>`;static components={Dialog}
static props={close:{type:Function,optional:true},mime:String,url:String,title:String,}}
const messageFacebook={openStoryImage(){const{mime,data}=this.props.message.resModelObj
const url=`data:${mime};base64,${data}`
this.env.services.dialog.add(StoryDialog,{url,mime,title:this.env._t('Story')})},}
patch(Message.prototype,'messageFacebook',messageFacebook)
return __exports;});;
odoo.define('@fa643681e81d9f790282407fe00e8d677c831b7754e1b2f464b74d35cf22263b',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{Toolbox}=require('@c011635ccdcd3301f40c07724a28d782d0f498e544a6747890cf878476644d9c')
const toolboxFacebook={needDisableInput(attachment){let out
if(this.props.selectedConversation&&this.props.selectedConversation.isOwnerFacebook()){if(this.props.selectedConversation.isWabaExtern()){out=attachment.mimetype.includes('audio')}else{out=true}}else{out=this._super(attachment)}
return out},}
patch(Toolbox.prototype,'toolboxFacebook',toolboxFacebook)
return __exports;});;
odoo.define('@3ea39cb44fe9dcb349c1862762d0bf1619f4d2978af103c6d47a0a697a7f5cce',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const conversationFacebook={isOwnerFacebook:function(){return['facebook','instagram','waba_extern'].includes(this.connectorType)},isWabaExtern:function(){return this.connectorType==='waba_extern'},getIconClass:function(){let out=''
if(this.connectorType==='facebook'){out='acrux_messenger'}else if(this.connectorType==='instagram'){out='acrux_instagram'}else if(this.isWabaExtern()){out='acrux_whatsapp'}else{out=this._super()}
return out},}
patch(ConversationModel.prototype,'conversationFacebook',conversationFacebook)
return __exports;});;
odoo.define('@c0027d013a4e5ca2845cac3e8a62d43a1383c4cdf8badb75d455101bfc15368c',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{MessageModel}=require('@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a')
const messageFacebook={constructor(comp,base){this._super(comp,base)
this.urlDue=false
this.customUrl=''},updateFromJson(base){this._super(base)
if('url_due'in base){this.urlDue=base.url_due}
if('custom_url'in base){this.customUrl=base.custom_url}
if(this.ttype==='url'&&this.text){const subTypes={story_mention:this.env._t('A story mention you.')}
if(this.text in subTypes){this.text=subTypes[this.text]}}},async buildExtraObj(){await this._super()
if(this.ttype==='url'){this.resModelObj={}
if(!this.urlDue){const data=await this.env.services.orm.call('acrux.chat.message','check_url_due',[this.id],{context:this.env.context})
this.urlDue=data.url_due
if(!this.urlDue){this.resModelObj=data}}}},canBeAnswered:function(){return this._super()&&(!this.conversation.isOwnerFacebook()||this.conversation.isWabaExtern())},canBeDeleted:function(){return this._super()&&!this.conversation.isOwnerFacebook()},}
patch(MessageModel.prototype,'messageFacebook',messageFacebook)
return __exports;});;
