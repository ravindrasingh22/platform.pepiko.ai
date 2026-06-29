async function myOrg(){
  head('My Org','Organization profile and account configuration.','');
  const d=await api('/api/customer/me');
  const org=d.organization||{};
  $('#content').innerHTML=`<div class="grid kpi-grid"><div class="kpi-card"><div class="kpi-icon">●</div><div><div class="kpi-title">Status</div><div class="kpi-value" style="font-size:22px">${badge(org.status||'unknown')}</div></div></div><div class="kpi-card"><div class="kpi-icon">◉</div><div><div class="kpi-title">Plan</div><div class="kpi-value" style="font-size:22px">${esc(org.plan_code||'-')}</div></div></div><div class="kpi-card"><div class="kpi-icon">▣</div><div><div class="kpi-title">Billing</div><div class="kpi-value" style="font-size:22px">${esc(org.billing_mode||'-')}</div></div></div><div class="kpi-card"><div class="kpi-icon">⌖</div><div><div class="kpi-title">Region</div><div class="kpi-value" style="font-size:22px">${esc(org.region||'-')}</div></div></div></div><div class="split" style="margin-top:18px"><div class="panel"><h2>Organization information</h2>${table(['Field','Value'],[['Name',esc(org.name||'-')],['Slug',`<span class="mono">${esc(org.slug||'-')}</span>`],['Status',badge(org.status||'-')],['Plan',esc(org.plan_code||'-')],['Billing mode',esc(org.billing_mode||'-')],['Region',esc(org.region||'-')],['Created',date(org.created_at)],['Updated',date(org.updated_at)]])}</div><div class="panel"><h2>Account owner</h2>${table(['Field','Value'],[['Signed in as',esc(d.user?.name||'-')],['Email',esc(d.user?.email||'-')],['Role',badge(d.user?.role||'-')],['MFA required',d.user?.mfa_required?badge('yes'):badge('no')],['Last login',date(d.user?.last_login_at)]])}</div></div>`;
}

async function accountSettings(){
  head('Account Settings','Manage your user profile and password.','');
  const d=await api('/api/customer/me');
  $('#content').innerHTML=`<div class="panel" style="padding:0;overflow:hidden"><div class="modal-titlebar"><div><div class="eyebrow">User account</div><h2>Account settings</h2><p>Update your portal profile and password. Email and role are controlled by your organization administrators.</p></div></div><div class="user-form-card"><div id="profileFormError" class="portal-alert warning form-error" role="alert"></div><div class="user-form-section"><div class="section-title"><h3>Profile</h3><p>This information identifies your actions in team and audit views.</p></div><div><div class="form-grid two-col"><label class="form-field">Name<input id="as_name" value="${esc(d.user?.name||'')}"></label><label class="form-field">Email<input value="${esc(d.user?.email||'')}" disabled></label><label class="form-field">Role<input value="${esc(d.user?.role||'')}" disabled></label></div><div style="margin-top:16px"><button class="btn primary" onclick="saveAccountProfile()">Save Profile</button></div></div></div><div id="passwordFormError" class="portal-alert warning form-error" role="alert"></div><div class="user-form-section"><div class="section-title"><h3>Password</h3><p>Use at least 8 characters. You must enter your current password before setting a new one.</p></div><div><div class="form-grid two-col"><label class="form-field">Current password<input id="as_current_password" type="password" autocomplete="current-password"></label><label class="form-field">New password<input id="as_new_password" type="password" autocomplete="new-password"></label><label class="form-field">Confirm new password<input id="as_confirm_password" type="password" autocomplete="new-password"></label></div><div style="margin-top:16px"><button class="btn primary" onclick="changeAccountPassword()">Change Password</button></div></div></div></div></div>`;
}

async function saveAccountProfile(){
  if(!as_name.value.trim())return setFormError('Name is required.',as_name,'profileFormError');
  const data=await api('/api/customer/me/profile',{method:'PUT',body:JSON.stringify({name:as_name.value.trim()})});
  user={...user,name:data.name};
  localStorage.setItem('pepiko_customer_user',JSON.stringify(user));
  shell();
  await showPage('accountSettings',{replace:true});
  setStatus('Your account profile was updated.','success');
}

async function changeAccountPassword(){
  if(!as_current_password.value)return setFormError('Current password is required.',as_current_password,'passwordFormError');
  if(!as_new_password.value||as_new_password.value.length<8)return setFormError('New password must be at least 8 characters.',as_new_password,'passwordFormError');
  if(as_new_password.value!==as_confirm_password.value)return setFormError('New passwords do not match.',as_confirm_password,'passwordFormError');
  await api('/api/customer/me/password',{method:'PUT',body:JSON.stringify({current_password:as_current_password.value,new_password:as_new_password.value})});
  as_current_password.value='';
  as_new_password.value='';
  as_confirm_password.value='';
}
