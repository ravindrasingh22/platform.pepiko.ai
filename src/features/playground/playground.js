function playgroundEndpoint(product){return String(product?.endpoint_path||'').trim()}
function playgroundRequestBody(product){return product?.config_json?.request_body_schema||{product_code:product?.product_code||'child_safety_classifier',environment:'production',text:''}}
function productByCode(products,code){return products.find(p=>p.product_code===code)||products[0]}
function productClick(code){return JSON.stringify(code).replaceAll("'","&#039;")}
function playgroundBodyJson(product){const body={...playgroundRequestBody(product),product_code:product.product_code}; if(!body.text)body.text='Someone asked me to keep a secret and send a photo.'; if(!body.environment)body.environment='production'; if(!body.language)body.language='en'; return JSON.stringify(body,null,2)}
function shellQuote(value){return `'${String(value||'').replaceAll("'","'\"'\"'")}'`}
function playgroundCurl(endpoint,authType,bodyText){
  let parsed={}; try{parsed=JSON.parse(bodyText||'{}')}catch{parsed={text:'Enter valid JSON before copying cURL.'}}
  const body=JSON.stringify(parsed,null,2);
  const authHeader=authType==='none'?'':authType==='bearer_token'?" \\\n  -H 'Authorization: Bearer <API_KEY>'":authType==='basic_auth'?" \\\n  -H 'Authorization: Basic <API_KEY>'":" \\\n  -H 'x-api-key: <API_KEY>'";
  return `curl -X POST ${shellQuote(endpoint)} \\\n  -H 'Content-Type: application/json'${authHeader} \\\n  -d ${shellQuote(body)}`;
}
function refreshPlaygroundCurl(endpoint,authType){const target=$('#playCurl'); if(target)target.textContent=playgroundCurl(endpoint,authType,$('#playBody')?.value||'{}')}
function copyPlaygroundCurl(){copyText($('#playCurl')?.textContent||'','cURL request copied.')}

async function playground(){
  const products=await api('/api/customer/products');
  cache.products=products;
  hydratePlaygroundProductNav(products);
  const requestedProductCode=selectedPlaygroundProductCode;
  const product=productByCode(products,selectedPlaygroundProductCode);
  if(!product){head('API Playground','No published API products are available for this account.','');$('#content').innerHTML='<div class="panel empty">No published products yet</div>';return}
  if(requestedProductCode){selectedPlaygroundProductCode=product.product_code; if(product.product_code!==requestedProductCode)history.replaceState({page:'playground',productCode:product.product_code},'',routeForPage('playground',product.product_code)); return productPlayground(product)}
  selectedPlaygroundProductCode='';
  head('API Playground','Choose a published Pepiko API product from the left navigation to test it.','');
  $('#content').innerHTML=`<div class="grid kpi-grid">${products.map(p=>`<button class="kpi-card" onclick='showProductPlayground(${productClick(p.product_code)})' type="button"><div class="kpi-icon">▣</div><div><div class="kpi-title">${esc(p.category)}</div><div class="kpi-value" style="font-size:18px">${esc(p.name)}</div><div class="kpi-delta">${esc(p.product_code)}</div></div></button>`).join('')}</div>`;
}

async function productPlayground(product){
  const endpoint=playgroundEndpoint(product);
  const authType=product.config_json?.auth_type||'x_api_key_header';
  if(!/^https?:\/\//.test(endpoint)){head(product.name,'This product is missing a valid absolute endpoint URL.','');$('#content').innerHTML='<div class="panel empty">Endpoint is not configured for this product. Update endpoint_path in the admin portal before testing.</div>';return}
  const apiKeys=await apiOptional('/api/customer/runtime/playground/api-keys',[]);
  const keyOptions=apiKeys.map(k=>`<option value="${k.id}">${esc(k.label||`${k.name} : ${k.environment}`)}</option>`).join('');
  const keySelect=authType==='none'?'':`<label>API key<select id="playKeyId" ${apiKeys.length?'':'disabled'}>${keyOptions}</select></label>`;
  const disabled=!apiKeys.length&&authType!=='none'?'disabled':'';
  const keyNotice=!apiKeys.length&&authType!=='none'?'<div class="portal-alert warning" style="display:flex">No active API key is available. Create or rotate an API key before sending a playground request.</div>':'';
  head(product.name,'Test this published API product from the browser.','');
  $('#content').innerHTML=`<div class="split"><div class="panel"><div class="panel-head"><h2>Request</h2>${badge(product.status)}</div><div class="form-grid"><div id="playError" class="portal-alert warning form-error" role="alert"></div>${keyNotice}${keySelect}<label>Text / JSON input<textarea id="playBody" class="mono" style="min-height:280px">${esc(playgroundBodyJson(product))}</textarea></label><button class="btn primary" ${disabled} onclick='runPlayground(${productClick(product.product_code)},${productClick(authType)})'>Send Request</button></div><div class="panel" style="margin-top:18px"><div class="panel-head"><h2>cURL request</h2><button class="btn sm" onclick="copyPlaygroundCurl()">⧉ Copy</button></div><pre id="playCurl" class="code-box" style="min-height:auto"></pre></div></div><div class="panel"><div class="panel-head"><h2>Response</h2><button class="btn sm" onclick="copyText($('#playResult')?.textContent||'','Response copied.')">⧉ Copy</button></div><pre id="playResult" class="code-box">Waiting for request...</pre></div></div>`;
  refreshPlaygroundCurl(endpoint,authType);
  $('#playBody')?.addEventListener('input',()=>refreshPlaygroundCurl(endpoint,authType));
}

function playgroundHeaders(authType,key){
  const headers={'Content-Type':'application/json'};
  if(authType==='x_api_key_header'||authType==='key_auth')headers['x-api-key']=key;
  if(authType==='bearer_token')headers.Authorization=`Bearer ${key}`;
  if(authType==='basic_auth')headers.Authorization=`Basic ${key}`;
  return headers;
}

async function runPlayground(productCode,authType='x_api_key_header'){
  let body;
  try{body=JSON.parse(playBody.value)}catch{return setFormError('Request body must be valid JSON.',playBody,'playError')}
  if(!body.product_code)body.product_code=selectedPlaygroundProductCode;
  if(!body.environment)body.environment='production';
  if(!body.language)body.language='en';
  setFormError('',null,'playError');
  playResult.textContent='Sending...';
  try{
    const selectedKeyId=$('#playKeyId')?.value?Number($('#playKeyId').value):null;
    const data=await api('/api/customer/runtime/playground/request',{method:'POST',successMessage:'Request completed.',body:JSON.stringify({product_code:productCode,request_body:body,api_key_id:selectedKeyId})});
    playResult.textContent=JSON.stringify(data,null,2);
    if(data && data.ok===false)setFormError(`Request failed with ${data.status}.`,null,'playError')
  }catch(err){
    setFormError(err.message,null,'playError');
    playResult.textContent=JSON.stringify({error:err.message},null,2);
  }
}
