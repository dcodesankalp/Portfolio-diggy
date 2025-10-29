(function(){
  document.querySelectorAll('h1,h2,h3,h4').forEach(el => el.style.fontFamily = "Playfair Display, serif");
  const body = document.body;
  if(!localStorage.getItem('portfolio-theme')){ localStorage.setItem('portfolio-theme','dark'); body.setAttribute('data-theme','dark'); } else { body.setAttribute('data-theme', localStorage.getItem('portfolio-theme')); }
  const cards = document.querySelectorAll('.card, .skill, .timeline .item');
  const obs = new IntersectionObserver((entries) => { entries.forEach(en => { if(en.isIntersecting){ en.target.style.opacity = 1; en.target.style.transform = 'translateY(0)'; obs.unobserve(en.target); } }); }, { threshold: 0.15 });
  cards.forEach(c => { c.style.opacity = 0; c.style.transform = 'translateY(10px)'; obs.observe(c); });
  const overlay = document.getElementById('overlay'); const openBtn = document.getElementById('viewAnalytics'); const closeBtn = document.getElementById('closeOverlay');
  function openOverlay(){ overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.documentElement.style.overflow = 'hidden'; const focusable = overlay.querySelector('button, [tabindex], a, input'); if(focusable) focusable.focus(); }
  function closeOverlay(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.documentElement.style.overflow = ''; openBtn.focus(); }
  if(openBtn) openBtn.addEventListener('click', openOverlay);
  if(closeBtn) closeBtn.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay(); });
  document.querySelectorAll('nav a[href^="#"]').forEach(a => a.addEventListener('click', (ev) => { ev.preventDefault(); const id = a.getAttribute('href').slice(1); const el = document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }));
  const dl = document.getElementById('downloadResume'); if(dl){ dl.addEventListener('click', (e) => { e.preventDefault(); const resumeUrl = '/resume.pdf'; window.open(resumeUrl, '_blank'); }); }
  const logo = document.querySelector('.logo'); if(logo){ logo.addEventListener('mouseenter', () => logo.style.boxShadow = '0 12px 40px rgba(24,214,240,0.12)'); logo.addEventListener('mouseleave', () => logo.style.boxShadow = '0 8px 28px rgba(0,0,0,0.45)'); }
})();

