/**
 * DESCO 2.0 — Premium JavaScript
 * Cursor glow, lightbox, scroll reveals, API integration
 */

(function() {
  'use strict';

  const API_BASE = '';

  // ===========================
  // TOAST NOTIFICATIONS
  // ===========================
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <span>${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 4500);
  }

  // ===========================
  // CURSOR GLOW (desktop only)
  // ===========================
  (function initCursorGlow() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;
    let mx = 0, my = 0, gx = 0, gy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    function animate() {
      gx += (mx - gx) * 0.08;
      gy += (my - gy) * 0.08;
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';
      requestAnimationFrame(animate);
    }
    animate();
  })();

  // ===========================
  // LIGHTBOX
  // ===========================
  function initLightbox() {
    const items = document.querySelectorAll('.gallery-item');
    if (!items.length) return;

    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'lightbox';
      lightbox.className = 'lightbox';
      lightbox.innerHTML = `
        <button class="lightbox-close" onclick="document.getElementById('lightbox').classList.remove('active')">×</button>
        <div class="lightbox-content"></div>
      `;
      document.body.appendChild(lightbox);
    }

    items.forEach(item => {
      item.addEventListener('click', () => {
        const content = item.querySelector('.gallery-placeholder')?.textContent || '';
        lightbox.querySelector('.lightbox-content').innerHTML = item.innerHTML;
        lightbox.classList.add('active');
      });
    });

    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) lightbox.classList.remove('active');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') lightbox.classList.remove('active');
    });
  }
  initLightbox();

  // ===========================
  // Mobile Navigation
  // ===========================
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.querySelector('.nav-overlay');

  function toggleMenu() {
    if (!navLinks) return;
    navLinks.classList.toggle('open');
    if (navOverlay) navOverlay.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);
  if (navOverlay) navOverlay.addEventListener('click', toggleMenu);
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => { if (navLinks?.classList.contains('open')) toggleMenu(); });
  });

  // ===========================
  // Navbar Scroll
  // ===========================
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ===========================
  // Intersection Observer
  // ===========================
  const revealEls = document.querySelectorAll('.reveal, .reveal-scale');
  if (revealEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => obs.observe(el));
  }

  // ===========================
  // Countdown Timer
  // ===========================
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 45);
    targetDate.setHours(10, 0, 0, 0);

    function updateCountdown() {
      const dist = targetDate - new Date().getTime();
      if (dist < 0) {
        countdownEl.innerHTML = '<div class="countdown-item"><span class="number">00</span><span class="label">Days</span></div>' +
          '<div class="countdown-item"><span class="number">00</span><span class="label">Hours</span></div>' +
          '<div class="countdown-item"><span class="number">00</span><span class="label">Minutes</span></div>' +
          '<div class="countdown-item"><span class="number">00</span><span class="label">Seconds</span></div>';
        return;
      }
      const d = Math.floor(dist / 86400000);
      const h = Math.floor((dist % 86400000) / 3600000);
      const m = Math.floor((dist % 3600000) / 60000);
      const s = Math.floor((dist % 60000) / 1000);
      const units = [
        { v: d, l: 'Days' }, { v: h, l: 'Hours' },
        { v: m, l: 'Minutes' }, { v: s, l: 'Seconds' }
      ];
      countdownEl.innerHTML = units.map(u =>
        `<div class="countdown-item"><span class="number">${String(u.v).padStart(2,'0')}</span><span class="label">${u.l}</span></div>`
      ).join('');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ===========================
  // Live Scoreboard
  // ===========================
  const leaderboardBody = document.getElementById('leaderboard-body');

  async function fetchScoreboard() {
    try {
      const res = await fetch(`${API_BASE}/api/scoreboard`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      renderScoreboard(data.leaderboard);
    } catch (err) {
      renderScoreboard(null);
    }
  }

  function renderScoreboard(board) {
    if (!leaderboardBody) return;
    if (!board) {
      const teams = [
        { name: 'Biology', code: 'BIO', score: 2850, change: 120 },
        { name: 'Chemistry', code: 'CHEM', score: 2720, change: 85 },
        { name: 'Physics', code: 'PHY', score: 2680, change: -40 },
        { name: 'Mathematics', code: 'MATH', score: 2540, change: 95 },
        { name: 'Computer Science', code: 'CS', score: 2490, change: 60 },
        { name: 'Integrated Science', code: 'IS', score: 2310, change: 30 },
        { name: 'Geography', code: 'GEO', score: 2180, change: -20 },
        { name: 'Human Kinetics', code: 'HK', score: 2050, change: 45 }
      ];
      board = teams.map(t => ({ ...t, total: t.score }));
    }
    leaderboardBody.innerHTML = board.map((team, i) => {
      const ch = team.change ?? Math.floor(Math.random() * 100) - 20;
      const chClass = ch >= 0 ? 'up' : 'down';
      const chSign = ch >= 0 ? '+' : '';
      const rc = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
      return `
        <div class="leaderboard-row" style="animation-delay: ${i * 0.08}s">
          <div class="rank ${rc}">${i + 1}</div>
          <div class="team-info"><div class="team-avatar">${team.icon || team.name.charAt(0)}</div><span class="team-name">${team.name}</span></div>
          <div class="score">${team.total.toLocaleString()}</div>
          <div class="score-change ${chClass}">${chSign}${ch}</div>
        </div>`;
    }).join('');
  }

  if (leaderboardBody) {
    fetchScoreboard();
    setInterval(fetchScoreboard, 5000);
  }

  // ===========================
  // Registration Forms
  // ===========================
  const contestantForm = document.querySelector('#contestant-tab form, #contestant-form');
  if (contestantForm) {
    contestantForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contestantForm.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = 'Submitting...'; btn.disabled = true;
      try {
        const fd = new FormData(contestantForm);
        const obj = Object.fromEntries(fd.entries());
        const fi = document.getElementById('passport-upload');
        if (fi && fi.files[0]) obj.passport_base64 = await fileToBase64(fi.files[0]);
        const res = await fetch(`${API_BASE}/api/register/contestant`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj)
        });
        const data = await res.json();
        if (data.success) {
          showToast('Registration submitted! Confirmation email coming shortly.');
          contestantForm.reset();
          const ut = document.querySelector('.file-upload-text');
          if (ut) ut.textContent = 'Click to upload or drag & drop your passport photo';
        } else { showToast('Error: ' + (data.error || 'Something went wrong'), 'error'); }
      } catch (err) {
        showToast('Network issue — please try again.', 'error');
      }
      btn.innerHTML = orig; btn.disabled = false;
    });
  }

  const audienceForm = document.querySelector('#audience-tab form, #audience-form');
  if (audienceForm) {
    audienceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = audienceForm.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = 'Submitting...'; btn.disabled = true;
      try {
        const fd = new FormData(audienceForm);
        const obj = Object.fromEntries(fd.entries());
        const res = await fetch(`${API_BASE}/api/register/audience`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj)
        });
        const data = await res.json();
        if (data.success) {
          showToast('Seat reserved! Confirmation email coming shortly.');
          audienceForm.reset();
        } else { showToast('Error: ' + (data.error || 'Something went wrong'), 'error'); }
      } catch (err) {
        showToast('Network issue — please try again.', 'error');
      }
      btn.innerHTML = orig; btn.disabled = false;
    });
  }

  // ===========================
  // Contact Form
  // ===========================
  const contactForm = document.querySelector('.form-card form');
  if (contactForm && window.location.pathname.includes('contact')) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = 'Sending...'; btn.disabled = true;
      try {
        const fd = new FormData(contactForm);
        const obj = Object.fromEntries(fd.entries());
        const res = await fetch(`${API_BASE}/api/contact`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj)
        });
        const data = await res.json();
        if (data.success) { showToast('Message sent! We will reply within 24 hours.'); contactForm.reset(); }
        else { showToast('Error: ' + (data.error || 'Something went wrong'), 'error'); }
      } catch (err) { showToast('Network issue — please try again.', 'error'); }
      btn.innerHTML = orig; btn.disabled = false;
    });
  }

  // ===========================
  // Registration Tabs
  // ===========================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => { c.classList.remove('active'); c.style.display = 'none'; });
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) { target.classList.add('active'); target.style.display = 'block'; }
    });
  });
  const firstTab = document.querySelector('.tab-content.active');
  if (firstTab) firstTab.style.display = 'block';

  // ===========================
  // File Upload
  // ===========================
  const fileUpload = document.getElementById('passport-upload');
  const fileUploadArea = document.querySelector('.file-upload');
  if (fileUploadArea && fileUpload) {
    fileUploadArea.addEventListener('click', () => fileUpload.click());
    fileUploadArea.addEventListener('dragover', e => { e.preventDefault(); fileUploadArea.style.borderColor = 'var(--purple-bright)'; fileUploadArea.style.background = 'rgba(139,92,246,0.04)'; });
    fileUploadArea.addEventListener('dragleave', () => { fileUploadArea.style.borderColor = ''; fileUploadArea.style.background = ''; });
    fileUploadArea.addEventListener('drop', e => {
      e.preventDefault(); fileUploadArea.style.borderColor = ''; fileUploadArea.style.background = '';
      if (e.dataTransfer.files.length) { fileUpload.files = e.dataTransfer.files; updateFilePreview(e.dataTransfer.files[0].name); }
    });
    fileUpload.addEventListener('change', e => { if (e.target.files.length) updateFilePreview(e.target.files[0].name); });
  }
  function updateFilePreview(name) {
    const el = document.querySelector('.file-upload-text');
    if (el) el.textContent = 'Selected: ' + name;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ===========================
  // Particles Canvas
  // ===========================
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const count = window.innerWidth < 768 ? 25 : 55;

    function resize() {
      const p = canvas.parentElement;
      if (p) { canvas.width = p.offsetWidth; canvas.height = p.offsetHeight; }
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.sx = (Math.random() - 0.5) * 0.3;
        this.sy = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.1;
      }
      update() {
        this.x += this.sx; this.y += this.sy;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) particles.push(new Particle());

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(); particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139,92,246,${0.06 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ===========================
  // Admin Dashboard Stats (on admin page)
  // ===========================
  async function fetchAdminStats() {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (!res.ok) return;
      const data = await res.json();
      const cards = document.querySelectorAll('.admin-card .value');
      if (cards[0]) cards[0].textContent = data.contestants ?? 0;
      if (cards[1]) cards[1].textContent = data.audience ?? 0;
      if (cards[2]) cards[2].textContent = data.pending ?? 0;
      if (cards[3]) cards[3].textContent = data.cohorts ?? 0;
    } catch (e) {}
  }
  if (document.querySelector('.admin-stats')) {
    fetchAdminStats();
  }

})();
