/* ==========================================================================
   Nimbus Admin — demo data
   Deterministic (seeded) so every page tells the same story; dates are
   relative to today. Swap `window.DB` for real API calls in production.
   ========================================================================== */
(() => {
  'use strict';
  let seed = 20260925;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const pickW = items => { let r = rnd() * items.reduce((s, [, w]) => s + w, 0); for (const [v, w] of items) if ((r -= w) < 0) return v; return items[0][0]; };
  const round = n => Math.round(n * 100) / 100;
  const DAY = 864e5;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const at = (daysAgo, h = 9, m = 0) => { const d = new Date(today.getTime() - daysAgo * DAY); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const minsAgo = m => new Date(Date.now() - m * 60000).toISOString();
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const phone = () => `+1 (${int(201, 989)}) ${int(201, 989)}-${String(int(0, 9999)).padStart(4, '0')}`;
  const slug = s => s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

  const FIRST = ['Liam', 'Sophia', 'Noah', 'Emma', 'James', 'Ava', 'Lucas', 'Mia', 'Ethan', 'Isabella', 'Mason', 'Amelia', 'Logan', 'Evelyn', 'Elijah', 'Charlotte',
    'Aiden', 'Aria', 'Henry', 'Zoe', 'Samuel', 'Chloe', 'Daniel', 'Layla', 'Owen', 'Nora', 'Leo', 'Hannah', 'Ryan', 'Maya', 'Caleb', 'Ella', 'Isaac', 'Lily',
    'Gabriel', 'Grace', 'Julian', 'Priya', 'Mateo', 'Sara', 'Hiro', 'Aisha', 'Diego', 'Yuna', 'Omar', 'Freya', 'Tomás', 'Ingrid'];
  const LAST = ['Nguyen', 'Patel', 'Kim', 'Rodriguez', 'O’Connor', 'Thompson', 'Martin', 'Chen', 'Brooks', 'Rossi', 'Wright', 'Johnson', 'Hughes', 'Park', 'Scott',
    'Davis', 'Walker', 'Adams', 'Singh', 'Foster', 'Mitchell', 'Reed', 'Bennett', 'Turner', 'Hassan', 'Price', 'Williams', 'Fischer', 'Morgan', 'Cooper', 'Gupta',
    'Ward', 'Sanders', 'Bell', 'Silva', 'Tanaka', 'Kowalski', 'Larsen', 'Dubois', 'Okafor'];
  const person = i => `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`; // unique for i < 240
  const COMPANIES = ['Bluepeak Labs', 'Harborview Retail', 'Crescent Health', 'Summit Logistics', 'Evergreen Foods', 'Luma Interiors', 'Orbit Media', 'Pinecrest Realty',
    'Silverline Finance', 'Coral Bay Resorts', 'Nextgen Robotics', 'Maple & Co.', 'Quartz Analytics', 'Riverstone Legal', 'Sunrise Bakery', 'Terra Farms',
    'Urbanest Living', 'Vertex Motors', 'Willow Wellness', 'Zenith Apparel', 'Atlas Engineering', 'Beacon Education', 'Cobalt Security', 'Driftwood Café',
    'Echo Acoustics', 'Fable Books', 'Granite Builders', 'Helix Biotech', 'Ivory Dental', 'Juniper Travel', 'Kestrel Aviation', 'Lighthouse Studio',
    'Monarch Hotels', 'Northgate Supply', 'Oakridge Clinic', 'Paperplane Agency', 'Redwood Capital', 'Sapphire Events', 'Tidewater Marine', 'Upland Coffee',
    'Velvet Beauty', 'Wavelength Audio', 'Yellowbrick Outfitters', 'Cirrus Cloudworks', 'Brightside Solar', 'Cedar & Stone', 'Dunmore Textiles', 'Elmstreet Pharmacy'];
  const CITIES = ['New York, US', 'San Francisco, US', 'Austin, US', 'Chicago, US', 'Seattle, US', 'Boston, US', 'Toronto, CA', 'Vancouver, CA', 'London, UK',
    'Manchester, UK', 'Berlin, DE', 'Munich, DE', 'Paris, FR', 'Amsterdam, NL', 'Madrid, ES', 'Stockholm, SE', 'Singapore, SG', 'Kuala Lumpur, MY', 'Sydney, AU',
    'Melbourne, AU', 'Tokyo, JP', 'Seoul, KR', 'Dubai, AE', 'São Paulo, BR'];
  const domain = c => `${slug(c)}.com`;
  const emailOf = (name, dom) => `${slug(name.split(' ')[0])}.${slug(name.split(' ').slice(1).join(''))}@${dom}`;

  // ---------- People ----------
  const ROLES = [
    ['Sales', 'Sales Manager'], ['Sales', 'Account Executive'], ['Sales', 'Account Executive'], ['Sales', 'Sales Development Rep'], ['Sales', 'Customer Success Lead'], ['Sales', 'Account Executive'],
    ['Engineering', 'Engineering Manager'], ['Engineering', 'Frontend Engineer'], ['Engineering', 'Backend Engineer'], ['Engineering', 'DevOps Engineer'], ['Engineering', 'QA Engineer'], ['Engineering', 'Backend Engineer'], ['Engineering', 'Frontend Engineer'],
    ['Marketing', 'Marketing Lead'], ['Marketing', 'Growth Marketer'], ['Marketing', 'Content Strategist'],
    ['Finance', 'Finance Manager'], ['Finance', 'Financial Analyst'], ['Finance', 'Accountant'],
    ['Operations', 'Operations Manager'], ['Operations', 'Warehouse Supervisor'], ['Operations', 'Logistics Coordinator'], ['Operations', 'Procurement Specialist'],
    ['Human Resources', 'HR Business Partner'], ['Human Resources', 'Recruiter'],
    ['Support', 'Support Team Lead'], ['Support', 'Support Specialist'],
    ['Design', 'Product Designer'],
  ];
  const SALARY = { Manager: [118, 142], Lead: [96, 118], Engineer: [104, 138], Designer: [92, 116], default: [58, 92] };
  const employees = ROLES.map(([department, role], i) => {
    const name = person(i + 120);
    const band = SALARY[Object.keys(SALARY).find(k => role.includes(k)) || 'default'];
    return {
      id: `EMP-${101 + i}`, name, role, department,
      email: emailOf(name, 'nimbus.io'), phone: phone(), location: pick(CITIES),
      status: pickW([['Active', 20], ['Remote', 5], ['On leave', 2]]),
      type: pickW([['Full-time', 22], ['Part-time', 2], ['Contract', 3]]),
      joined: at(int(40, 2300)), salary: int(band[0], band[1]) * 1000,
      attendance: int(88, 100), performance: pickW([['Exceeds', 3], ['Meets', 6], ['Developing', 1]]),
    };
  });
  const salesTeam = employees.filter(e => e.department === 'Sales').map(e => e.name);

  // ---------- Catalog & inventory ----------
  const CATALOG = [
    ['Aurora Wireless Headphones', 'Audio', 129, 'headphones', 'pink'], ['Pulse Smartwatch S2', 'Wearables', 249, 'watch', 'violet'],
    ['Nimbus Book Air 14"', 'Laptops', 1099, 'laptop', 'primary'], ['ErgoFlex Office Chair', 'Furniture', 329, 'armchair', 'warning'],
    ['Voyager Laptop Backpack', 'Accessories', 79, 'backpack', 'success'], ['Lumen LED Desk Lamp', 'Furniture', 59, 'lamp', 'warning'],
    ['Echo Mini Speaker', 'Audio', 89, 'speaker-hifi', 'pink'], ['Tactile Mechanical Keyboard', 'Peripherals', 119, 'keyboard', 'info'],
    ['Glide Wireless Mouse', 'Peripherals', 39, 'mouse', 'info'], ['Vista 27" 4K Monitor', 'Displays', 399, 'monitor', 'primary'],
    ['Snap Mirrorless Camera', 'Cameras', 899, 'camera', 'violet'], ['Nova Phone 12', 'Phones', 799, 'device-mobile', 'primary'],
    ['Brew Pro Coffee Maker', 'Appliances', 149, 'coffee', 'warning'], ['Stride Running Shoes', 'Apparel', 110, 'sneaker', 'success'],
    ['Organic Cotton Tee', 'Apparel', 24, 't-shirt', 'success'], ['Arcade Game Controller', 'Gaming', 69, 'game-controller', 'danger'],
    ['Swift Laser Printer', 'Office', 229, 'printer', 'info'], ['Titan Workstation Tower', 'Computers', 1599, 'desktop-tower', 'primary'],
    ['Fold Tablet 11', 'Tablets', 599, 'device-tablet', 'violet'], ['Link USB-C Hub', 'Accessories', 49, 'usb', 'success'],
    ['Bolt Power Bank 20K', 'Accessories', 45, 'battery-charging', 'success'], ['Studio Condenser Mic', 'Audio', 159, 'microphone', 'pink'],
    ['Shade Polarized Sunglasses', 'Apparel', 89, 'sunglasses', 'warning'], ['Spark Smart Plug (2-pack)', 'Smart Home', 29, 'plug-charging', 'info'],
  ];
  const STOCK = [184, 96, 42, 58, 210, 8, 164, 77, 342, 36, 6, 51, 88, 120, 0, 143, 29, 14, 45, 12, 260, 33, 0, 415];
  const warehouses = [
    { id: 'WH-01', name: 'Austin Central', city: 'Austin, US', capacity: 12000, used: 8640, manager: employees[20].name, skus: 412, icon: 'warehouse' },
    { id: 'WH-02', name: 'Rotterdam Hub', city: 'Rotterdam, NL', capacity: 9000, used: 7470, manager: employees[19].name, skus: 356, icon: 'boat' },
    { id: 'WH-03', name: 'Singapore East', city: 'Singapore, SG', capacity: 7500, used: 3450, manager: employees[21].name, skus: 288, icon: 'airplane-tilt' },
    { id: 'WH-04', name: 'Toronto North', city: 'Toronto, CA', capacity: 5000, used: 4610, manager: employees[22].name, skus: 197, icon: 'truck' },
  ];
  const products = CATALOG.map(([name, category, price, icon, tone], i) => {
    const stock = STOCK[i], reorder = price > 500 ? 15 : 30;
    return {
      id: `PRD-${1001 + i}`, name, category, price, icon, tone,
      sku: `${category.slice(0, 3).toUpperCase()}-${String(1001 + i).slice(1)}`,
      cost: Math.round(price * (0.48 + rnd() * 0.14)), stock, reorder,
      stockStatus: stock === 0 ? 'Out of stock' : stock < reorder ? 'Low stock' : 'In stock',
      warehouse: warehouses[i % warehouses.length].name,
      rating: round(3.9 + rnd() * 1.05), reviews: int(24, 860), sold: int(40, 1400),
      status: i === 23 ? 'Draft' : 'Active', updated: at(int(0, 40)),
    };
  });

  // ---------- CRM ----------
  const customers = Array.from({ length: 48 }, (_, i) => {
    const name = person(i), company = COMPANIES[i];
    return {
      id: `CUS-${1001 + i}`, name, company, email: emailOf(name, domain(company)), phone: phone(), city: pick(CITIES),
      segment: pickW([['SMB', 4], ['Mid-Market', 3], ['Enterprise', 2], ['Startup', 2]]),
      status: pickW([['Active', 8], ['Inactive', 1], ['Churn risk', 1]]),
      ltv: int(18, 980) * 100, orders: int(2, 64), lastOrder: at(int(0, 95)), since: at(int(120, 1800)),
      owner: pick(salesTeam), tags: [pick(['VIP', 'Wholesale', 'Retail', 'Partner']), pick(['Net-30', 'Prepaid', 'Card on file'])],
    };
  });
  const LEAD_TITLES = ['CEO', 'Head of Operations', 'Procurement Manager', 'CTO', 'IT Director', 'Office Manager', 'VP of Sales', 'Founder', 'COO', 'Finance Director'];
  const leads = Array.from({ length: 40 }, (_, i) => {
    const name = person(i + 60), company = COMPANIES[(i * 7 + 5) % COMPANIES.length];
    return {
      id: `LD-${2401 + i}`, name, company, title: pick(LEAD_TITLES), email: emailOf(name, domain(company)), phone: phone(),
      source: pick(['Website', 'Referral', 'LinkedIn', 'Trade show', 'Cold outreach', 'Google Ads', 'Webinar']),
      score: int(18, 98), status: pickW([['New', 3], ['Contacted', 3], ['Qualified', 2], ['Proposal', 1], ['Lost', 1]]),
      owner: pick(salesTeam), value: int(2, 60) * 1000, created: at(int(0, 45), int(8, 18)),
    };
  });
  const STAGES = [
    { id: 'prospecting', name: 'Prospecting', prob: 10, color: '--chart-7' },
    { id: 'qualification', name: 'Qualification', prob: 25, color: '--chart-2' },
    { id: 'proposal', name: 'Proposal', prob: 50, color: '--chart-4' },
    { id: 'negotiation', name: 'Negotiation', prob: 75, color: '--chart-5' },
    { id: 'won', name: 'Closed Won', prob: 100, color: '--chart-3' },
  ];
  const DEAL_TYPES = ['Annual license', 'Hardware refresh', 'Pilot project', 'Seat expansion', 'Renewal', 'Onboarding package', 'Warehouse rollout', 'Support upgrade'];
  const deals = [6, 5, 5, 4, 4].flatMap((n, s) => Array.from({ length: n }, (_, k) => {
    const c = customers[(s * 9 + k * 4 + 3) % customers.length];
    return {
      id: `DL-${510 + s * 10 + k}`, title: pick(DEAL_TYPES), company: c.company, contact: c.name, customerId: c.id,
      value: int(4, 120) * 1000, stage: STAGES[s].id, probability: STAGES[s].prob, owner: pick(salesTeam),
      close: at(-int(3, 75)), priority: pickW([['High', 2], ['Medium', 3], ['Low', 2]]),
    };
  }));

  // ---------- Sales ----------
  const METHODS = ['Visa •••• 4242', 'Mastercard •••• 8210', 'Amex •••• 3005', 'PayPal', 'Bank transfer'];
  const orders = Array.from({ length: 64 }, (_, i) => {
    const c = customers[int(0, customers.length - 1)], items = [];
    for (let k = int(1, 4); k > 0; k--) {
      const p = pick(products);
      if (!items.some(x => x.productId === p.id)) items.push({ productId: p.id, name: p.name, sku: p.sku, icon: p.icon, tone: p.tone, qty: int(1, 4), price: p.price });
    }
    const subtotal = items.reduce((s, x) => s + x.qty * x.price, 0);
    const discount = rnd() < 0.25 ? round(subtotal * 0.1) : 0;
    const shipping = subtotal > 300 ? 0 : 12;
    const tax = round((subtotal - discount) * 0.08);
    const status = i < 7 ? pickW([['Pending', 3], ['Processing', 4]]) : pickW([['Delivered', 7], ['Shipped', 2], ['Processing', 1], ['Cancelled', 1]]);
    return {
      id: `ORD-${24890 - i}`, customerId: c.id, customer: c.name, email: c.email, company: c.company, phone: c.phone,
      date: at(Math.floor(i * 1.4), int(8, 20), int(0, 59)), items, subtotal, discount, shipping, tax,
      total: round(subtotal - discount + shipping + tax), status,
      payment: status === 'Cancelled' ? 'Refunded' : status === 'Pending' ? 'Unpaid' : 'Paid',
      method: pick(METHODS), channel: pickW([['Online store', 5], ['Marketplace', 2], ['Sales rep', 2], ['Retail', 1]]),
      address: `${int(12, 980)} ${pick(['Maple Ave', 'Harbor St', 'Oak Lane', 'Sunset Blvd', 'King St W', 'Market St'])}, ${c.city}`,
      carrier: pick(['UPS Ground', 'DHL Express', 'FedEx 2Day']), tracking: `1Z${int(100000, 999999)}${int(1000, 9999)}`,
    };
  });
  const SERVICES = [['Annual platform license', 4800], ['Implementation services (hours)', 150], ['Premium support plan', 1200], ['Hardware bundle', 2350],
    ['Data migration', 1800], ['User training session', 650], ['Custom integration', 3200], ['Additional user seats', 240]];
  const invoices = Array.from({ length: 36 }, (_, i) => {
    const c = customers[(i * 5 + 2) % customers.length], issued = i * 3 + int(0, 2);
    const lines = Array.from({ length: int(1, 4) }, (_, k) => { const [desc, rate] = SERVICES[(i + k * 3) % SERVICES.length]; return { desc, qty: desc.includes('hours') ? int(8, 40) : int(1, 5), rate }; });
    const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0), tax = round(subtotal * 0.08);
    const due = issued - 30;
    const status = i % 11 === 3 ? 'Draft' : due < 0 ? pickW([['Pending', 4], ['Paid', 3]]) : pickW([['Paid', 7], ['Overdue', 2]]);
    return {
      id: `INV-${today.getFullYear()}-${String(148 - i).padStart(4, '0')}`, customerId: c.id, customer: c.name, company: c.company, email: c.email, city: c.city,
      issued: at(issued), due: at(due), lines, subtotal, tax, total: round(subtotal + tax), status,
    };
  });

  // ---------- Procurement ----------
  const SUPPLIER_LIST = [['Brightway Electronics', 'Electronics', 'China'], ['Nordic Furniture Works', 'Furniture', 'Sweden'], ['Pacific Audio Components', 'Audio', 'Taiwan'],
    ['Keystone Office Supply', 'Office', 'United States'], ['Greenleaf Textiles', 'Apparel', 'Portugal'], ['Alpine Packaging Co.', 'Packaging', 'Switzerland'],
    ['Delta Freight Partners', 'Logistics', 'Netherlands'], ['Sakura Optics', 'Cameras', 'Japan'], ['Maple Leaf Paper', 'Office', 'Canada'],
    ['Rhine Precision Parts', 'Components', 'Germany'], ['Coastal Displays Ltd.', 'Displays', 'South Korea'], ['Andes Home Appliances', 'Appliances', 'Chile']];
  const suppliers = SUPPLIER_LIST.map(([name, category, country], i) => {
    const contact = person(i + 170);
    return {
      id: `SUP-${String(i + 1).padStart(2, '0')}`, name, category, country, contact, email: emailOf(contact, domain(name)), phone: phone(),
      rating: round(3.6 + rnd() * 1.3), onTime: int(82, 99), leadTime: int(5, 35), openPOs: int(0, 6), spend: int(40, 620) * 1000,
      status: i === 5 ? 'On hold' : 'Active', since: at(int(300, 2400)),
    };
  });
  const purchaseOrders = Array.from({ length: 22 }, (_, i) => {
    const s = suppliers[(i * 5) % suppliers.length], date = i * 3 + int(0, 2);
    const lines = Array.from({ length: int(1, 4) }, () => { const p = pick(products); return { name: p.name, sku: p.sku, qty: int(10, 120), cost: p.cost }; });
    return {
      id: `PO-${3420 - i}`, supplierId: s.id, supplier: s.name, date: at(date), expected: at(date - s.leadTime), lines,
      amount: lines.reduce((t, l) => t + l.qty * l.cost, 0),
      status: i < 3 ? pick(['Draft', 'Sent']) : i < 7 ? pickW([['Sent', 2], ['Partially received', 2]]) : pickW([['Received', 8], ['Cancelled', 1]]),
      buyer: employees[22].name,
    };
  });

  // ---------- Finance ----------
  const TRX = [
    ['Payment received', 'Sales', 1], ['Payroll run', 'Payroll', -1], ['Office rent', 'Rent', -1], ['Cloud hosting', 'Software', -1], ['Google Workspace', 'Software', -1],
    ['Freight — Delta Freight Partners', 'Shipping', -1], ['Facebook & Google Ads', 'Marketing', -1], ['Utilities', 'Utilities', -1], ['Refund issued', 'Sales', -1], ['Supplier payment', 'Inventory', -1],
  ];
  const ACCOUNTS = ['Operating •••• 4821', 'Savings •••• 7730', 'Corporate card •••• 1024'];
  const transactions = Array.from({ length: 40 }, (_, i) => {
    const [desc, category, sign] = i % 3 === 0 ? TRX[0] : pick(TRX);
    const inv = invoices[i % invoices.length];
    const amount = sign > 0 ? inv.total : -(category === 'Payroll' ? int(180, 240) * 1000 : category === 'Rent' ? 18500 : int(4, 900) * 25);
    return {
      id: `TRX-${88120 - i}`, date: at(Math.floor(i * 1.2), int(8, 18), int(0, 59)),
      description: sign > 0 ? `${desc} — ${inv.company}` : desc, category, account: category === 'Marketing' || category === 'Software' ? ACCOUNTS[2] : ACCOUNTS[0],
      amount, status: i < 3 ? 'Pending' : 'Completed', reference: sign > 0 ? inv.id : `REF-${int(10000, 99999)}`,
    };
  });
  const EXP_CATS = [['Travel', 'airplane-tilt', 'info'], ['Meals', 'fork-knife', 'warning'], ['Software', 'desktop', 'primary'], ['Office supplies', 'paperclip', 'success'],
    ['Marketing', 'megaphone', 'pink'], ['Training', 'graduation-cap', 'violet'], ['Equipment', 'laptop', 'neutral']];
  const EXP_DESC = { Travel: ['Flight to Chicago — client visit', 'Hotel, 2 nights — RetailX trade show', 'Taxi to airport'], Meals: ['Client lunch — Bluepeak Labs', 'Team dinner after launch', 'Coffee with supplier'],
    Software: ['Figma annual seats', 'Analytics tool subscription', 'Password manager renewal'], 'Office supplies': ['Printer paper & toner', 'Whiteboard markers', 'Desk organizers'],
    Marketing: ['Trade show booth deposit', 'Sponsored newsletter slot', 'Printed brochures'], Training: ['Online course — advanced Excel', 'Leadership workshop', 'AWS certification exam'],
    Equipment: ['External monitor', 'Noise-cancelling headset', 'Laptop stand'] };
  const expenses = Array.from({ length: 30 }, (_, i) => {
    const [category, icon, tone] = pick(EXP_CATS), e = employees[int(0, employees.length - 1)];
    return {
      id: `EXP-${6120 - i}`, date: at(Math.floor(i * 1.5)), employee: e.name, department: e.department, category, icon, tone,
      description: pick(EXP_DESC[category]), amount: round(int(1200, 185000) / 100), receipt: rnd() > 0.15,
      status: i < 6 ? 'Pending' : pickW([['Approved', 4], ['Reimbursed', 5], ['Rejected', 1]]),
    };
  });
  const budgets = EXP_CATS.map(([category, icon, tone], i) => ({ category, icon, tone, budget: [24000, 6000, 18000, 4000, 30000, 9000, 15000][i], spent: [17640, 5210, 16420, 1980, 21300, 4150, 15800][i] }));

  // ---------- Workspace ----------
  const PROJECTS = [
    ['Website Redesign', 'Bluepeak Labs', 'Active', 72, 'primary', 'browser'], ['ERP Migration — Phase 2', 'Summit Logistics', 'Active', 45, 'violet', 'database'],
    ['Mobile App Launch', 'Harborview Retail', 'At risk', 38, 'danger', 'device-mobile'], ['Warehouse Automation', 'Northgate Supply', 'Active', 61, 'info', 'robot'],
    ['Customer Portal', 'Crescent Health', 'On hold', 24, 'warning', 'users-three'], ['Q4 Marketing Campaign', 'Internal', 'Active', 83, 'pink', 'megaphone'],
    ['Data Warehouse Setup', 'Quartz Analytics', 'Completed', 100, 'success', 'chart-bar'], ['POS Integration', 'Sunrise Bakery', 'Active', 55, 'primary', 'storefront'],
    ['Security Audit', 'Cobalt Security', 'Completed', 100, 'success', 'shield-check'],
  ];
  const projects = PROJECTS.map(([name, client, status, progress, tone, icon], i) => {
    const total = int(18, 64), budget = int(20, 180) * 1000;
    return {
      id: `PRJ-${301 + i}`, name, client, status, progress, tone, icon,
      due: at(status === 'Completed' ? int(5, 60) : -int(10, 120)), budget, spent: Math.round(budget * Math.min(1.08, progress / 100 + (rnd() - 0.3) * 0.2)),
      team: Array.from({ length: int(3, 6) }, (_, k) => employees[(i * 3 + k * 5) % employees.length].name),
      tasks: { done: Math.round(total * progress / 100), total },
    };
  });
  const TASKS = [
    ['Design new onboarding flow', 'progress', 'High', ['Design']], ['Fix invoice PDF rounding bug', 'review', 'High', ['Bug', 'Backend']],
    ['Set up staging environment', 'done', 'Medium', ['DevOps']], ['Write Q4 campaign brief', 'todo', 'Medium', ['Marketing']],
    ['Migrate customer notes to CRM', 'progress', 'Medium', ['Backend']], ['Supplier scorecard dashboard', 'todo', 'Low', ['Frontend', 'Design']],
    ['User interviews — procurement', 'review', 'Medium', ['Research']], ['Update stock reorder rules', 'todo', 'High', ['Ops']],
    ['Accessibility audit of checkout', 'progress', 'High', ['Frontend']], ['Payroll export to accounting', 'done', 'Medium', ['Backend']],
    ['Prepare board meeting deck', 'todo', 'High', ['Finance']], ['Localize email templates', 'todo', 'Low', ['Marketing']],
    ['Warehouse barcode scanner test', 'review', 'Medium', ['Ops', 'QA']], ['Dark mode for reports', 'done', 'Low', ['Frontend']],
    ['Customer churn model v2', 'progress', 'Medium', ['Research']], ['Renew SSL certificates', 'done', 'High', ['DevOps']],
    ['Plan team offsite', 'todo', 'Low', ['Ops']], ['Review vendor contracts', 'review', 'Medium', ['Finance']],
  ];
  const tasks = TASKS.map(([title, status, priority, tags], i) => {
    const sub = int(2, 8);
    return {
      id: `TSK-${1201 + i}`, title, status, priority, tags, project: projects[i % projects.length].name,
      due: at(-int(-3, 18)), assignees: Array.from({ length: int(1, 3) }, (_, k) => employees[(i * 4 + k * 7) % employees.length].name),
      comments: int(0, 14), attachments: int(0, 5), subtasks: { done: status === 'done' ? sub : int(0, sub - 1), total: sub },
    };
  });
  const EVENTS = {
    meeting: ['Weekly sales sync', 'Product roadmap review', 'Board prep', '1:1 with Sophia', 'Design critique', 'Quarterly business review', 'Budget planning'],
    call: ['Call with Bluepeak Labs', 'Demo — Harborview Retail', 'Supplier check-in', 'Renewal call — Crescent Health'],
    deadline: ['Quarterly tax filing', 'Payroll cutoff', 'Invoice batch due', 'Contract renewal deadline'],
    event: ['Team offsite', 'RetailX trade show', 'Webinar: ERP best practices', 'Customer meetup'],
    training: ['New hire onboarding', 'Security awareness training', 'CRM power-user workshop'],
    personal: ['Dentist appointment', 'Gym session', 'Lunch with Maya'],
  };
  const events = [];
  for (let d = -24; d <= 38; d++) {
    const date = new Date(today.getTime() + d * DAY), dow = date.getDay();
    const n = dow === 0 || dow === 6 ? (rnd() < 0.15 ? 1 : 0) : pickW([[0, 3], [1, 4], [2, 2], [3, 1]]);
    for (let k = 0; k < n; k++) {
      const category = pickW([['meeting', 5], ['call', 3], ['deadline', 1], ['event', 1], ['training', 1], ['personal', 1]]);
      const h = int(8, 16), dur = category === 'deadline' ? 0 : pick([30, 45, 60, 90]);
      events.push({
        id: `EV-${events.length + 1}`, title: pick(EVENTS[category]), date: ymd(date), category,
        start: `${String(h).padStart(2, '0')}:${pick(['00', '30'])}`, duration: dur,
        location: category === 'call' ? 'Video call' : category === 'meeting' ? pick(['Room Aurora', 'Room Cirrus', 'Video call']) : category === 'event' ? 'Offsite' : '',
      });
    }
  }
  events.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  // ---------- Communication ----------
  const convos = [
    ['Sophia Patel', 'Account Executive', true, 2, [
      ['them', 'Morning! Bluepeak Labs just confirmed they want to move ahead with the annual license.', 1460], ['me', 'That’s fantastic news. Did they agree to the 3-year term?', 1452],
      ['them', 'They prefer 1 year with an option to extend. Procurement is asking for a 5% discount.', 1440], ['me', 'Let’s offer 4% with net-30 terms. I’ll approve it on my side.', 1400],
      ['them', 'Perfect, I’ll update the proposal and send it over before lunch.', 42], ['them', 'Sent! Could you check the pricing table on page 3?', 6]]],
    ['Daniel Foster', 'Warehouse Supervisor', true, 1, [
      ['them', 'Heads up: Lumen LED Desk Lamps are down to 8 units in Austin.', 190], ['me', 'Thanks Daniel. Is there stock in Rotterdam we can transfer?', 185],
      ['them', 'About 60 units. Transfer would take 6 days though.', 170], ['me', 'Let’s raise a PO with Nordic Furniture Works instead — faster.', 160],
      ['them', 'On it. I’ll flag it as urgent.', 34]]],
    ['Maya Gupta', 'Product Designer', false, 0, [
      ['me', 'Hi Maya! How are the new dashboard mockups coming along?', 2900], ['them', 'Almost there — I softened the palette and rounded the cards like we discussed.', 2890],
      ['them', 'I’ll share the Figma link after the design review tomorrow.', 2880], ['me', 'Love it. Can you include a dark mode variant too?', 1500],
      ['them', 'Already done — uploading now.', 1490]]],
    ['Liam Nguyen', 'Customer · Bluepeak Labs', false, 0, [
      ['them', 'Hello, our order #ORD-24887 shows as processing. Any update on delivery?', 4400], ['me', 'Hi Liam! It ships today via DHL Express — you’ll get tracking within the hour.', 4380],
      ['them', 'Great, thank you for the quick response!', 4370]]],
    ['Finance Team', '4 members', true, 3, [
      ['them', 'Reminder: month-end close starts Thursday.', 700], ['them', 'Please submit all outstanding expense reports by Wednesday EOD.', 690],
      ['me', 'Noted. I’ll approve the pending ones today.', 600], ['them', 'Payroll export is ready for review.', 58]]],
    ['Aisha Hassan', 'Recruiter', false, 0, [
      ['them', 'I’ve scheduled three final interviews for the Backend Engineer role next week.', 5800], ['me', 'Thanks! Please add me to Tuesday’s panel.', 5750],
      ['them', 'Done — invite sent.', 5740]]],
    ['Owen Price', 'Procurement Specialist', true, 0, [
      ['them', 'PO-3419 for Brightway Electronics needs your approval.', 8700], ['me', 'Approved. Please confirm the delivery window with them.', 8600]]],
    ['Grace Morgan', 'Customer · Luma Interiors', false, 0, [
      ['them', 'Could you resend invoice INV for September? Our AP team can’t find it.', 11000], ['me', 'Of course — resending now to accounts@lumainteriors.com.', 10950]]],
  ];
  const conversations = convos.map(([name, role, online, unread, msgs], i) => ({
    id: `CV-${i + 1}`, name, role, online, unread,
    messages: msgs.map(([from, text, m]) => ({ from, text, time: minsAgo(m) })),
  }));

  const MAILS = [
    ['Sophia Patel', 'sophia.patel@nimbus.io', 'Revised proposal — Bluepeak Labs', 'Work', 0.02, true, true, ['Bluepeak-proposal-v3.pdf'],
      'Hi Olivia,\n\nAttached is the revised proposal with the 4% discount and net-30 payment terms we discussed. Procurement will review it on Thursday.\n\nLet me know if you’d like any changes to the implementation timeline before I send it.\n\nThanks,\nSophia'],
    ['NimbusPay Payouts', 'payouts@nimbuspay.io', 'Your payout of $48,210.44 is on its way', 'Finance', 0.1, true, false, [],
      'Hello,\n\nA payout of $48,210.44 has been initiated to your account ending in 4821. Funds usually arrive within 1–2 business days.\n\nYou can review the payout breakdown in your finance dashboard.'],
    ['Daniel Foster', 'daniel.foster@nimbus.io', 'Low stock report — Austin Central', 'Work', 0.3, true, false, ['low-stock-austin.csv'],
      'Hi team,\n\nFive SKUs dropped below their reorder point overnight. The desk lamps and mirrorless cameras are the most urgent.\n\nI’ve attached the full report. Please approve the draft POs when you get a chance.\n\nDaniel'],
    ['Crescent Health', 'ap@crescenthealth.com', 'Re: Invoice INV-2026-0141', 'Finance', 0.8, false, true, [],
      'Hi Olivia,\n\nThanks for sending the invoice. Payment has been scheduled for Friday via bank transfer.\n\nBest regards,\nAccounts Payable'],
    ['Maya Gupta', 'maya.gupta@nimbus.io', 'Dashboard mockups (light + dark)', 'Work', 1.2, false, true, ['dashboard-light.png', 'dashboard-dark.png'],
      'Hey Olivia,\n\nHere are the updated dashboard mockups in both themes. I softened the palette and increased the card radius to 18px.\n\nWould love your feedback before Friday’s review.\n\nMaya'],
    ['Security', 'security@nimbus.io', 'New sign-in from Chrome on Windows', 'Updates', 1.6, false, false, [],
      'We noticed a new sign-in to your Nimbus account from Chrome on Windows (Austin, US).\n\nIf this was you, no action is needed. Otherwise, reset your password and review active sessions in Settings → Security.'],
    ['Aisha Hassan', 'aisha.hassan@nimbus.io', 'Interview schedule — Backend Engineer', 'Work', 2.1, false, false, [],
      'Hi Olivia,\n\nFinal interviews are booked for Tuesday and Wednesday next week. You’re on Tuesday’s panel at 2:00 PM.\n\nThanks,\nAisha'],
    ['Harborview Retail', 'orders@harborviewretail.com', 'Bulk order request — 120 office chairs', 'Work', 2.9, false, false, ['requirements.pdf'],
      'Hello,\n\nWe’re refurbishing three stores and would like a quote for 120 ErgoFlex Office Chairs with delivery in November.\n\nPlease include volume pricing and lead time.\n\nKind regards,\nPurchasing Team'],
    ['Nimbus Product', 'product@nimbus.io', 'What’s new: automated reorder rules', 'Updates', 4, false, false, [],
      'Automated reorder rules are now available for all Pro workspaces. Set minimum stock levels per warehouse and Nimbus will draft purchase orders for you.'],
    ['Ryan Cooper', 'ryan.cooper@redwoodcapital.com', 'Quarterly investor update', 'Personal', 5, false, false, [],
      'Hi Olivia,\n\nLooking forward to the quarterly update. Could you share the revenue and cash-flow summary a day ahead of the call?\n\nBest,\nRyan'],
    ['Travel Desk', 'travel@nimbus.io', 'Itinerary: RetailX trade show', 'Personal', 6, false, false, ['itinerary.pdf'],
      'Your flights and hotel for the RetailX trade show are confirmed. Your boarding passes will be available 24 hours before departure.'],
  ];
  const emails = MAILS.map(([from, email, subject, label, days, unread, starred, attachments, body], i) => ({
    id: `ML-${i + 1}`, from, email, subject, label, unread, starred, attachments, body, folder: 'inbox',
    snippet: body.replace(/\n+/g, ' ').replace(/^(Hi|Hello|Hey)[^,]*,\s*/, '').slice(0, 120), date: minsAgo(days * 1440 + 20),
  }));
  emails.push(
    { id: 'ML-S1', from: 'Olivia Carter', email: 'olivia.carter@nimbus.io', to: 'Sophia Patel', subject: 'Re: Discount approval', label: 'Work', unread: false, starred: false, attachments: [], folder: 'sent',
      body: 'Approved — go ahead with 4% and net-30.\n\nOlivia', snippet: 'Approved — go ahead with 4% and net-30.', date: minsAgo(1400) },
    { id: 'ML-S2', from: 'Olivia Carter', email: 'olivia.carter@nimbus.io', to: 'Finance Team', subject: 'Expense policy update', label: 'Finance', unread: false, starred: false, attachments: ['expense-policy.pdf'], folder: 'sent',
      body: 'Hi all,\n\nPlease find the updated expense policy attached. Changes take effect next month.\n\nOlivia', snippet: 'Please find the updated expense policy attached.', date: minsAgo(4300) },
    { id: 'ML-D1', from: 'Olivia Carter', email: 'olivia.carter@nimbus.io', to: 'Board', subject: 'Q3 summary (draft)', label: 'Work', unread: false, starred: false, attachments: [], folder: 'drafts',
      body: 'Revenue grew 18.4% year over year, driven by…', snippet: 'Revenue grew 18.4% year over year, driven by…', date: minsAgo(300) },
    { id: 'ML-P1', from: 'Prize Center', email: 'win@lucky-prizes.biz', subject: 'You have won a gift card!!!', label: 'Updates', unread: true, starred: false, attachments: [], folder: 'spam',
      body: 'Click to claim your reward.', snippet: 'Click to claim your reward.', date: minsAgo(900) },
  );

  const notifications = [
    ['New order received', 'ORD-24890 from Harborview Retail · $1,284.00', 'shopping-cart-simple', 'primary', 8, true, 'order-detail.html?id=ORD-24890', 'Orders'],
    ['Payment received', 'Crescent Health paid INV-2026-0141', 'currency-dollar', 'success', 42, true, 'invoices.html', 'Finance'],
    ['Low stock alert', 'Lumen LED Desk Lamp — 8 units left', 'warning', 'warning', 95, true, 'inventory.html', 'Inventory'],
    ['Sophia mentioned you', '“Could you check the pricing table on page 3?”', 'at', 'violet', 130, false, 'messages.html', 'Mentions'],
    ['New lead assigned', 'Hannah Kim from Beacon Education', 'user-plus', 'info', 240, false, 'leads.html', 'CRM'],
    ['Deal won', 'Seat expansion — Quartz Analytics · $48,000', 'trophy', 'success', 380, false, 'deals.html', 'CRM'],
    ['Invoice overdue', 'INV-2026-0128 is 12 days overdue', 'receipt', 'danger', 600, false, 'invoices.html', 'Finance'],
    ['Leave request', 'Aiden Walker requested 3 days off', 'calendar-check', 'pink', 900, false, 'attendance.html', 'People'],
    ['Report ready', 'September sales report is ready to download', 'file-text', 'primary', 1500, false, 'reports.html', 'System'],
    ['Purchase order received', 'PO-3412 fully received at Austin Central', 'truck', 'info', 2100, false, 'purchase-orders.html', 'Inventory'],
    ['New team member', 'Nora Mitchell joined the Finance team', 'user-circle', 'violet', 3000, false, 'employees.html', 'People'],
    ['Security sign-in', 'New sign-in from Chrome on Windows', 'shield-check', 'neutral', 4200, false, 'settings.html', 'System'],
    ['Task due tomorrow', 'Prepare board meeting deck', 'check-square', 'warning', 5000, false, 'tasks.html', 'Mentions'],
    ['System update', 'Nimbus 4.2 adds automated reorder rules', 'sparkle', 'primary', 9000, false, 'help.html', 'System'],
  ].map(([title, text, icon, tone, m, unread, href, type], i) => ({ id: `NT-${i + 1}`, title, text, icon, tone, time: minsAgo(m), unread, href, type }));

  const activity = [
    ['Sophia Patel', 'closed a deal with', 'Quartz Analytics', '$48,000 seat expansion', 'trophy', 'success', 14],
    ['Daniel Foster', 'created purchase order', 'PO-3420', 'Nordic Furniture Works · 120 units', 'truck', 'info', 52],
    ['Olivia Carter', 'approved 4 expense reports', 'Expenses', 'Total $3,284.50', 'check-circle', 'primary', 97],
    ['Liam Nguyen', 'placed order', 'ORD-24887', '3 items · $2,146.80', 'shopping-cart-simple', 'violet', 180],
    ['Aisha Hassan', 'added a new employee', 'Nora Mitchell', 'Financial Analyst · Finance', 'user-plus', 'pink', 320],
    ['System', 'flagged low stock for', 'Snap Mirrorless Camera', '6 units remaining', 'warning', 'warning', 610],
  ].map(([who, action, target, meta, icon, tone, m]) => ({ who, action, target, meta, icon, tone, time: minsAgo(m) }));

  // ---------- Time series ----------
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months = Array.from({ length: 12 }, (_, i) => MONTHS[(today.getMonth() + 1 + i) % 12]);
  const revenue = months.map((_, i) => Math.round(36000 + 8000 * Math.sin((i + 3) / 12 * 2 * Math.PI) + i * 1650 + int(-2200, 2200)));
  const revenuePrev = revenue.map(v => Math.round(v * (0.78 + rnd() * 0.1)));
  const expensesSeries = revenue.map(v => Math.round(v * (0.58 + rnd() * 0.1)));

  window.DB = {
    today, employees, salesTeam, warehouses, products, customers, leads, stages: STAGES, deals, orders, invoices, suppliers, purchaseOrders,
    transactions, expenses, budgets, projects, tasks, events, conversations, emails, notifications, activity,
    months, revenue, revenuePrev, expensesSeries, ymd,
    find: (collection, id) => window.DB[collection].find(x => x.id === id),
  };
})();
