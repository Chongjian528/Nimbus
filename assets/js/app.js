/* ==========================================================================
   Nimbus Admin — shared runtime
   Builds the app shell (sidebar, topbar, footer) and wires every reusable
   widget through event delegation, so page scripts only render their content.
   Public API: window.App (bottom of file).
   ========================================================================== */
(() => {
  'use strict';

  // ---------- Persisted UI state (localStorage throws in some private modes) ----------
  const store = {
    get: k => { try { return localStorage.getItem('nimbus.' + k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem('nimbus.' + k, v); } catch { /* ignore */ } },
  };
  const root = document.documentElement;
  const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = store.get('theme') || (prefersDark() ? 'dark' : 'light');
  if (store.get('sidebar') === 'mini') root.classList.add('sidebar-collapsed');
  // "Reduce motion" can come from the OS or from Settings → Appearance
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || store.get('motion') === 'reduce';
  if (reduceMotion) root.classList.add('reduce-motion');
  const desktop = matchMedia('(min-width: 1024px)');

  // ---------- Helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const param = k => new URLSearchParams(location.search).get(k);
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const nf = new Intl.NumberFormat('en-US');
  const cf = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const mf = {};
  const fmt = {
    money: (n, d = 0) => (mf[d] ||= new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d })).format(n),
    num: n => nf.format(n),
    compact: n => cf.format(n),
    cash: n => (n < 0 ? '-$' : '$') + cf.format(Math.abs(n)),
    pct: (n, d = 1) => `${Number(n).toFixed(d)}%`,
    date: d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    day: d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    ago(d) {
      const s = (Date.now() - new Date(d)) / 1000;
      if (s < 60) return 'Just now';
      if (s < 3600) return `${Math.floor(s / 60)}m ago`;
      if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
      if (s < 172800) return 'Yesterday';
      if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
      return fmt.day(d);
    },
  };

  const TONES = ['primary', 'success', 'warning', 'danger', 'info', 'violet', 'pink'];
  const toneOf = s => TONES[[...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TONES.length];
  const initials = n => String(n).trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const avatar = (name, cls = '', labelled = false) =>
    `<span class="avatar ${cls} tone-${toneOf(name)}" ${labelled ? `role="img" aria-label="${esc(name)}" title="${esc(name)}"` : 'aria-hidden="true"'}>${esc(initials(name))}</span>`;
  const avatars = (names, max = 3, cls = 'avatar-sm') =>
    `<div class="avatar-group">${names.slice(0, max).map(n => avatar(n, cls, true)).join('')}${names.length > max ? `<span class="avatar ${cls} avatar-more" role="img" aria-label="${names.length - max} more">+${names.length - max}</span>` : ''}</div>`;

  const STATUS = {
    success: ['active', 'paid', 'delivered', 'completed', 'won', 'approved', 'in stock', 'present', 'received', 'reimbursed', 'online', 'resolved', 'on track', 'published', 'connected', 'done', 'verified', 'low'],
    warning: ['pending', 'processing', 'draft', 'in review', 'low stock', 'late', 'on hold', 'partially received', 'partial', 'medium', 'away', 'unpaid'],
    danger: ['cancelled', 'overdue', 'failed', 'lost', 'rejected', 'out of stock', 'absent', 'inactive', 'churn risk', 'at risk', 'high', 'refunded', 'blocked', 'suspended', 'urgent'],
    info: ['shipped', 'sent', 'new', 'open', 'contacted', 'in progress', 'remote', 'on leave', 'trial', 'invited', 'scheduled'],
    violet: ['qualified', 'proposal', 'negotiation'],
  };
  const statusTone = s => { const k = String(s).toLowerCase(); for (const t in STATUS) if (STATUS[t].includes(k)) return t; return 'neutral'; };
  const badge = (text, tone = statusTone(text), dot = true) => `<span class="badge${dot ? ' badge-dot' : ''} tone-${tone}">${esc(text)}</span>`;
  const delta = (v, upIsGood = true) => {
    const good = v === 0 ? null : (v > 0) === upIsGood;
    return `<span class="delta ${good === null ? 'is-flat' : good ? 'is-good' : 'is-bad'}"><i class="ph ph-trend-${v >= 0 ? 'up' : 'down'}"></i><span class="sr-only">${v >= 0 ? 'Up' : 'Down'} </span>${Math.abs(v).toFixed(1)}%</span>`;
  };
  const rowMenu = (items, label = 'Row actions') =>
    `<div class="dropdown"><button class="btn btn-ghost btn-icon btn-sm" type="button" data-dropdown aria-haspopup="true" aria-expanded="false" aria-label="${esc(label)}"><i class="ph ph-dots-three-vertical"></i></button><div class="dropdown-menu">${items.map(i =>
      i === '-' ? '<div class="dropdown-divider"></div>'
        : i.href ? `<a class="dropdown-item${i.danger ? ' danger' : ''}" href="${i.href}"><i class="ph ph-${i.icon}"></i>${i.label}</a>`
        : `<button class="dropdown-item${i.danger ? ' danger' : ''}" type="button" data-row-action="${i.action}"><i class="ph ph-${i.icon}"></i>${i.label}</button>`).join('')}</div></div>`;

  // ---------- Navigation ----------
  const ME = { name: 'Olivia Carter', role: 'Administrator', email: 'olivia.carter@nimbus.io' };
  const NAV = [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: 'squares-four', href: 'index.html' },
      { label: 'Analytics', icon: 'chart-line-up', href: 'analytics.html' },
    ] },
    { section: 'CRM', items: [
      { label: 'Customers', icon: 'users-three', children: [
        { label: 'Customer List', href: 'customers.html' },
        { label: 'Customer Profile', href: 'customer-detail.html' },
      ] },
      { label: 'Leads', icon: 'user-plus', href: 'leads.html', badge: 'New', soft: true },
      { label: 'Deals Pipeline', icon: 'handshake', href: 'deals.html' },
    ] },
    { section: 'Sales', items: [
      { label: 'Orders', icon: 'shopping-cart-simple', children: [
        { label: 'Order List', href: 'orders.html' },
        { label: 'Order Details', href: 'order-detail.html' },
      ] },
      { label: 'Invoices', icon: 'receipt', children: [
        { label: 'Invoice List', href: 'invoices.html' },
        { label: 'Invoice Preview', href: 'invoice-detail.html' },
      ] },
    ] },
    { section: 'Inventory', items: [
      { label: 'Products', icon: 'package', children: [
        { label: 'Product Catalog', href: 'products.html' },
        { label: 'Add Product', href: 'product-form.html' },
      ] },
      { label: 'Stock & Warehouses', icon: 'warehouse', href: 'inventory.html' },
      { label: 'Purchase Orders', icon: 'truck', href: 'purchase-orders.html' },
      { label: 'Suppliers', icon: 'storefront', href: 'suppliers.html' },
    ] },
    { section: 'Finance', items: [
      { label: 'Finance Overview', icon: 'wallet', href: 'finance.html' },
      { label: 'Expenses', icon: 'coins', href: 'expenses.html' },
    ] },
    { section: 'People', items: [
      { label: 'Employees', icon: 'identification-badge', href: 'employees.html' },
      { label: 'Payroll', icon: 'money', href: 'payroll.html' },
      { label: 'Attendance & Leave', icon: 'calendar-check', href: 'attendance.html' },
    ] },
    { section: 'Workspace', items: [
      { label: 'Projects', icon: 'folder-simple', href: 'projects.html' },
      { label: 'Task Board', icon: 'kanban', href: 'tasks.html' },
      { label: 'Calendar', icon: 'calendar-blank', href: 'calendar.html' },
      { label: 'Messages', icon: 'chat-circle-dots', href: 'messages.html', badge: '5' },
      { label: 'Mail', icon: 'envelope-simple', href: 'mail.html', badge: '12' },
    ] },
    { section: 'Insights', items: [
      { label: 'Reports', icon: 'chart-pie-slice', href: 'reports.html' },
    ] },
    { section: 'Administration', items: [
      { label: 'Users & Roles', icon: 'shield-check', href: 'users.html' },
      { label: 'Settings', icon: 'gear-six', href: 'settings.html' },
    ] },
    { section: 'Pages', items: [
      { label: 'Account', icon: 'user-circle', children: [
        { label: 'My Profile', href: 'profile.html' },
        { label: 'Notifications', href: 'notifications.html' },
        { label: 'Billing & Plans', href: 'billing.html' },
      ] },
      { label: 'Authentication', icon: 'sign-in', children: [
        { label: 'Sign In', href: 'login.html' },
        { label: 'Sign Up', href: 'register.html' },
        { label: 'Forgot Password', href: 'forgot-password.html' },
      ] },
      { label: 'Error Pages', icon: 'warning-circle', children: [
        { label: '404 Not Found', href: '404.html' },
        { label: '500 Server Error', href: '500.html' },
      ] },
      { label: 'Help Center', icon: 'lifebuoy', href: 'help.html' },
    ] },
    { section: 'UI Kit', items: [
      { label: 'Components', icon: 'puzzle-piece', href: 'components.html' },
      { label: 'Form Elements', icon: 'textbox', href: 'forms.html' },
    ] },
  ];
  const currentPage = () => document.body.dataset.nav || location.pathname.split('/').pop() || 'index.html';
  const pageIndex = () => NAV.flatMap(s => s.items.flatMap(it =>
    (it.children || [it]).map(c => ({ label: c.label, href: c.href, icon: it.icon, group: s.section }))));

  const BRAND_SVG = `<svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true"><defs><linearGradient id="nimbus-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a94ff"/><stop offset="1" stop-color="#4e5be6"/></linearGradient></defs><rect width="36" height="36" rx="11" fill="url(#nimbus-g)"/><path d="M12 25h12a4.6 4.6 0 0 0 .5-9.18A6.2 6.2 0 0 0 12.6 17.3 3.9 3.9 0 0 0 12 25z" fill="#fff"/></svg>`;

  function sidebarHTML() {
    const cur = currentPage();
    const item = it => {
      if (it.children) {
        const open = it.children.some(c => c.href === cur);
        return `<li class="has-sub${open ? ' open' : ''}">
          <button class="nav-link${open ? ' is-active' : ''}" type="button" data-action="toggle-sub" aria-expanded="${open}">
            <i class="ph${open ? '-fill' : ''} ph-${it.icon}"></i><span class="nav-text">${it.label}</span><i class="ph ph-caret-down nav-caret"></i>
          </button>
          <ul class="nav-sub">${it.children.map(c => `<li><a href="${c.href}"${c.href === cur ? ' class="is-active" aria-current="page"' : ''}>${c.label}</a></li>`).join('')}</ul>
        </li>`;
      }
      const on = it.href === cur;
      return `<li><a class="nav-link${on ? ' is-active' : ''}" href="${it.href}"${on ? ' aria-current="page"' : ''}>
        <i class="ph${on ? '-fill' : ''} ph-${it.icon}"></i><span class="nav-text">${it.label}</span>${it.badge ? `<span class="nav-badge${it.soft ? ' soft' : ''}">${it.badge}</span>` : ''}</a></li>`;
    };
    return `
      <div class="sidebar-brand">
        <a class="brand" href="index.html">${BRAND_SVG}<span class="brand-name">Nimbus<small>ERP &amp; CRM</small></span></a>
        <button class="btn btn-ghost btn-icon sidebar-close" type="button" data-action="close-sidebar" aria-label="Close navigation"><i class="ph ph-x"></i></button>
      </div>
      <nav class="sidebar-nav" aria-label="Main navigation">
        ${NAV.map(s => `<div class="nav-section"><p class="nav-label">${s.section}</p><ul class="nav-list">${s.items.map(item).join('')}</ul></div>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="promo">
          <strong>Nimbus Pro</strong>
          <p>Unlock forecasting, automations and unlimited seats.</p>
          <a class="btn btn-primary btn-sm btn-block" href="billing.html"><i class="ph ph-sparkle"></i>Upgrade plan</a>
        </div>
      </div>`;
  }

  function topbarHTML() {
    const notes = window.DB?.notifications || [];
    const unread = notes.filter(n => n.unread).length;
    const dark = root.dataset.theme === 'dark';
    return `
      <button class="btn btn-ghost btn-icon" type="button" data-action="toggle-sidebar" aria-label="Toggle navigation" aria-controls="sidebar"><i class="ph ph-list"></i></button>
      <a class="brand mobile-brand" href="index.html" aria-label="Nimbus home">${BRAND_SVG.replace('nimbus-g', 'nimbus-g2').replace('nimbus-g)', 'nimbus-g2)')}</a>
      <button class="topbar-search" type="button" data-action="open-search"><i class="ph ph-magnifying-glass"></i><span>Search pages, customers, orders…</span><kbd>Ctrl K</kbd></button>
      <div class="topbar-actions">
        <button class="btn btn-ghost btn-icon search-mobile" type="button" data-action="open-search" aria-label="Search"><i class="ph ph-magnifying-glass"></i></button>
        <button class="btn btn-ghost btn-icon" type="button" data-action="toggle-theme" aria-label="${dark ? 'Switch to light theme' : 'Switch to dark theme'}"><i class="ph ph-${dark ? 'sun' : 'moon'}"></i></button>
        <div class="dropdown">
          <button class="btn btn-ghost btn-icon${unread ? ' has-dot' : ''}" type="button" data-dropdown aria-haspopup="true" aria-expanded="false" aria-label="Notifications${unread ? `, ${unread} unread` : ''}"><i class="ph ph-bell"></i></button>
          <div class="dropdown-menu notif-menu">
            <div class="dropdown-header"><strong>Notifications</strong><span class="badge tone-primary">${unread} new</span></div>
            <div class="notif-list">${notes.slice(0, 5).map(n => `
              <a class="notif-item" href="${n.href || 'notifications.html'}"><span class="icon-tile sm tone-${n.tone}"><i class="ph ph-${n.icon}"></i></span>
              <span class="grow"><p><strong>${esc(n.title)}</strong> ${esc(n.text)}</p><small>${fmt.ago(n.time)}</small></span></a>`).join('')}</div>
            <div class="dropdown-footer"><a class="card-link" href="notifications.html">View all notifications <i class="ph ph-arrow-right"></i></a></div>
          </div>
        </div>
        <div class="dropdown">
          <button class="user-chip" type="button" data-dropdown aria-haspopup="true" aria-expanded="false" aria-label="Account menu">${avatar(ME.name, 'avatar-sm')}<span class="user-meta"><strong>${ME.name}</strong><small>${ME.role}</small></span><i class="ph ph-caret-down"></i></button>
          <div class="dropdown-menu" style="min-width:240px">
            <div class="dropdown-header"><strong>${ME.name}</strong><small>${ME.email}</small></div>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="profile.html"><i class="ph ph-user-circle"></i>My profile</a>
            <a class="dropdown-item" href="settings.html"><i class="ph ph-gear-six"></i>Settings</a>
            <a class="dropdown-item" href="billing.html"><i class="ph ph-credit-card"></i>Billing &amp; plans</a>
            <a class="dropdown-item" href="help.html"><i class="ph ph-lifebuoy"></i>Help center</a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item danger" href="login.html"><i class="ph ph-sign-out"></i>Sign out</a>
          </div>
        </div>
      </div>`;
  }

  function buildLayout() {
    const sidebar = $('#sidebar'), topbar = $('#topbar'), main = $('.main');
    if (sidebar) {
      sidebar.innerHTML = sidebarHTML();
      sidebar.insertAdjacentHTML('afterend', '<div class="sidebar-backdrop" data-action="close-sidebar" aria-hidden="true"></div>');
      const nav = $('.sidebar-nav', sidebar), active = $('.nav-sub a.is-active, a.nav-link.is-active', sidebar);
      if (active) nav.scrollTop = active.offsetTop - nav.offsetTop - nav.clientHeight / 2;
    }
    if (topbar) topbar.innerHTML = topbarHTML();
    main?.insertAdjacentHTML('beforeend', `<footer class="footer"><span>© ${new Date().getFullYear()} Nimbus ERP &amp; CRM · Crafted with care.</span><nav aria-label="Footer"><a href="help.html">Help</a><a href="billing.html">Plans</a><a href="settings.html">Settings</a></nav></footer>`);
    if ($('#main')) document.body.insertAdjacentHTML('afterbegin', '<a class="skip-link" href="#main">Skip to content</a>');
  }

  // ---------- Theme & sidebar ----------
  function setTheme(t) {
    store.set('theme', t === 'system' ? '' : t);
    const mode = t === 'system' ? (prefersDark() ? 'dark' : 'light') : t;
    root.dataset.theme = mode;
    syncThemeButtons();
    document.dispatchEvent(new CustomEvent('themechange', { detail: mode }));
  }
  function syncThemeButtons() {
    const dark = root.dataset.theme === 'dark';
    $$('[data-action="toggle-theme"]').forEach(b => {
      b.innerHTML = `<i class="ph ph-${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  function syncInert() {
    const sb = $('#sidebar'), main = $('.main');
    if (!sb || !main) return;
    const open = root.classList.contains('sidebar-open');
    sb.inert = !desktop.matches && !open;
    main.inert = !desktop.matches && open;
  }
  function setDrawer(open, restoreFocus = true) {
    root.classList.toggle('sidebar-open', open);
    syncInert();
    if (open) $('#sidebar .sidebar-close')?.focus();
    else if (restoreFocus) $('#topbar [data-action="toggle-sidebar"]')?.focus();
  }
  function toggleSidebar() {
    if (desktop.matches) {
      store.set('sidebar', root.classList.toggle('sidebar-collapsed') ? 'mini' : 'full');
      setTimeout(() => dispatchEvent(new Event('resize')), 260); // let charts re-measure
    } else setDrawer(!root.classList.contains('sidebar-open'));
  }

  // ---------- Dropdowns (menus are position:fixed so scroll containers never clip them) ----------
  const menuItems = m => $$('a[href], button:not(:disabled), input, select', m);
  function placeMenu(menu, toggle) {
    menu.style.left = menu.style.top = '0px';
    const origin = menu.getBoundingClientRect(); // non-zero when an ancestor (e.g. blurred topbar) is the containing block
    const t = toggle.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
    let x = menu.dataset.align === 'start' ? t.left : t.right - w;
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    let y = t.bottom + 6;
    if (y + h > innerHeight - 8 && t.top - h - 6 > 8) y = t.top - h - 6;
    menu.style.left = `${x - origin.left}px`;
    menu.style.top = `${y - origin.top}px`;
  }
  function closeDropdowns() {
    $$('.dropdown.open').forEach(d => { d.classList.remove('open'); $('[data-dropdown]', d)?.setAttribute('aria-expanded', 'false'); });
  }
  function openDropdown(dd, focusFirst) {
    closeDropdowns();
    const toggle = $('[data-dropdown]', dd), menu = $('.dropdown-menu', dd);
    dd.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    placeMenu(menu, toggle);
    if (focusFirst) menuItems(menu)[0]?.focus();
  }

  // ---------- Tabs ----------
  function selectTab(tab) {
    const list = tab.closest('[role="tablist"]');
    $$('[role="tab"]', list).forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'));
      if (panel && panel.getAttribute('role') === 'tabpanel') panel.hidden = !on;
    });
    list.dispatchEvent(new CustomEvent('tabchange', { detail: tab.dataset.value ?? tab.id, bubbles: true }));
  }

  // ---------- Modals ----------
  const openModal = sel => { const d = typeof sel === 'string' ? $(sel) : sel; if (d && !d.open) d.showModal(); return d; };
  function confirmDialog({ title = 'Are you sure?', text = '', confirm = 'Confirm', tone = 'danger', icon = 'warning' } = {}) {
    return new Promise(resolve => {
      const d = document.createElement('dialog');
      d.className = 'modal modal-sm';
      d.setAttribute('aria-labelledby', 'confirm-title');
      d.innerHTML = `<div class="modal-confirm"><span class="icon-tile lg tone-${tone}"><i class="ph ph-${icon}"></i></span>
        <h2 class="modal-title" id="confirm-title">${esc(title)}</h2><p class="text-2 text-sm">${esc(text)}</p></div>
        <div class="modal-footer" style="justify-content:center;border:0;background:none">
          <button class="btn btn-secondary" type="button" value="no">Cancel</button>
          <button class="btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}" type="button" value="yes">${esc(confirm)}</button></div>`;
      document.body.append(d);
      d.addEventListener('click', e => { const b = e.target.closest('button[value]'); if (b) d.close(b.value); });
      d.addEventListener('close', () => { resolve(d.returnValue === 'yes'); d.remove(); });
      d.showModal();
    });
  }

  // ---------- Toasts ----------
  function toast(message, { type = 'success', title } = {}) {
    let stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.append(stack);
    }
    const icon = { success: 'check-circle', error: 'warning-circle', info: 'info', warning: 'warning' }[type];
    const tone = { success: 'success', error: 'danger', info: 'primary', warning: 'warning' }[type];
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="icon-tile tone-${tone}"><i class="ph ph-${icon}"></i></span>
      <div class="toast-body">${title ? `<p class="toast-title">${esc(title)}</p>` : ''}<p class="toast-text">${esc(message)}</p></div>
      <button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Dismiss notification"><i class="ph ph-x"></i></button>`;
    const remove = () => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 200); };
    $('button', t).addEventListener('click', remove);
    stack.append(t);
    setTimeout(remove, 4200);
  }

  // ---------- Forms: native constraint validation, messages rendered next to the field ----------
  function validateField(f) {
    if (f.dataset.match) f.setCustomValidity(f.value && f.value !== $(f.dataset.match)?.value ? 'Passwords do not match.' : '');
    const ok = f.checkValidity();
    const wrap = f.closest('.field') || f.parentElement;
    let err = $(':scope > .field-error', wrap);
    f.setAttribute('aria-invalid', String(!ok));
    if (!err && !ok) {
      err = document.createElement('p');
      err.className = 'field-error';
      err.id = `${f.id || f.name || 'field'}-error`;
      wrap.append(err);
      f.setAttribute('aria-describedby', [f.getAttribute('aria-describedby'), err.id].filter(Boolean).join(' '));
    }
    if (err) {
      err.hidden = ok;
      if (!ok) err.innerHTML = `<i class="ph ph-warning-circle" aria-hidden="true"></i>${esc(f.dataset.error || f.validationMessage)}`;
    }
    return ok;
  }
  function clearValidation(form) {
    $$('[aria-invalid]', form).forEach(x => x.removeAttribute('aria-invalid'));
    $$('.field-error', form).forEach(x => { x.hidden = true; });
  }

  // ---------- Command palette ----------
  function searchGroups(q) {
    q = q.trim().toLowerCase();
    const has = s => String(s).toLowerCase().includes(q);
    const pages = pageIndex().filter(p => !q || has(p.label) || has(p.group));
    const groups = [['Pages', pages.slice(0, q ? 8 : 7).map(p => ({ label: p.label, href: p.href, icon: p.icon, meta: p.group }))]];
    const DB = window.DB;
    if (q && DB) {
      groups.push(['Customers', DB.customers.filter(c => has(c.name) || has(c.company) || has(c.email)).slice(0, 5)
        .map(c => ({ label: c.name, href: `customer-detail.html?id=${c.id}`, icon: 'user', meta: c.company }))]);
      groups.push(['Orders', DB.orders.filter(o => has(o.id) || has(o.customer)).slice(0, 4)
        .map(o => ({ label: `#${o.id}`, href: `order-detail.html?id=${o.id}`, icon: 'shopping-cart-simple', meta: o.customer }))]);
      groups.push(['Products', DB.products.filter(p => has(p.name) || has(p.sku)).slice(0, 4)
        .map(p => ({ label: p.name, href: `products.html?q=${encodeURIComponent(p.name)}`, icon: p.icon, meta: p.sku }))]);
    }
    return groups.filter(g => g[1].length);
  }
  function openSearch() {
    let d = $('#cmdk');
    if (!d) {
      document.body.insertAdjacentHTML('beforeend', `<dialog class="cmdk" id="cmdk" aria-label="Search">
        <div class="cmdk-input"><i class="ph ph-magnifying-glass" aria-hidden="true"></i>
          <input type="text" placeholder="Search pages, customers, orders, products…" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" autocomplete="off" spellcheck="false">
          <kbd>Esc</kbd></div>
        <div class="cmdk-list" id="cmdk-list" role="listbox" aria-label="Results"></div>
        <div class="cmdk-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
      </dialog>`);
      d = $('#cmdk');
      const input = $('input', d), list = $('.cmdk-list', d);
      let sel = 0;
      const items = () => $$('.cmdk-item', list);
      const mark = () => items().forEach((a, i) => {
        a.setAttribute('aria-selected', String(i === sel));
        if (i === sel) { input.setAttribute('aria-activedescendant', a.id); a.scrollIntoView({ block: 'nearest' }); }
      });
      d.render = () => {
        const groups = searchGroups(input.value);
        let n = 0;
        list.innerHTML = groups.length ? groups.map(([name, rows]) => `<div class="cmdk-group" role="presentation">${name}</div>${rows.map(r =>
          `<a class="cmdk-item" role="option" id="cmdk-${n++}" href="${r.href}"><i class="ph ph-${r.icon}" aria-hidden="true"></i><span class="truncate">${esc(r.label)}</span><small>${esc(r.meta)}</small></a>`).join('')}`).join('')
          : `<p class="cmdk-empty">No results for “${esc(input.value)}”</p>`;
        sel = 0; mark();
      };
      input.addEventListener('input', d.render);
      input.addEventListener('keydown', e => {
        const n = items().length;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; mark(); }
        if (e.key === 'Enter' && n) { e.preventDefault(); items()[sel].click(); }
      });
      list.addEventListener('mousemove', e => { const a = e.target.closest('.cmdk-item'); if (a) { sel = items().indexOf(a); mark(); } });
      d.addEventListener('click', e => { if (e.target === d) d.close(); });
    }
    $('input', d).value = '';
    d.render();
    d.showModal();
    $('input', d).focus();
  }

  // ---------- Data table (search, filters, sort, pagination, selection, mobile cards) ----------
  function pagerHTML(p, n) {
    const btn = (label, page, attrs) => `<button type="button" class="page-btn" data-page="${page}" ${attrs}>${label}</button>`;
    const nums = [];
    for (let i = 1; i <= n; i++) {
      if (i === 1 || i === n || Math.abs(i - p) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== '…') nums.push('…');
    }
    return btn('<i class="ph ph-caret-left" aria-hidden="true"></i>', p - 1, `aria-label="Previous page"${p === 1 ? ' disabled' : ''}`)
      + nums.map(i => i === '…' ? '<span class="page-gap" aria-hidden="true">…</span>' : btn(i, i, i === p ? 'aria-current="page"' : `aria-label="Page ${i}"`)).join('')
      + btn('<i class="ph ph-caret-right" aria-hidden="true"></i>', p + 1, `aria-label="Next page"${p === n ? ' disabled' : ''}`);
  }
  function table(host, cfg) {
    host = typeof host === 'string' ? $(host) : host;
    const tbl = $('table', host), search = $('[data-table-search]', host), info = $('[data-table-info]', host);
    const pager = $('[data-table-pager]', host), bulk = $('[data-table-bulk]', host);
    const cols = cfg.columns, size = cfg.pageSize || 8, sel = new Set(), filters = {};
    let data = cfg.data, q = search?.value || '', page = 1, sortKey = cfg.sort?.[0] || null, dir = cfg.sort?.[1] || 'asc';
    const span = cols.length + (cfg.selectable ? 1 : 0);
    tbl.classList.toggle('is-clickable', cfg.rowClick !== false);
    tbl.innerHTML = `${cfg.caption ? `<caption class="sr-only">${esc(cfg.caption)}</caption>` : ''}<thead><tr>${cfg.selectable ? '<th class="cell-check"><input type="checkbox" data-select-all aria-label="Select all rows on this page"></th>' : ''}${cols.map(c =>
      `<th scope="col" class="${c.cls || ''}"${c.sortable ? ' aria-sort="none"' : ''}>${c.sortable ? `<button type="button" class="th-sort" data-sort="${c.key}">${c.label}<i class="ph ph-caret-up-down" aria-hidden="true"></i></button>` : (c.label || '<span class="sr-only">Actions</span>')}</th>`).join('')}</tr></thead><tbody></tbody>`;
    const body = $('tbody', tbl);

    const rows = () => {
      const needle = q.trim().toLowerCase();
      let r = data.filter(row =>
        (!needle || (cfg.search || Object.keys(row)).some(k => String(row[k] ?? '').toLowerCase().includes(needle)))
        && Object.entries(filters).every(([k, v]) => !v || v === 'all' || (cfg.filters?.[k] ? cfg.filters[k](row, v) : String(row[k]) === v)));
      if (sortKey) {
        const val = cols.find(c => c.key === sortKey)?.sortValue || (x => x[sortKey]);
        r = [...r].sort((a, b) => { const x = val(a), y = val(b); return (x > y) - (x < y); });
        if (dir === 'desc') r.reverse();
      }
      return r;
    };
    function syncBulk() {
      const all = $('[data-select-all]', tbl), boxes = $$('[data-select]', body), n = boxes.filter(b => b.checked).length;
      if (all) { all.checked = n > 0 && n === boxes.length; all.indeterminate = n > 0 && n < boxes.length; }
      if (bulk) { bulk.hidden = !sel.size; const c = $('[data-bulk-count]', bulk); if (c) c.textContent = sel.size; }
    }
    function render() {
      const all = rows(), pages = Math.max(1, Math.ceil(all.length / size));
      page = Math.min(Math.max(1, page), pages);
      const start = (page - 1) * size, list = all.slice(start, start + size);
      body.innerHTML = list.length ? list.map(r => `<tr data-id="${esc(r.id)}"${sel.has(r.id) ? ' class="is-selected"' : ''}>${cfg.selectable
        ? `<td class="cell-check"><input type="checkbox" data-select value="${esc(r.id)}" aria-label="Select ${esc(r.name || r.id)}"${sel.has(r.id) ? ' checked' : ''}></td>` : ''}${cols.map(c =>
        `<td class="${c.cls || ''}" data-label="${esc(c.label || '')}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('')
        : `<tr class="empty-row"><td colspan="${span}"><div class="empty"><span class="icon-tile tone-neutral"><i class="ph ph-magnifying-glass"></i></span><h3>No results found</h3><p>Try a different search term or clear the filters.</p></div></td></tr>`;
      if (info) info.textContent = all.length ? `Showing ${start + 1}–${start + list.length} of ${all.length}` : 'No results';
      if (pager) pager.innerHTML = pagerHTML(page, pages);
      $$('th[aria-sort]', tbl).forEach(th => {
        const k = $('[data-sort]', th).dataset.sort;
        th.setAttribute('aria-sort', k === sortKey ? (dir === 'asc' ? 'ascending' : 'descending') : 'none');
      });
      syncBulk();
      cfg.onRender?.(all);
    }
    search?.addEventListener('input', debounce(() => { q = search.value; page = 1; render(); }, 120));
    $$('[data-table-filter]', host).forEach(s => s.addEventListener('change', () => { filters[s.dataset.tableFilter] = s.value; page = 1; render(); }));
    tbl.addEventListener('click', e => {
      const s = e.target.closest('[data-sort]');
      if (s) { dir = sortKey === s.dataset.sort && dir === 'asc' ? 'desc' : 'asc'; sortKey = s.dataset.sort; render(); return; }
      if (cfg.rowClick === false || e.target.closest('a, button, input, select, label, .dropdown')) return;
      const link = e.target.closest('tbody tr')?.querySelector('a[href]');
      if (link) location.href = link.href;
    });
    tbl.addEventListener('change', e => {
      const b = e.target;
      if (b.matches('[data-select-all]')) $$('[data-select]', body).forEach(x => { x.checked = b.checked; x.closest('tr').classList.toggle('is-selected', b.checked); b.checked ? sel.add(x.value) : sel.delete(x.value); });
      if (b.matches('[data-select]')) { b.checked ? sel.add(b.value) : sel.delete(b.value); b.closest('tr').classList.toggle('is-selected', b.checked); }
      syncBulk();
    });
    pager?.addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b && !b.disabled) { page = +b.dataset.page; render(); } });
    render();
    return {
      render,
      get data() { return data; },
      set data(d) { data = d; render(); },
      filter(k, v) { filters[k] = v; page = 1; render(); },
      search(v) { q = v; page = 1; render(); },
      get selected() { return [...sel]; },
      clearSelection() { sel.clear(); render(); },
      remove(ids) { const s = new Set(ids); data = data.filter(r => !s.has(r.id)); ids.forEach(i => sel.delete(i)); render(); },
      add(row) { data = [row, ...data]; page = 1; render(); },
      find: id => data.find(r => r.id === id),
    };
  }

  // ---------- Charts (ApexCharts with theme-aware tokens + auto "View data table") ----------
  const cssVar = n => getComputedStyle(root).getPropertyValue(n).trim();
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const merge = (a, b) => { const o = { ...a }; for (const k in b) o[k] = isObj(a?.[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k]; return o; };
  const resolveVars = v => typeof v === 'string' ? (v.startsWith('--') ? cssVar(v) : v)
    : Array.isArray(v) ? v.map(resolveVars)
    : isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveVars(x)])) : v;
  // Axis max rounded up so `ticks` equal steps land on friendly values (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10ⁿ); pair with min: 0
  const niceMax = (v, ticks = 4) => { const raw = v / ticks, p = 10 ** Math.floor(Math.log10(raw)); return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * p).find(s => s >= raw * 0.999) * ticks; };
  const areaFill = { type: 'gradient', gradient: { shadeIntensity: 0, opacityFrom: 0.2, opacityTo: 0.01, stops: [0, 100] } };
  const chartBase = () => {
    const dark = root.dataset.theme === 'dark', muted = cssVar('--text-3');
    return {
      chart: { fontFamily: '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif', background: 'transparent', foreColor: muted, parentHeightOffset: 0,
        toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: !reduceMotion, speed: 450 } },
      theme: { mode: dark ? 'dark' : 'light' },
      colors: [1, 2, 3, 4, 5, 6, 7, 8].map(i => cssVar(`--chart-${i}`)),
      grid: { borderColor: cssVar('--chart-grid'), strokeDashArray: 0, padding: { top: -8, left: 8, right: 8, bottom: 0 }, xaxis: { lines: { show: false } } },
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: 'smooth', lineCap: 'round' },
      markers: { size: 0, strokeWidth: 2, strokeColors: cssVar('--surface'), hover: { size: 5 } },
      legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', fontWeight: 500, labels: { colors: cssVar('--text-2') },
        markers: { size: 5, strokeWidth: 0, offsetX: -3 }, itemMargin: { horizontal: 10, vertical: 4 } },
      tooltip: { theme: dark ? 'dark' : 'light', style: { fontSize: '13px' } },
      xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: muted, fontSize: '12px' } },
        crosshairs: { stroke: { color: cssVar('--border-strong'), width: 1, dashArray: 0 } }, tooltip: { enabled: false } },
      yaxis: { labels: { style: { colors: muted, fontSize: '12px' } } },
      plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: 'end', columnWidth: '45%', barHeight: '56%' }, pie: { donut: { size: '74%' } } },
      states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
      fill: { opacity: 1 },
    };
  };
  const charts = [];
  function chartTable(entry) {
    const o = entry.opts, series = o.series || [], t = entry.table || {};
    const f = t.format || (v => typeof v === 'number' ? fmt.num(v) : v);
    let head, rows;
    if (o.labels && typeof series[0] === 'number') {
      head = [t.label || 'Category', t.value || 'Value'];
      rows = o.labels.map((l, i) => [l, series[i]]);
    } else if (Array.isArray(series[0]?.data)) {
      if (isObj(series[0].data[0])) {
        head = [t.label || '', ...series[0].data.map(p => p.x)];
        rows = series.map(s => [s.name, ...s.data.map(p => p.y)]);
      } else {
        head = [t.label || '', ...series.map(s => s.name || 'Value')];
        rows = (o.xaxis?.categories || o.labels || []).map((c, i) => [c, ...series.map(s => s.data[i])]);
      }
    } else return;
    const html = `<summary><i class="ph ph-table" aria-hidden="true"></i>View data table</summary><div class="table-wrap"><table class="table table-sm"><thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r =>
      `<tr>${r.map((v, i) => i ? `<td class="num">${esc(f(v))}</td>` : `<th scope="row">${esc(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const existing = entry.el.nextElementSibling?.classList.contains('chart-table') ? entry.el.nextElementSibling : null;
    if (existing) { const open = existing.open; existing.innerHTML = html; existing.open = open; }
    else entry.el.insertAdjacentHTML('afterend', `<details class="chart-table">${html}</details>`);
  }
  function chart(target, opts) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el || !window.ApexCharts) return null;
    const { table: tbl, ...o } = opts;
    const entry = {
      el, opts: o, table: tbl,
      build() { return resolveVars(merge(chartBase(), this.opts)); },
      update(patch) { this.opts = merge(this.opts, patch); this.inst.updateOptions(this.build()); if (this.table !== false) chartTable(this); },
    };
    entry.inst = new ApexCharts(el, entry.build());
    entry.inst.render();
    charts.push(entry);
    if (tbl !== false && !o.chart?.sparkline?.enabled) chartTable(entry);
    return entry;
  }
  const sparkline = (target, data, color = '--chart-1', type = 'area') => chart(target, {
    chart: { type, height: 52, sparkline: { enabled: true } },
    series: [{ name: 'Trend', data }],
    colors: [color],
    stroke: { width: type === 'area' ? 2 : 0 },
    fill: type === 'area' ? areaFill : { opacity: 1 },
    plotOptions: { bar: { columnWidth: '58%', borderRadius: 2 } },
    tooltip: { enabled: false },
    table: false,
  });
  document.addEventListener('themechange', () => charts.forEach(c => c.inst.updateOptions(c.build(), false, false)));

  // ---------- Global event delegation ----------
  document.addEventListener('click', e => {
    const t = e.target;
    const toggle = t.closest('[data-dropdown]');
    if (toggle) {
      const dd = toggle.closest('.dropdown');
      dd.classList.contains('open') ? closeDropdowns() : openDropdown(dd, e.detail === 0);
    } else if (!t.closest('.dropdown.open') || t.closest('.dropdown-menu a, .dropdown-menu button')) closeDropdowns();

    const act = t.closest('[data-action]');
    if (act) {
      switch (act.dataset.action) {
        case 'toggle-sidebar': toggleSidebar(); break;
        case 'close-sidebar': setDrawer(false); break;
        case 'toggle-theme': setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); break;
        case 'toggle-sub': act.setAttribute('aria-expanded', String(act.parentElement.classList.toggle('open'))); break;
        case 'open-search': openSearch(); break;
        case 'print': window.print(); break;
        case 'copy': navigator.clipboard?.writeText(act.dataset.copy).then(() => toast('Copied to clipboard')); break;
        case 'toggle-password': {
          const input = $('input', act.parentElement), show = input.type === 'password';
          input.type = show ? 'text' : 'password';
          act.setAttribute('aria-pressed', String(show));
          act.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
          act.innerHTML = `<i class="ph ph-eye${show ? '-slash' : ''}" aria-hidden="true"></i>`;
          break;
        }
      }
    }
    const opener = t.closest('[data-modal]');
    if (opener) { e.preventDefault(); openModal(opener.dataset.modal); }
    if (t.closest('[data-modal-close]')) t.closest('dialog')?.close();
    if (t instanceof HTMLDialogElement && t.classList.contains('modal')) {
      const r = t.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) t.close();
    }
    const tab = t.closest('[role="tab"]');
    if (tab) selectTab(tab);
    const seg = t.closest('[data-segmented] > button');
    if (seg) {
      $$(':scope > button', seg.parentElement).forEach(b => b.setAttribute('aria-pressed', String(b === seg)));
      seg.parentElement.dispatchEvent(new CustomEvent('segment', { detail: seg.dataset.value ?? seg.textContent.trim(), bubbles: true }));
    }
    const pressed = t.closest('[data-toggle]');
    if (pressed) pressed.setAttribute('aria-pressed', String(pressed.getAttribute('aria-pressed') !== 'true'));
  });

  document.addEventListener('keydown', e => {
    const k = e.key;
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
    if (k === '/' && !e.target.closest('input, textarea, select, [contenteditable]') && !$('dialog[open]')) { e.preventDefault(); openSearch(); return; }
    if (k === 'Escape') {
      const open = $('.dropdown.open');
      if (open) { closeDropdowns(); $('[data-dropdown]', open)?.focus(); }
      if (root.classList.contains('sidebar-open')) setDrawer(false);
    }
    if (e.target.matches?.('[data-dropdown]') && k === 'ArrowDown') { e.preventDefault(); openDropdown(e.target.closest('.dropdown'), true); return; }
    const menu = e.target.closest?.('.dropdown.open .dropdown-menu');
    if (menu && (k === 'ArrowDown' || k === 'ArrowUp')) {
      e.preventDefault();
      const items = menuItems(menu), i = items.indexOf(document.activeElement);
      items[(i + (k === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }
    const tab = e.target.closest?.('[role="tab"]');
    if (tab && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(k)) {
      const tabs = $$('[role="tab"]', tab.closest('[role="tablist"]'));
      let i = tabs.indexOf(tab);
      i = k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : (i + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
      e.preventDefault();
      tabs[i].focus();
      selectTab(tabs[i]);
    }
  });

  document.addEventListener('submit', e => {
    const form = e.target;
    if (!form.matches('form[data-validate]')) return;
    e.preventDefault();
    const bad = $$('input, select, textarea', form).filter(f => f.willValidate && !validateField(f));
    if (bad.length) { bad[0].focus(); return; }
    const done = () => {
      form.dispatchEvent(new CustomEvent('valid', { detail: Object.fromEntries(new FormData(form)) }));
      if (form.dataset.success) toast(form.dataset.success);
      if (form.dataset.redirect) { location.href = form.dataset.redirect; return; }
      form.closest('dialog')?.close();
      if (form.dataset.keep === undefined) { form.reset(); clearValidation(form); }
    };
    const btn = e.submitter;
    if (btn) { btn.classList.add('is-loading'); setTimeout(() => { btn.classList.remove('is-loading'); done(); }, 650); } else done();
  });
  document.addEventListener('input', e => { if (e.target.getAttribute?.('aria-invalid') === 'true') validateField(e.target); });
  document.addEventListener('focusout', e => {
    const f = e.target;
    if (f.form?.matches('[data-validate]') && f.willValidate && f.value && f.type !== 'checkbox') validateField(f);
  });
  document.addEventListener('close', e => { if (e.target.matches?.('dialog.modal')) $$('form', e.target).forEach(clearValidation); }, true);

  addEventListener('scroll', e => { if (!(e.target instanceof Element && e.target.closest('.dropdown-menu'))) closeDropdowns(); }, true);
  addEventListener('resize', closeDropdowns);

  // ---------- Init ----------
  const hideIcons = n => {
    if (n.matches?.('i.ph, i.ph-fill')) n.setAttribute('aria-hidden', 'true');
    n.querySelectorAll?.('i.ph, i.ph-fill').forEach(i => i.setAttribute('aria-hidden', 'true'));
  };
  document.addEventListener('DOMContentLoaded', () => {
    buildLayout();
    syncThemeButtons();
    hideIcons(document);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && !(n instanceof SVGElement)) hideIcons(n); })))
      .observe(document.body, { childList: true, subtree: true });
    syncInert();
    desktop.addEventListener('change', () => { root.classList.remove('sidebar-open'); syncInert(); });
  });

  window.App = {
    $, $$, esc, fmt, param, debounce, store, me: ME, nav: NAV,
    avatar, avatars, badge, statusTone, toneOf, initials, delta, rowMenu,
    toast, confirm: confirmDialog, openModal, validate: validateField, table, chart, sparkline, areaFill, niceMax, cssVar, setTheme,
  };
})();
