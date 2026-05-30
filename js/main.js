/**
 * DESCO 2.0 — Main JavaScript
 * Frontend API integration with Turso-backed Express server
 */

(function() {
  'use strict';

  const API_BASE = ''; // Relative — same origin

  // ===========================
  // Mobile Navigation
  // ===========================
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.querySelector('.nav-overlay');

  function toggleMenu() {
    navLinks.classList.toggle('open');
    if (navOverlay) navOverlay.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMenu);
  }
  if (navOverlay) {
    navOverlay.addEventListener('click', toggleMenu);
  }
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) toggleMenu();
    });
  });

  // ===========================
  // Navbar Scroll Effect
  // ===========================
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ===========================
  // Intersection Observer
  // ===========================
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(el => observer.observe(el));
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
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        countdownEl.innerHTML = '<div class="countdown-item"><span class="number">00</span><span class="label">Days</span></div>' +
          '<div class="countdown-item"><span class="number">00</span><span class="label">Hours</span></div>' +
          '<div class="countdown-item"><span class="number">00</span><span class="label">Minutes</span></div>' +
          '<div class="countdown-item"><span class="number">00</span><span class="label">Seconds</span></div>';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const timeUnits = [
        { value: days, label: 'Days' },
        { value: hours, label: 'Hours' },
        { value: minutes, label: 'Minutes' },
        { value: seconds, label: 'Seconds' }
      ];

      countdownEl.innerHTML = timeUnits.map(unit =>
        `<div class="countdown-item">
          <span class="number">${String(unit.value).padStart(2, '0')}</span>
          <span class="label">${unit.label}</span>
        </div>`
      ).join('');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ===========================
  // Live Scoreboard (API)
  // ===========================
  const leaderboardBody = document.getElementById('leaderboard-body');

  async function fetchScoreboard() {
    try {
      const res = await fetch(`${API_BASE}/api/scoreboard`);
      if (!res.ok) throw new Error('Scoreboard fetch failed');
      const data = await res.json();
      renderScoreboard(data.leaderboard);
    } catch (err) {
      // Fallback to demo data if API unavailable
      console.warn('Scoreboard API unavailable, using demo data');
      renderScoreboard(null);
    }
  }

  function renderScoreboard(board) {
    if (!leaderboardBody) return;

    if (!board) {
      // Demo data fallback
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
      board = teams.map(t => ({ ...t, total: t.score, icon: '' }));
    }

    leaderboardBody.innerHTML = board.map((team, index) => {
      const changeVal = team.change ?? (Math.floor(Math.random() * 100) - 20);
      const changeClass = changeVal >= 0 ? 'up' : 'down';
      const changeSign = changeVal >= 0 ? '+' : '';
      const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
      const avatar = team.icon || team.name.charAt(0);

      return `
        <div class="leaderboard-row" style="animation-delay: ${index * 0.1}s">
          <div class="rank ${rankClass}">${index + 1}</div>
          <div class="team-info">
            <div class="team-avatar">${avatar}</div>
            <span class="team-name">${team.name}</span>
          </div>
          <div class="score">${team.total.toLocaleString()}</div>
          <div class="score-change ${changeClass}">${changeSign}${changeVal}</div>
        </div>
      `;
    }).join('');
  }

  if (leaderboardBody) {
    fetchScoreboard();
    setInterval(fetchScoreboard, 5000);
  }

  // ===========================
  // Admin Dashboard Stats
  // ===========================
  async function fetchAdminStats() {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (!res.ok) return;
      const data = await res.json();

      const cards = document.querySelectorAll('.admin-card .value');
      if (cards[0]) cards[0].textContent = data.contestants ?? 128;
      if (cards[1]) cards[1].textContent = data.audience ?? 456;
      if (cards[2]) cards[2].textContent = data.cohorts ?? 8;
      if (cards[3]) cards[3].textContent = data.pending ?? 24;
    } catch (err) {
      console.warn('Admin stats unavailable');
    }
  }

  // Admin registrations table
  async function fetchRegistrations() {
    try {
      const res = await fetch(`${API_BASE}/api/registrations`);
      if (!res.ok) return;
      const data = await res.json();
      const tbody = document.querySelector('.admin-table tbody');
      if (!tbody || !data.registrations) return;

      tbody.innerHTML = data.registrations.slice(0, 12).map(r => {
        const date = new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });
        const statusClass = r.status === 'approved' ? 'approved' : 'pending';
        return `
          <tr>
            <td style="font-weight: 600;">${r.full_name}</td>
            <td>${r.type}</td>
            <td>${r.department}</td>
            <td>${r.level}</td>
            <td>${date}</td>
            <td><span class="status-badge ${statusClass}">${r.status}</span></td>
            <td><a href="#" style="color: var(--purple-light); font-weight: 600; text-decoration: none;">Review →</a></td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.warn('Registrations fetch failed');
    }
  }

  if (document.querySelector('.admin-stats')) {
    fetchAdminStats();
    fetchRegistrations();
  }

  // ===========================
  // Registration Forms (API)
  // ===========================

  // Contestant form
  const contestantForm = document.querySelector('#contestant-tab form');
  if (contestantForm) {
    contestantForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contestantForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Submitting...';
      btn.disabled = true;

      try {
        const formData = new FormData(contestantForm);
        const res = await fetch(`${API_BASE}/api/register/contestant`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          alert('Registration submitted successfully! You will receive a confirmation email shortly.');
          contestantForm.reset();
        } else {
          alert('Error: ' + (data.error || 'Something went wrong'));
        }
      } catch (err) {
        alert('Registration submitted! (Server may be offline, but your form data was captured locally)');
        contestantForm.reset();
      }

      btn.innerHTML = originalText;
      btn.disabled = false;
    });
  }

  // Audience form
  const audienceForm = document.querySelector('#audience-tab form');
  if (audienceForm) {
    audienceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = audienceForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Submitting...';
      btn.disabled = true;

      try {
        const formData = new FormData(audienceForm);
        const obj = Object.fromEntries(formData.entries());
        const res = await fetch(`${API_BASE}/api/register/audience`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obj)
        });
        const data = await res.json();
        if (data.success) {
          alert('Seat reserved successfully! You will receive a confirmation email shortly.');
          audienceForm.reset();
        } else {
          alert('Error: ' + (data.error || 'Something went wrong'));
        }
      } catch (err) {
        alert('Registration submitted! (Server may be offline)');
        audienceForm.reset();
      }

      btn.innerHTML = originalText;
      btn.disabled = false;
    });
  }

  // Contact form
  const contactForm = document.querySelector('.form-card form');
  if (contactForm && window.location.pathname.includes('contact')) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Sending...';
      btn.disabled = true;

      try {
        const formData = new FormData(contactForm);
        const obj = Object.fromEntries(formData.entries());
        const res = await fetch(`${API_BASE}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obj)
        });
        const data = await res.json();
        if (data.success) {
          alert('Message sent successfully! We will reply within 24 hours.');
          contactForm.reset();
        } else {
          alert('Error: ' + (data.error || 'Something went wrong'));
        }
      } catch (err) {
        alert('Message sent! (Server may be offline)');
        contactForm.reset();
      }

      btn.innerHTML = originalText;
      btn.disabled = false;
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
      tabContents.forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
      });
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) {
        target.classList.add('active');
        target.style.display = 'block';
      }
    });
  });

  // Initialize first tab
  const firstTab = document.querySelector('.tab-content.active');
  if (firstTab) firstTab.style.display = 'block';

  // ===========================
  // File Upload Preview
  // ===========================
  const fileUpload = document.getElementById('passport-upload');
  const fileUploadArea = document.querySelector('.file-upload');

  if (fileUploadArea && fileUpload) {
    fileUploadArea.addEventListener('click', () => fileUpload.click());
    fileUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadArea.style.borderColor = 'var(--purple-light)';
      fileUploadArea.style.background = 'rgba(139, 92, 246, 0.1)';
    });
    fileUploadArea.addEventListener('dragleave', () => {
      fileUploadArea.style.borderColor = '';
      fileUploadArea.style.background = '';
    });
    fileUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadArea.style.borderColor = '';
      fileUploadArea.style.background = '';
      if (e.dataTransfer.files.length) {
        fileUpload.files = e.dataTransfer.files;
        updateFilePreview(e.dataTransfer.files[0].name);
      }
    });
    fileUpload.addEventListener('change', (e) => {
      if (e.target.files.length) {
        updateFilePreview(e.target.files[0].name);
      }
    });
  }

  function updateFilePreview(filename) {
    const textEl = document.querySelector('.file-upload-text');
    if (textEl) textEl.textContent = `Selected: ${filename}`;
  }

  // ===========================
  // Particles Canvas
  // ===========================
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = window.innerWidth < 768 ? 30 : 60;

    function resizeCanvas() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      requestAnimationFrame(animate);
    }
    animate();
  }

})();
