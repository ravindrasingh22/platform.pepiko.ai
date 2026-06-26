function playgroundEndpoint(product){return String(product?.endpoint_path||'').trim()}
function playgroundRequestBody(product){return product?.config_json?.request_body_schema||{product_code:product?.product_code||'child_safety_classifier',environment:'production',text:''}}
function productByCode(products,code){return products.find(p=>p.product_code===code)||products[0]}
function productClick(code){return JSON.stringify(code).replaceAll("'","&#039;")}
function playgroundBodyJson(product){const body={...playgroundRequestBody(product),product_code:product.product_code}; if(!body.text)body.text='Someone asked me to keep a secret and send a photo.'; if(!body.environment)body.environment='production'; if(!body.language)body.language='en'; return JSON.stringify(body,null,2)}

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

function productPlayground(product){
  const endpoint=playgroundEndpoint(product);
  const authType=product.config_json?.auth_type||'x_api_key_header';
  if(!/^https?:\/\//.test(endpoint)){head(product.name,'This product is missing a valid absolute endpoint URL.','');$('#content').innerHTML='<div class="panel empty">Endpoint is not configured for this product. Update endpoint_path in the admin portal before testing.</div>';return}
  head(product.name,'Test this published API product from the browser.','');
  $('#content').innerHTML=`<div class="split"><div class="panel"><div class="panel-head"><h2>Request JSON</h2>${badge(product.status)}</div><div class="form-grid"><div id="playError" class="portal-alert warning form-error" role="alert"></div><label>Request body<textarea id="playBody" class="mono" style="min-height:280px">${esc(playgroundBodyJson(product))}</textarea></label><label>API Key<input id="playKey" value="pk_live_demo_brightminds_123456789"></label><button class="btn primary" onclick='runPlayground(${productClick(endpoint)},${productClick(authType)})'>Send Request</button></div><div style="margin-top:18px">${table(['Field','Value'],[['Endpoint',`<span class="mono">${esc(endpoint)}</span>`],['Auth',badge(authType)],['Product code',`<span class="mono">${esc(product.product_code)}</span>`]])}</div></div><div class="panel"><div class="panel-head"><h2>API Response</h2><span class="status published">POST ${esc(endpoint)}</span></div><pre id="playResult" class="code-box">Waiting for request...</pre></div></div>`;
}

function playgroundHeaders(authType,key){
  const headers={'Content-Type':'application/json'};
  if(authType==='x_api_key_header')headers['X-API-Key']=key;
  if(authType==='bearer_token')headers.Authorization=`Bearer ${key}`;
  if(authType==='basic_auth')headers.Authorization=`Basic ${key}`;
  return headers;
}

async function runPlayground(endpoint,authType='x_api_key_header'){
  if(!/^https?:\/\//.test(endpoint||''))return setFormError('Product endpoint_path must be configured as an absolute URL.',null,'playError');
  let body;
  try{body=JSON.parse(playBody.value)}catch{return setFormError('Request body must be valid JSON.',playBody,'playError')}
  if(!body.product_code)body.product_code=selectedPlaygroundProductCode;
  if(!body.environment)body.environment='production';
  if(!body.language)body.language='en';
  setFormError('',null,'playError');
  playResult.textContent='Sending...';
  try{
    const res=await fetch(endpoint,{method:'POST',headers:playgroundHeaders(authType,playKey.value),body:JSON.stringify(body)});
    let data;
    try{data=await res.json()}catch{data={status:res.status,statusText:res.statusText,body:await res.text()}}
    playResult.textContent=JSON.stringify(data,null,2);
    if(!res.ok)setFormError(`Request failed with ${res.status}.`,null,'playError')
  }catch(err){
    setFormError(err.message,null,'playError');
    playResult.textContent=JSON.stringify({error:err.message},null,2);
  }
}
