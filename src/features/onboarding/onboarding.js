let onboardingState = {
  account: {},
  organization: {},
  useCase: "AI tutor / learning assistant",
  apiKey: null,
  invites: [],
};

function renderRegistration() {
  document.body.innerHTML = `<main class="registration-layout">
  <section class="registration-left">
    <div class="login-brand"><a class="brand" href="#" onclick="event.preventDefault();renderLogin()">pepiko<span class="brand-ai">.ai</span></a><span class="portal-label">Customer Portal</span></div>
    <form class="registration-card" onsubmit="createAccount(event)">
      <h1>Create your Pepiko account</h1>
      <p>Start testing child-safety, PII, moderation, and policy routing APIs from one secure workspace.</p>
      <div class="form-grid two">
        <label>First name<input id="reg_first" value="Ananya" autocomplete="given-name"></label>
        <label>Last name<input id="reg_last" value="Rao" autocomplete="family-name"></label>
        <label>Work email<input id="reg_email" type="email" placeholder="you@company.com" autocomplete="email"></label>
        <label>Company name<input id="reg_company" placeholder="Company Inc."></label>
      </div>
      <div class="field" style="margin-top:18px"><label>Password</label><div class="input"><span>▣</span><input id="reg_password" type="password" placeholder="Create a password" autocomplete="new-password"></div></div>
      <div class="field"><label>Confirm password</label><div class="input"><span>▣</span><input id="reg_confirm" type="password" placeholder="Confirm password" autocomplete="new-password"></div></div>
      <button class="btn primary full" type="submit">Create account</button>
      <div id="status" class="login-status" role="status" aria-live="polite"></div>
      <p style="font-size:13px;margin-top:18px">Already have an account? <a href="#" onclick="event.preventDefault();renderLogin()" style="color:var(--teal-dark);font-weight:800">Sign in</a></p>
    </form>
    <footer class="login-footer"><span>By continuing, you agree to Pepiko's terms and privacy policy.</span><span>© 2026 Pepiko, Inc.</span></footer>
  </section>
  <section class="registration-visual">
    <div class="registration-panel">
      <h2>Built for safe AI teams</h2>
      <p style="color:var(--muted)">Your team gets a secure workspace for testing APIs, managing keys, tracking usage, and going live with safety workflows.</p>
      <div class="check-list">
        <div class="check-item"><span class="check-mark">✓</span><div><strong>Developer-first onboarding</strong><br><span style="color:var(--muted)">Create your first key and test APIs in minutes.</span></div></div>
        <div class="check-item"><span class="check-mark">✓</span><div><strong>Production controls</strong><br><span style="color:var(--muted)">Projects, environments, webhooks, usage, and audit logs.</span></div></div>
        <div class="check-item"><span class="check-mark">✓</span><div><strong>Team-ready access</strong><br><span style="color:var(--muted)">Invite admins, developers, viewers, and billing users.</span></div></div>
      </div>
    </div>
  </section>
</main>`;
}

async function createAccount(event) {
  event.preventDefault();
  if (reg_password.value !== reg_confirm.value) {
    setStatus("Passwords do not match.", true);
    return;
  }
  setStatus("Creating account...");
  const payload = {
    first_name: reg_first.value,
    last_name: reg_last.value,
    work_email: reg_email.value,
    company_name: reg_company.value,
    password: reg_password.value,
  };
  try {
    const data = await api("/api/customer/auth/register", { method: "POST", body: JSON.stringify(payload) });
    token = data.access_token;
    user = data.user;
    onboardingState.account = payload;
    onboardingState.organization = { name: data.organization?.name || payload.company_name, projectId: data.project?.id };
    localStorage.setItem("pepiko_customer_token", token);
    localStorage.setItem("pepiko_customer_user", JSON.stringify(user));
    renderOnboarding("organization");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function onboardingChrome(step, body) {
  const steps = [
    ["account", "Account", "Create your login"],
    ["organization", "Organization", "Company profile"],
    ["product", "Use case", "API needs"],
    ["apiKey", "API key", "First key"],
    ["team", "Team", "Invite members"],
    ["complete", "Complete", "Start building"],
  ];
  const activeIndex = steps.findIndex(([id]) => id === step);
  const stepList = steps.map(([id, title, subtitle], index) => {
    const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "";
    return `<div class="step ${state}"><div class="step-num">${index < activeIndex ? "✓" : index + 1}</div><div><strong>${title}</strong><span>${subtitle}</span></div></div>`;
  }).join("");
  return `<main class="onboarding-shell">
    <header class="onboarding-top">
      <div class="login-brand"><a class="brand" href="#" onclick="event.preventDefault();renderLogin()">pepiko<span class="brand-ai">.ai</span></a><span class="portal-label">Customer Portal</span></div>
      <div class="right"><span>Need help?</span><button class="btn" onclick="renderApp();showPage('support')" type="button">Contact support</button></div>
    </header>
    <div class="onboarding-layout">
      <aside class="onboarding-side"><h2>Set up Pepiko</h2><p>Complete these steps to configure your customer portal, first API key, and production-ready workspace.</p><div class="steps">${stepList}</div></aside>
      ${body}
    </div>
  </main>`;
}

function renderOnboarding(step) {
  if (step === "organization") return renderOrganizationStep();
  if (step === "product") return renderProductStep();
  if (step === "apiKey") return renderApiKeyStep();
  if (step === "team") return renderTeamStep();
  return renderCompleteStep();
}

function renderOrganizationStep() {
  document.body.innerHTML = onboardingChrome("organization", `<section class="onboarding-main">
    <div class="onboarding-hero"><div class="eyebrow">Step 2 of 6</div><h1>Tell us about your organization</h1><p>This helps Pepiko prepare the right API limits, defaults, and safety workflow for your team.</p></div>
    <div class="onboarding-body">
      <div class="form-grid two">
        <label>Organization name<input id="ob_org" value="${esc(onboardingState.organization.name || onboardingState.account.company_name || "BrightMinds Inc.")}"></label>
        <label>Website<input id="ob_site" value="${esc(onboardingState.organization.website || "https://brightminds.ai")}"></label>
        <label>Company size<select id="ob_size"><option>11-50</option><option>51-200</option><option>201-1000</option></select></label>
        <label>Industry<select id="ob_industry"><option>EdTech</option><option>Kids app</option><option>AI platform</option><option>Community</option></select></label>
        <label>Primary region<select id="ob_region"><option>India</option><option>United States</option><option>Europe</option><option>Global</option></select></label>
        <label>Expected launch stage<select id="ob_stage"><option>Pre-launch / beta</option><option>Production</option><option>Scaling</option></select></label>
      </div>
      <div class="onboarding-actions"><button class="btn" onclick="renderRegistration()">Back</button><div class="right-actions"><button class="btn" onclick="renderApp()">Skip for now</button><button class="btn primary" onclick="saveOrganizationStep()">Continue</button></div></div>
    </div>
  </section>`);
}

function saveOrganizationStep() {
  onboardingState.organization = { ...onboardingState.organization, name: ob_org.value, website: ob_site.value, companySize: ob_size.value, industry: ob_industry.value, region: ob_region.value, stage: ob_stage.value };
  renderOnboarding("product");
}

function selectUseCase(card, value) {
  onboardingState.useCase = value;
  $$(".option-card").forEach(el => el.classList.remove("selected"));
  card.classList.add("selected");
}

function renderProductStep() {
  const options = [
    ["🎓", "AI tutor / learning assistant", "Classify student prompts and route age-sensitive responses safely."],
    ["🧩", "Kids app", "Protect young users during chat, creation, and discovery flows."],
    ["💬", "Family-safe chatbot", "Moderate conversations and detect risky or sensitive user inputs."],
    ["🌐", "Community / creator tools", "Manage content risk across community, comments, and messages."],
  ];
  document.body.innerHTML = onboardingChrome("product", `<section class="onboarding-main">
    <div class="onboarding-hero"><div class="eyebrow">Step 3 of 6</div><h1>Choose your first use case</h1><p>Select the product pattern closest to what you are building. You can change this later.</p></div>
    <div class="onboarding-body">
      <div class="onboarding-grid">${options.map(([icon, title, copy]) => `<button class="option-card ${title === onboardingState.useCase ? "selected" : ""}" onclick="selectUseCase(this,'${esc(title)}')" type="button"><div class="option-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(copy)}</p></button>`).join("")}</div>
      <div class="form-grid" style="margin-top:18px"><label>Which APIs do you want to start with?<select id="ob_products"><option>Child Safety Classification + Moderation API</option><option>PII Detection</option><option>Classified Prompt</option><option>All products</option></select></label></div>
      <div class="onboarding-actions"><button class="btn" onclick="renderOnboarding('organization')">Back</button><div class="right-actions"><button class="btn primary" onclick="onboardingState.products=ob_products.value;renderOnboarding('apiKey')">Continue</button></div></div>
    </div>
  </section>`);
}

async function renderApiKeyStep() {
  document.body.innerHTML = onboardingChrome("apiKey", `<section class="onboarding-main">
    <div class="onboarding-hero"><div class="eyebrow">Step 4 of 6</div><h1>Create your first API key</h1><p>Generate a test key and connect your first integration safely.</p></div>
    <div class="onboarding-body">
      <div class="api-key-preview">
        <h2 style="margin:0">Create your first test API key</h2>
        <p style="color:var(--muted)">Use test mode while integrating. You can create production keys later after reviewing usage and billing settings.</p>
        <div class="form-grid two">
          <label>Key name<input id="ob_key_name" value="Development Key"></label>
          <label>Environment<select id="ob_key_env"><option value="staging">Test</option><option value="production">Production</option></select></label>
          <label>Scopes<select><option>classify:write, usage:read</option><option>classify:write</option><option>read-only</option></select></label>
          <label>Project<select id="ob_project"><option value="">Default Project</option></select></label>
        </div>
        <code id="ob_key_preview">${onboardingState.apiKey ? esc(onboardingState.apiKey) : "pk_test_••••••••••••••••••••••••"}</code>
      </div>
      <div id="status" class="login-status" role="status" aria-live="polite"></div>
      <div class="onboarding-actions"><button class="btn" onclick="renderOnboarding('product')">Back</button><div class="right-actions"><button class="btn" onclick="renderApp();showPage('apiKeys')">Manage keys</button><button class="btn primary" onclick="createOnboardingApiKey()">Create key & continue</button></div></div>
    </div>
  </section>`);
  try {
    const projects = await api("/api/customer/projects");
    if (projects.length) {
      ob_project.innerHTML = projects.map(project => `<option value="${project.id}" ${project.id===onboardingState.organization.projectId ? "selected" : ""}>${esc(project.name)}</option>`).join("");
    }
  } catch {}
}

async function createOnboardingApiKey() {
  setStatus("Creating API key...");
  try {
    const projectId = Number(ob_project.value || onboardingState.organization.projectId);
    const data = await api("/api/customer/api-keys", { method: "POST", body: JSON.stringify({ name: ob_key_name.value, project_id: projectId, environment: ob_key_env.value, allowed_products: ["child_safety_classifier", "moderation_api"], rate_limit_per_minute: 500 }) });
    onboardingState.apiKey = data.api_key || data.masked_key;
    renderOnboarding("team");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderTeamStep() {
  document.body.innerHTML = onboardingChrome("team", `<section class="onboarding-main">
    <div class="onboarding-hero"><div class="eyebrow">Step 5 of 6</div><h1>Invite your team</h1><p>Add teammates so your developers, finance team, and product team can collaborate.</p></div>
    <div class="onboarding-body">
      <div class="form-grid">
        <label>Invite teammates</label>
        <div class="form-grid two">
          <input id="ob_invite_1" placeholder="developer@company.com" value="rohan@brightminds.ai">
          <select id="ob_role_1"><option value="developer">Developer</option><option value="admin">Admin</option><option value="viewer">Viewer</option><option value="billing_manager">Billing</option></select>
          <input id="ob_invite_2" placeholder="billing@company.com" value="finance@brightminds.ai">
          <select id="ob_role_2"><option value="billing_manager">Billing</option><option value="admin">Admin</option><option value="developer">Developer</option><option value="viewer">Viewer</option></select>
        </div>
      </div>
      <div class="side-card" style="margin-top:22px"><h3>Role guide</h3><p><strong>Admin</strong> manages account, billing, keys, and team access.</p><p><strong>Developer</strong> manages keys, playground, projects, and webhooks.</p><p><strong>Viewer</strong> can view reports, usage, and audit logs.</p></div>
      <div id="status" class="login-status" role="status" aria-live="polite"></div>
      <div class="onboarding-actions"><button class="btn" onclick="renderOnboarding('apiKey')">Back</button><div class="right-actions"><button class="btn" onclick="renderOnboarding('complete')">Skip</button><button class="btn primary" onclick="sendOnboardingInvites()">Send invites</button></div></div>
    </div>
  </section>`);
}

async function sendOnboardingInvites() {
  setStatus("Sending invites...");
  const invites = [[ob_invite_1.value, ob_role_1.value], [ob_invite_2.value, ob_role_2.value]].filter(([email]) => email.trim());
  try {
    for (const [email, role] of invites) {
      await api("/api/customer/team", { method: "POST", body: JSON.stringify({ name: email.split("@")[0], email, role, project_access: [] }) });
    }
    onboardingState.invites = invites;
    renderOnboarding("complete");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderCompleteStep() {
  document.body.innerHTML = onboardingChrome("complete", `<section class="onboarding-main">
    <div class="complete-card">
      <div class="complete-icon">✓</div>
      <h1>Your workspace is ready</h1>
      <p>You created your account, configured your organization, selected your first product flow, and prepared your first test API key.</p>
      ${onboardingState.apiKey ? `<div class="api-key-preview" style="max-width:760px;margin:0 auto 24px;text-align:left"><strong>Copy your test key now:</strong><br><code>${esc(onboardingState.apiKey)}</code></div>` : ""}
      <div class="quick-grid" style="margin:28px auto;max-width:760px;text-align:left">
        <button class="quick-card" onclick="renderApp();showPage('playground')" type="button"><div class="quick-icon">↯</div><div><strong>Open API Playground</strong><span>Send your first test request</span></div></button>
        <button class="quick-card" onclick="renderApp();showPage('apiKeys')" type="button"><div class="quick-icon">⚿</div><div><strong>Manage API Keys</strong><span>Create production keys</span></div></button>
        <button class="quick-card" onclick="renderApp();showPage('projects')" type="button"><div class="quick-icon">□</div><div><strong>Configure Project</strong><span>Add app environments</span></div></button>
        <button class="quick-card" onclick="renderApp();showPage('webhooks')" type="button"><div class="quick-icon">↝</div><div><strong>Add Webhook</strong><span>Receive event notifications</span></div></button>
      </div>
      <button class="btn primary" onclick="renderApp()" type="button">Go to dashboard</button>
    </div>
  </section>`);
}
