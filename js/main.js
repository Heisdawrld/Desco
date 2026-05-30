/**
 * DESCO 2.0 — Main JavaScript
 */

(function() {
  'use strict';

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
  // Intersection Observer (Scroll Reveal)
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
    // Set date to 45 days from now for demo purposes
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
  // Registration Tabs
  // ===========================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // ===========================
  // Live Scoreboard Simulation
  // ===========================
  const leaderboardBody = document.getElementById('leaderboard-body');
  if (leaderboardBody) {
    const teams = [
      { name: 'Biology', score: 2850, change: 120 },
      { name: 'Chemistry', score: 2720, change: 85 },
      { name: 'Physics', score: 2680, change: -40 },
      { name: 'Mathematics', score: 2540, change: 95 },
      { name: 'Computer Science', score: 2490, change: 60 },
      { name: 'Integrated Science', score: 2310, change: 30 },
      { name: 'Geography', score: 2180, change: -20 },
      { name: 'Human Kinetics', score: 2050, change: 45 }
    ];

    function renderLeaderboard() {
      teams.sort((a, b) => b.score - a.score);

      leaderboardBody.innerHTML = teams.map((team, index) => {
        const changeClass = team.change >= 0 ? 'up' : 'down';
        const changeSign = team.change >= 0 ? '+' : '';
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';

        return `
          <div class="leaderboard-row" style="animation-delay: ${index * 0.1}s">
            <div class="rank ${rankClass}">${index + 1}</div>
            <div class="team-info">
              <div class="team-avatar">${team.name.charAt(0)}</div>
              <span class="team-name">${team.name}</span>
            </div>
            <div class="score">${team.score.toLocaleString()}</div>
            <div class="score-change ${changeClass}">${changeSign}${team.change}</div>
          </div>
        `;
      }).join('');
    }

    renderLeaderboard();

    // Simulate live updates
    setInterval(() => {
      const randomTeam = teams[Math.floor(Math.random() * teams.length)];
      const randomChange = Math.floor(Math.random() * 50) - 10;
      randomTeam.score += randomChange;
      randomTeam.change = randomChange;
      renderLeaderboard();
    }, 5000);
  }

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

  // ===========================
  // Form Submission Handler
  // ===========================
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerHTML : '';

      if (btn) {
        btn.innerHTML = 'Submitting...';
        btn.disabled = true;
      }

      setTimeout(() => {
        alert('Registration submitted successfully! You will receive a confirmation email shortly.');
        form.reset();
        if (btn) {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      }, 1500);
    });
  });

})();