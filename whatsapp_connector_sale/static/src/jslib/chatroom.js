odoo.define('@632971da7db6c645b0ada45222be7593b67278059796eba2a6c9b69b45acda99',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const{onWillDestroy}=owl
const SaleForm=__exports.SaleForm=class SaleForm extends ChatroomActionTab{setup(){super.setup()
this.env;this.props
this.env.chatBus.on('productDragInit',this,()=>{this.elRef.el.classList.add('drop-active')})
this.env.chatBus.on('productDragging',this,({x,y})=>{if(this.isInside(x,y)){this.elRef.el.classList.add('drop-hover')}else{this.elRef.el.classList.remove('drop-hover')}})
this.env.chatBus.on('productDragEnd',this,()=>{this.elRef.el.classList.remove('drop-active')
this.elRef.el.classList.remove('drop-hover')})
this.env.chatBus.on('productDrop',this,async({x,y,product})=>{if(this.isInside(x,y)&&this.props.selectedConversation&&this.props.selectedConversation.isMine()){this.env.chatBus.trigger('chatroomAddToOrder',product)}})
onWillDestroy(this.destroy.bind(this))}
destroy(){this.env.chatBus.off('productDragInit',this)
this.env.chatBus.off('productDragEnd',this)
this.env.chatBus.off('productDragging',this)
this.env.chatBus.off('productDrop',this)}
getExtraContext(props){const context=Object.assign(super.getExtraContext(props),{default_partner_id:props.selectedConversation.partner.id,})
if(props.selectedConversation.team.id){context['default_team_id']=props.selectedConversation.team.id}
return context}
async onSave(record){await super.onSave(record)
if(record.data.id!==this.props.selectedConversation.sale.id){await this.env.services.orm.write(this.env.chatModel,[this.props.selectedConversation.id],{sale_order_id:record.data.id},{context:this.env.context})
this.props.selectedConversation.updateFromJson({sale_order_id:[record.data.id,record.data.name]})
this.env.chatBus.trigger('updateConversation',this.props.selectedConversation)}}
_getOnSearchChatroomDomain(){let domain=super._getOnSearchChatroomDomain()
domain.push(['conversation_id','=',this.props.selectedConversation.id])
if(this.props.selectedConversation.partner.id){domain.unshift('|')
domain.push(['partner_id','=',this.props.selectedConversation.partner.id])}
return domain}}
SaleForm.props=Object.assign({},SaleForm.props)
SaleForm.defaultProps=Object.assign({},SaleForm.defaultProps)
patch(SaleForm.props,'chatroomSaleProps',{selectedConversation:{type:ConversationModel.prototype},viewModel:{type:String,optional:true},viewType:{type:String,optional:true},viewKey:{type:String,optional:true},})
patch(SaleForm.defaultProps,'chatroomSaleDefaultProps',{viewModel:'sale.order',viewType:'form',viewKey:'sale_form',})
return __exports;});;
odoo.define('@b671e91bb53678d42f1daf4106332bc764bc90465e8fd7e23dee595096f31e8f',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{Chatroom}=require('@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6')
const chatroomSale={setup(){this._super()
this.saleAllowed=false},getSubEnv(){const out=this._super()
out.saleAllowed=()=>this.saleAllowed
return out},async willStart(){await this._super()
this.saleAllowed=await this.env.services.user.hasGroup('sales_team.group_sale_salesman')
this.saleFormView=await this.getSaleFormView()},async getSaleFormView(){const{orm}=this.env.services
const data=await orm.call(this.env.chatModel,'check_object_reference',['_sale','acrux_whatsapp_sale_order_form_view'],{context:this.context})
return data[1]}}
patch(Chatroom.prototype,'chatroomSale',chatroomSale)
return __exports;});;
odoo.define('@32ecc8c256ae0091350dd8e2d61df3d02e13061a3062844560a628a40582f9ab',async function(require){'use strict';let __exports={};const{formatMonetary}=require('@web/views/fields/formatters')
const{loadJS}=require('@web/core/assets')
const{Component,onWillStart,useEffect,useRef,onWillUpdateProps,markup}=owl
const SaleIndicator=__exports.SaleIndicator=class SaleIndicator extends Component{setup(){super.setup()
this.env
this.canvasRef=useRef('canvas')
this.monthLastSaleData=null
this.htmlLastSale=null
this.chart=null
onWillStart(this.willStart.bind(this))
onWillUpdateProps(this.onWillUpdateProps.bind(this))
useEffect(()=>{this.renderChart()
return()=>{if(this.chart){this.chart.destroy()}}})}
async willStart(){await this.getPartnerIndicator(this.props)
return loadJS('/web/static/lib/Chart/Chart.js')}
async onWillUpdateProps(nextProps){await this.getPartnerIndicator(nextProps)}
async getPartnerIndicator(props){const result=await this.env.services.orm.call('res.partner','get_chat_indicators',[[props.partnerId]],{context:this.env.context},)
if(result['6month_last_sale_data']){this.monthLastSaleData=result['6month_last_sale_data'];}
if(result['html_last_sale']){this.htmlLastSale=markup(result['html_last_sale'])}}
renderChart(){if(this.monthLastSaleData){const config=this._getBarChartConfig()
this.chart=new Chart(this.canvasRef.el,config)}}
_getBarChartConfig(){var data=[]
var backgroundColor=['#FFD8E1','#FFE9D3','#FFF3D6','#D3F5F5','#CDEBFF','#E6D9FF']
var borderColor=['#FF3D67','#FF9124','#FFD36C','#60DCDC','#4CB7FF','#A577FF']
var labels=[]
let data_param=this.monthLastSaleData
data_param[0].values.forEach(pt=>{data.push(pt.value)
labels.push(pt.label)})
return{type:'bar',data:{labels:labels,datasets:[{data:data,fill:'start',label:data_param[0].key,backgroundColor:backgroundColor,borderColor:borderColor,}]},options:{legend:{display:false},scales:{yAxes:[{display:false}],},maintainAspectRatio:false,tooltips:{intersect:false,position:'nearest',caretSize:0,callbacks:{label:(tooltipItem,data)=>{var label=data.datasets[tooltipItem.datasetIndex].label||''
if(label){label+=': '}
label+=formatMonetary(tooltipItem.yLabel,{currencyId:this.env.getCurrency()})
return label}}},elements:{line:{tension:0.000001}},},}}}
Object.assign(SaleIndicator,{template:'chatroom.SaleIndicator',props:{partnerId:Number}})
return __exports;});;
odoo.define('@dc4f0d88697ef04cf330aaae2f9e0998b42d63fdd99c2b6d9aca525143ff01aa',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{TabsContainer}=require('@af0df1a5affde864bfaca0edba19137ac4e7199f2cb7ae310c45d7b47aaac68b')
const{SaleForm}=require('@632971da7db6c645b0ada45222be7593b67278059796eba2a6c9b69b45acda99')
const{SaleIndicator}=require('@32ecc8c256ae0091350dd8e2d61df3d02e13061a3062844560a628a40582f9ab')
const chatroomSaleTab={setup(){this._super()
this.env;this.props
this.comp.SaleForm=SaleForm
this.emptyPartnerMsg=this.env._t('This conversation does not have a partner.')},computeFormProps(props){this._super(props)
this.compProps.SaleForm=this.getTabSaleProps(props)},getTabSaleProps(nextProps){return{viewTitle:this.env._t('Order'),viewResId:nextProps?.selectedConversation?.sale?.id,selectedConversation:nextProps?.selectedConversation,searchButton:true,viewId:nextProps.saleFormView,}},}
patch(TabsContainer.prototype,'chatroomSaleTab',chatroomSaleTab)
patch(TabsContainer.components,'chatroomSaleTabComponents',{SaleForm,SaleIndicator,})
patch(TabsContainer.props,'chatroomSaleTabProps',{saleFormView:{type:Number,optional:true},})
return __exports;});;
odoo.define('@094d8ecf596063d29aaf300ee5d932cb5c1f033cb570e636cba5aebbf986e346',async function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const chatroomSale={constructor(comp,base){this._super(comp,base)
this.sale={id:0,name:''}},updateFromJson(base){this._super(base)
if('sale_order_id'in base){this.sale=this.convertRecordField(base.sale_order_id)}}}
patch(ConversationModel.prototype,'chatroomSale',chatroomSale)
return __exports;});;
odoo.define('@a724fcbfc24204ab570d7c1acd0ccfedc584b7f0575156f45bd704f9108d5bdc',async function(require){'use strict';let __exports={};const{FormRenderer}=require('@web/views/form/form_renderer')
const{onWillDestroy}=owl
const SaleFormRenderer=__exports.SaleFormRenderer=class SaleFormRenderer extends FormRenderer{setup(){super.setup()
this.env.chatBus.on('chatroomAddToOrder',this,async product=>{const context={...this.env.services.user.context,default_product_id:parseInt(product.id)}
const newLine=await this.props.record.data.order_line.addNew({context,mode:'edit',position:'bottom',})
await newLine.switchMode('readonly')})
onWillDestroy(()=>this.env.chatBus.off('chatroomAddToOrder',this))}}
return __exports;});;
odoo.define('@977bb89d9bc10ec30edfc528d73c0b889b6ff0421ab6669d0b8feb4ff3d14904',async function(require){'use strict';let __exports={};const{registry}=require('@web/core/registry')
const{formView}=require('@web/views/form/form_view')
const{SaleFormRenderer}=require('@a724fcbfc24204ab570d7c1acd0ccfedc584b7f0575156f45bd704f9108d5bdc')
const SaleFormView=__exports.SaleFormView={...formView,Renderer:SaleFormRenderer,}
registry.category('views').add('acrux_whatsapp_sale_order',SaleFormView)
return __exports;});;
