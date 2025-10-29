/* main.js - loads JSON data, renders UI, filters, analytics, contact POST
   Note: CONTACT_BACKEND_URL should be left as '/contact' if backend served same host,
   or replaced with full backend URL when backend is hosted separately.
*/
(async function(){
  const CONTACT_BACKEND_URL = '/contact'; // change if backend is hosted elsewhere

  // load data from JSON files
  async function loadJSON(path){
    const res = await fetch(path);
    return await res.json();
  }

  const skills = await loadJSON('/storage/emulated/0/skills.json');
  const projects = await loadJSON('/storage/emulated/0/projects.json');
  const experience = await loadJSON('/storage/emulated/0/experience.json');

  // UI refs
  const skillsGrid = document.getElementById('skillsGrid');
  const projectsGrid = document.getElementById('projectsGrid');
  const chipsEl = document.getElementById('chips');
  const sortSelect = document.getElementById('sortSelect');
  const searchProject = document.getElementById('searchProject');

  // theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
  body.setAttribute('data-theme', savedTheme);
  themeToggle.addEventListener('click', ()=>{
    const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
  });

  // typed tagline
  const typedEl = document.getElementById('typed');
  const messages = ["Web Developer", "AI Enthusiast", "Cybersecurity Learner", "Data Explorer"];
  let tIndex = 0;
  setInterval(()=> { typedEl.textContent = messages[tIndex]; tIndex = (tIndex + 1) % messages.length; }, 2500);

  // render skills
  function renderSkills(){
    skillsGrid.innerHTML = '';
    skills.forEach(s => {
      const el = document.createElement('div'); el.className='skill';
      el.innerHTML = `<h4>${s.name}</h4><div class="muted small">${s.domain} • ${s.rating.toFixed(1)}/10</div><div style="height:8px"></div><div class="bar"><i style="width:0%"></i></div>`;
      skillsGrid.appendChild(el);
      requestAnimationFrame(()=> {
        const pct = Math.max(2, (s.rating/10)*100).toFixed(2) + '%';
        el.querySelector('.bar > i').style.width = pct;
      });
    });
  }

  // projects chips
  function uniqueTags(){
    const set = new Set();
    projects.forEach(p => p.tags.forEach(t => set.add(t)));
    return Array.from(set);
  }
  let activeTag = 'All';
  function renderChips(){
    chipsEl.innerHTML = '';
    const all = document.createElement('div'); all.className='chip active'; all.textContent='All';
    all.addEventListener('click', ()=> { activeTag='All'; applyFilterSort(); updateChipUI(); });
    chipsEl.appendChild(all);
    uniqueTags().forEach(tag => {
      const c = document.createElement('div'); c.className='chip'; c.textContent = tag;
      c.addEventListener('click', ()=> { activeTag = tag; applyFilterSort(); updateChipUI(); });
      chipsEl.appendChild(c);
    });
  }
  function updateChipUI(){
    Array.from(chipsEl.children).forEach(ch => ch.classList.toggle('active', ch.textContent === activeTag));
  }

  // render projects
  function renderProjects(list){
    projectsGrid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `<img alt="${p.title}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300'%3E%3Crect width='100%25' height='100%25' fill='%230f1724'/%3E%3Ctext x='50%25' y='50%25' fill='%23cbd5e1' font-size='22' dominant-baseline='middle' text-anchor='middle'%3E${encodeURIComponent(p.title)}%3C/text%3E%3C/svg%3E` />
      <h4>${p.title}</h4><div class="meta">${p.tags.join(', ')} • Rating: ${p.rating}/10</div><p class="small-muted">${p.desc||''}</p>`;
      projectsGrid.appendChild(card);
    });
  }

  function applyFilterSort(){
    let filtered = projects.filter(p => activeTag==='All' ? true : p.tags.includes(activeTag));
    const q = searchProject.value.trim().toLowerCase();
    if(q) filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.tags.join(' ').toLowerCase().includes(q));
    const s = sortSelect.value;
    if(s==='newest') filtered.sort((a,b)=> new Date(b.date) - new Date(a.date));
    else if(s==='rating') filtered.sort((a,b)=> b.rating - a.rating);
    else if(s==='difficulty') filtered.sort((a,b)=> b.difficulty - a.difficulty);
    renderProjects(filtered);
  }
  sortSelect.addEventListener('change', applyFilterSort);
  searchProject.addEventListener('input', applyFilterSort);

  // timeline
  function renderTimeline(){
    const t = document.getElementById('timeline');
    t.innerHTML = '';
    const start = document.createElement('div');
    start.innerHTML = `<div class="small-muted">Started: ${experience.startDate}</div>`;
    t.appendChild(start);
    (experience.positions||[]).forEach(p => {
      const el = document.createElement('div'); el.className='item';
      el.innerHTML = `<div style="font-weight:700">${p.role} <span class="small-muted">• ${p.since}</span></div><div class="small-muted">${p.note}</div>`;
      t.appendChild(el);
    });
  }

  // analytics compute
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function computeAnalytics(){
    const skillSum = skills.reduce((s,x)=> s + Number(x.rating || 0), 0);
    const skillIndex = skills.length ? (skillSum / skills.length) : 0;
    const projectCount = projects.length;
    const avgProjectRating = projectCount ? (projects.reduce((s,p)=> s + (p.rating||0), 0) / projectCount) : 0;
    let projectPower = (projectCount * avgProjectRating) / (projectCount > 0 ? (projectCount/1.2) : 1);
    projectPower = clamp(projectPower / 1.2, 0, 10);
    const start = new Date(experience.startDate);
    const now = new Date();
    const monthsActive = Math.max(0, (now.getFullYear() - start.getFullYear())*12 + (now.getMonth() - start.getMonth()));
    const goalMonths = 36;
    let experienceGrowth = clamp((monthsActive / goalMonths) * 10, 0, 10);
    const daysWindow = 180;
    const recentCount = projects.filter(p => { const d = new Date(p.date); return (now - d) / (1000*60*60*24) <= daysWindow; }).length;
    const consistencyScore = clamp(recentCount / Math.max(1, Math.min(6, projects.length)) , 0, 1);
    const learningConsistency = clamp(consistencyScore * 10, 0, 10);
    let innovationBase = 5;
    projects.forEach(p => {
      if(p.tags.some(t=> /ai|ml|automation|unique|innovation/i.test(t))) innovationBase += 0.8;
      if((p.difficulty||0) >= 7) innovationBase += 0.4;
    });
    const innovationIndex = clamp(innovationBase, 0, 10);
    const overall = Math.round(((skillIndex + projectPower + experienceGrowth + learningConsistency + innovationIndex) / 5) * 10) / 10;
    return {
      skillIndex: Number(skillIndex.toFixed(1)),
      projectPower: Number(projectPower.toFixed(1)),
      experienceGrowth: Number(experienceGrowth.toFixed(1)),
      learningConsistency: Number(learningConsistency.toFixed(1)),
      innovationIndex: Number(innovationIndex.toFixed(1)),
      overall
    };
  }

  // analytics UI
  let radarChart = null;
  function openAnalytics(){
    const overlay = document.getElementById('overlay');
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.documentElement.style.overflow='hidden';
    const stats = computeAnalytics();
    document.getElementById('skillIndex').textContent = stats.skillIndex + ' / 10';
    document.getElementById('projectPower').textContent = stats.projectPower + ' / 10';
    document.getElementById('experienceGrowth').textContent = stats.experienceGrowth + ' / 10';
    document.getElementById('innovationIndex').textContent = stats.innovationIndex + ' / 10';
    document.getElementById('overallBadge').textContent = stats.overall + ' / 10';
    document.getElementById('consistencyBar').style.width = (stats.learningConsistency * 10) + '%';
    const topSkill = skills.slice().sort((a,b)=> b.rating - a.rating)[0];
    const feedback = {
      'AI': "You're training models that shape the future — keep iterating on datasets and experiments 🤖",
      'Security': "Your security mindset protects real systems — keep sharpening your tooling & reporting 🔐",
      'Web': "You craft delightful experiences — keep shipping polished UI and accessible code 🌐",
      'Data': "You turn numbers into stories — keep refining pipelines and visualizations 📊",
      'default': "You're balancing creativity and technical skill — keep building and sharing your work 🚀"
    };
    let domainKey = 'default';
    if(topSkill){ const d = topSkill.domain.toLowerCase(); if(d.includes('ai')||d.includes('ml')) domainKey='AI'; else if(d.includes('security')||d.includes('hack')) domainKey='Security'; else if(d.includes('web')) domainKey='Web'; else if(d.includes('data')) domainKey='Data'; }
    document.getElementById('aiFeedback').textContent = feedback[domainKey] || feedback.default;
    const radarCtx = document.getElementById('radarChart');
    const labels = skills.map(s => s.name);
    const dataVals = skills.map(s => s.rating);
    if(radarChart) radarChart.destroy();
    radarChart = new Chart(radarCtx, {
      type: 'radar',
      data: { labels, datasets: [{ label: 'Skill ratings (0-10)', data: dataVals, borderColor: 'rgba(24,214,240,0.9)', backgroundColor: 'rgba(24,214,240,0.12)', pointBackgroundColor: 'rgba(155,108,255,1)' }] },
      options: { scales: { r: { min:0, max:10, ticks:{ stepSize:1, color: getComputedStyle(document.body).getPropertyValue('--muted') } } }, plugins: { legend:{ display:false } } }
    });
  }

  // overlay controls
  const viewAnalytics = document.getElementById('viewAnalytics');
  const closeOverlay = document.getElementById('closeOverlay');
  viewAnalytics.addEventListener('click', openAnalytics);
  closeOverlay.addEventListener('click', ()=> { document.getElementById('overlay').classList.remove('open'); document.getElementById('overlay').setAttribute('aria-hidden','true'); document.documentElement.style.overflow=''; });

  // contact form
  const sendBtn = document.getElementById('sendBtn');
  const contactStatus = document.getElementById('contactStatus');
  function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  sendBtn.addEventListener('click', async () => {
    const name = document.getElementById('nameField').value.trim();
    const email = document.getElementById('emailField').value.trim();
    const message = document.getElementById('messageField').value.trim();
    if(!name || !email || !message){ contactStatus.textContent = 'Please fill all fields.'; return; }
    if(!validEmail(email)){ contactStatus.textContent = 'Enter a valid email address.'; return; }
    contactStatus.textContent = 'Sending...';
    try {
      const resp = await fetch(CONTACT_BACKEND_URL, { method:'POST', headers:{ 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message }) });
      if(resp.ok){ contactStatus.textContent = 'Message sent — thank you!'; document.getElementById('nameField').value=''; document.getElementById('emailField').value=''; document.getElementById('messageField').value=''; }
      else { const txt = await resp.text(); contactStatus.textContent = 'Server error: ' + (txt || resp.status); }
    } catch(err){ contactStatus.textContent = 'Network error — please check backend URL and connection.'; }
  });

  // init
  renderSkills(); renderChips(); applyFilterSort(); renderTimeline();
  // expose computeAnalytics for console
  window.computeAnalytics = computeAnalytics;

})();

