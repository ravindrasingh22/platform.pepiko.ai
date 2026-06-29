function runtimeAuthType(product){return product?.config_json?.authentication_type||product?.config_json?.auth_type||'x_api_key_header'}
function runtimeAuthHeader(authType){if(authType==='bearer_token')return 'Authorization: Bearer <token>'; if(authType==='basic_auth')return 'Authorization: Basic <credentials>'; if(authType==='none')return 'No authentication header'; return 'x-api-key: <api_key>'}
function runtimeBaseUrl(product){try{const url=new URL(product.endpoint_path); return `${url.protocol}//${url.host}`}catch{return 'https://api.pepiko.ai'}}
function runtimeCurl(product){const endpoint=String(product?.endpoint_path||'https://api.pepiko.ai/api/public/v1/classify'); const body=JSON.stringify(product?.config_json?.request_body_schema||{text:'Sample text',environment:'production'},null,2).replaceAll('\n','\\\n'); const auth=runtimeAuthHeader(runtimeAuthType(product)); return `curl -X POST '${endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -H '${auth}' \\\n  -d '${body}'`}
function runtimeSyncBadge(value){return badge(value||'unknown')}

async function apiAccess(){
  const products=await api('/api/customer/products');
  const rows=products.map(p=>{
    const product=products.find(x=>x.product_code===(p.product_code||p.code))||p;
    return {...product,...p};
  });
  head('API Access','Products your organization can call through the Pepiko runtime gateway. Access is read-only from the customer portal.','<button class="btn" onclick="showPage(\'playground\')">Open Playground</button>');
  $('#content').innerHTML=`<div class="grid kpi-grid">${rows.map(p=>`<div class="kpi-card"><div class="kpi-icon">◇</div><div><div class="kpi-title">${esc(p.category||'API product')}</div><div class="kpi-value" style="font-size:18px">${esc(p.name||p.product_code)}</div><div class="kpi-delta">${runtimeSyncBadge(p.access_status||p.status||'enabled')}</div></div></div>`).join('')}</div><div class="panel" style="margin-top:18px"><h2>Runtime product access</h2>${table(['Product','Access','Environment','Header','Base URL','Playground'],rows.map(p=>[
    esc(p.name||p.product_code),
    badge(p.access_status||p.status||'enabled'),
    esc((p.allowed_environments||p.environments||[p.environment||'production']).join(', ')),
    `<span class="mono">${esc(runtimeAuthHeader(runtimeAuthType(p)))}</span>`,
    `<span class="mono">${esc(runtimeBaseUrl(p))}</span>`,
    `<button class="btn sm" onclick='showProductPlayground(${JSON.stringify(p.product_code).replaceAll("'","&#039;")})'>Test</button>`
  ]))}</div><div class="panel" style="margin-top:18px"><h2>Examples</h2>${rows.map(p=>`<div class="alert"><strong>${esc(p.name||p.product_code)}</strong><pre class="code-box" style="min-height:auto;margin-top:12px">${esc(runtimeCurl(p))}</pre></div>`).join('')}</div>`;
}

async function planLimits(){
  const billingData=await api('/api/customer/billing');
  const data={organization:billingData.organization,plan:billingData.plan,wallet:billingData.wallet,usage:billingData.usage,products:billingData.product_pricing};
  const included=Number(data.plan?.included_credits||0);
  const used=Number(data.usage?.credits_used||0);
  const pct=included?Math.min(100,Math.round((used/included)*100)):0;
  head('Plan & Limits','Current plan, quota, included API products, and account limits.','<button class="btn" onclick="showPage(\'support\')">Contact Support</button>');
  $('#content').innerHTML=`<div class="grid kpi-grid"><div class="kpi-card"><div class="kpi-icon">◉</div><div><div class="kpi-title">Current plan</div><div class="kpi-value" style="font-size:22px">${esc(data.plan?.name||data.organization?.plan_code||'-')}</div></div></div><div class="kpi-card"><div class="kpi-icon">⇄</div><div><div class="kpi-title">Included credits</div><div class="kpi-value">${money(included)}</div></div></div><div class="kpi-card"><div class="kpi-icon">▣</div><div><div class="kpi-title">Used credits</div><div class="kpi-value">${money(used)}</div></div></div></div><div class="split" style="margin-top:18px"><div class="panel"><h2>Quota progress</h2><div class="progress"><span style="width:${pct}%"></span></div><p class="small muted">${money(used)} used of ${money(included)} included credits.</p>${table(['Limit','Value'],[['Daily request limit',money(data.daily_limit||data.limits?.daily_limit||'-')],['Monthly quota',money(data.monthly_limit||included||'-')],['Overage behavior',esc(data.overage_behavior||'contact support')],['Hard blocking',data.hard_block?badge('enabled'):badge('not configured')]])}</div><div class="panel"><h2>Included products</h2>${table(['Product','Credits','Rate limit','Status'],(data.products||[]).map(p=>[esc(p.name||p.product_code),money(p.base_credits),money(p.request_limit_per_minute||data.daily_limit||'-'),badge(p.status||'published')]))}</div></div>`;
}
