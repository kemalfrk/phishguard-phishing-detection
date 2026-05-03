/* ============================================
   PhishGuard — Application Logic
   Connects to Flask backend for real ML predictions.
   ============================================ */

(function () {
  'use strict';

  // ==========================================
  // Config
  // ==========================================
  const API_BASE = 'http://localhost:5000';

  // ==========================================
  // Background Particle Canvas
  // ==========================================
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrameId;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((canvas.width * canvas.height) / 18000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
      ctx.fill();

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;
    }

    animFrameId = requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });

  // ==========================================
  // DOM References
  // ==========================================
  const urlInput = document.getElementById('url-input');
  const clearBtn = document.getElementById('clear-btn');
  const paramsToggle = document.getElementById('params-toggle');
  const paramsPanel = document.getElementById('params-panel');
  const toggleChevron = document.getElementById('toggle-chevron');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnReset = document.getElementById('btn-reset');
  const heroSection = document.getElementById('hero-section');
  const resultsSection = document.getElementById('results-section');
  const modelSelect = document.getElementById('select-model');

  // Result elements
  const scanBar = document.getElementById('scan-bar');
  const resultIcon = document.getElementById('result-icon');
  const resultTitle = document.getElementById('result-title');
  const resultSubtitle = document.getElementById('result-subtitle');
  const detailUrlValue = document.getElementById('detail-url-value');
  const confidenceBar = document.getElementById('confidence-fill');
  const confidenceValue = document.getElementById('confidence-value');
  const verdictBadge = document.getElementById('detail-verdict-value');
  const featureGrid = document.getElementById('feature-grid');
  const resultCard = document.getElementById('result-card');
  const modelValue = document.getElementById('detail-model-value');

  // ==========================================
  // URL Input — Clear button visibility
  // ==========================================
  urlInput.addEventListener('input', () => {
    clearBtn.style.display = urlInput.value.length > 0 ? 'flex' : 'none';
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.style.display = 'none';
    urlInput.focus();
  });

  // ==========================================
  // Parameters Toggle
  // ==========================================
  paramsToggle.addEventListener('click', () => {
    const isOpen = paramsPanel.classList.toggle('open');
    toggleChevron.classList.toggle('open', isOpen);
  });

  // ==========================================
  // URL shortener domains
  // ==========================================
  const SHORTENER_DOMAINS = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd',
    'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'lnkd.in',
    'db.tt', 'qr.ae', 'cur.lv', 'ity.im', 'q.gs', 'po.st', 'bc.vc',
    'twitthis.com', 'u.to', 'j.mp', 'buzurl.com', 'cutt.us',
    'u.bb', 'yourls.org', 'x.co', 'prettylinkpro.com', 'scrnch.me',
    'filoops.info', 'vzturl.com', 'qr.net', 'rb.gy',
  ];

  // ==========================================
  // Auto-detect ARFF features from URL
  // ==========================================
  function extractFeaturesFromUrl(url) {
    const f = {};

    let hostname = '';
    let protocol = '';
    let port = '';
    try {
      if (!url.match(/^https?:\/\//i)) url = 'http://' + url;
      const u = new URL(url);
      hostname = u.hostname;
      protocol = u.protocol;
      port = u.port;
    } catch (e) {
      hostname = url;
    }

    // 1. having_IP_Address — does the URL use an IP instead of a domain?
    const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    f.having_IP_Address = ipPattern.test(hostname) ? -1 : 1;

    // 2. URL_Length — short (<54): 1, medium (54-75): 0, long (>75): -1
    const len = url.length;
    if (len < 54) f.URL_Length = 1;
    else if (len <= 75) f.URL_Length = 0;
    else f.URL_Length = -1;

    // 3. Shortining_Service
    const hostLower = hostname.toLowerCase();
    f.Shortining_Service = SHORTENER_DOMAINS.some(d => hostLower.includes(d)) ? -1 : 1;

    // 4. having_At_Symbol
    f.having_At_Symbol = url.includes('@') ? -1 : 1;

    // 5. double_slash_redirecting — // appearing after protocol
    const afterProto = url.replace(/^https?:\/\//i, '');
    f.double_slash_redirecting = afterProto.includes('//') ? -1 : 1;

    // 6. Prefix_Suffix — dash in domain name
    f.Prefix_Suffix = hostname.includes('-') ? -1 : 1;

    // 7. having_Sub_Domain — count dots in hostname
    const dotCount = (hostname.match(/\./g) || []).length;
    if (dotCount <= 1) f.having_Sub_Domain = 1;       // e.g., example.com
    else if (dotCount === 2) f.having_Sub_Domain = 0;  // e.g., www.example.com
    else f.having_Sub_Domain = -1;                     // e.g., mail.sub.example.com

    // 8. SSLfinal_State
    f.SSLfinal_State = protocol === 'https:' ? 1 : -1;

    // 11. port — non-standard port
    const standardPorts = ['', '80', '443'];
    f.port = standardPorts.includes(port) ? 1 : -1;

    // 12. HTTPS_token — "https" appears in domain name itself (trick)
    const domainOnly = hostname.replace(/^www\./i, '');
    f.HTTPS_token = domainOnly.toLowerCase().includes('https') ? -1 : 1;

    return f;
  }

  // ==========================================
  // Gather all 30 features for the API call
  // ==========================================
  function gatherFeatures(url) {
    const autoDetected = extractFeaturesFromUrl(url);
    const features = {};

    // All 30 feature selects
    const selects = document.querySelectorAll('.feature-select');
    selects.forEach((sel) => {
      const featureName = sel.dataset.feature;
      const val = sel.value;
      if (val === 'auto' && autoDetected[featureName] !== undefined) {
        features[featureName] = autoDetected[featureName];
      } else if (val !== 'auto') {
        features[featureName] = parseInt(val, 10);
      } else {
        // No auto-detection available, use the select's current non-auto value
        // Fall back to the first non-auto option or default to 1
        features[featureName] = parseInt(val, 10) || 1;
      }
    });

    return features;
  }

  // ==========================================
  // Analyze Button — Main action
  // ==========================================
  btnAnalyze.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
      shakeElement(document.querySelector('.search-bar'));
      urlInput.focus();
      return;
    }
    runAnalysis(url);
  });

  // Enter key to analyze
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnAnalyze.click();
    }
  });

  // ==========================================
  // Reset Button
  // ==========================================
  btnReset.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.style.display = 'none';

    // Reset all feature selects to their first option
    document.querySelectorAll('.feature-select').forEach((sel) => {
      sel.selectedIndex = 0;
    });

    // Reset model selector
    if (modelSelect) modelSelect.selectedIndex = 0;

    // Hide results
    resultsSection.style.display = 'none';
    heroSection.classList.remove('collapsed');

    urlInput.focus();
  });

  // ==========================================
  // Run Analysis — calls Flask backend
  // ==========================================
  async function runAnalysis(url) {
    // Collapse hero and close params panel
    heroSection.classList.add('collapsed');
    paramsPanel.classList.remove('open');
    toggleChevron.classList.remove('open');

    // Show results
    resultsSection.style.display = 'block';

    // Delay scroll so the panel collapse animation finishes first
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);

    // Gather features
    const features = gatherFeatures(url);
    const selectedModel = modelSelect ? modelSelect.value : 'random_forest';

    // Reset result card to scanning state
    showScanningState(url);

    // =====================================================
    // 🔌 REAL MODEL PREDICTION — calls Flask backend
    // =====================================================
    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          features: features,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${response.status})`);
      }

      const result = await response.json();
      showResult(url, result, features);
    } catch (error) {
      showError(url, error.message);
    }
  }

  // ==========================================
  // UI State: Scanning
  // ==========================================
  function showScanningState(url) {
    // Reset
    scanBar.classList.remove('complete');
    scanBar.style.width = '0%';
    resultIcon.className = 'result-icon scanning';
    resultIcon.innerHTML = '🔍';
    resultTitle.className = 'result-title';
    resultTitle.textContent = 'Analyzing…';
    resultSubtitle.textContent = 'Sending URL to AI model for analysis';
    detailUrlValue.textContent = url;
    confidenceBar.style.width = '0%';
    confidenceBar.className = 'confidence-fill';
    confidenceValue.textContent = '—';
    verdictBadge.className = 'detail-value verdict-badge';
    verdictBadge.textContent = '—';
    if (modelValue) modelValue.textContent = '—';
    featureGrid.innerHTML = '';
    resultCard.style.boxShadow = '';

    // Animate scan bar
    requestAnimationFrame(() => {
      scanBar.classList.add('complete');
    });
  }

  // ==========================================
  // UI State: Show Result (from real API)
  // ==========================================
  function showResult(url, result, features) {
    const isSafe = result.prediction === 'safe';

    // Icon
    resultIcon.className = `result-icon ${isSafe ? 'safe' : 'danger'}`;
    resultIcon.innerHTML = isSafe ? '✅' : '⚠️';

    // Title
    resultTitle.className = `result-title ${isSafe ? 'safe' : 'danger'}`;
    resultTitle.textContent = isSafe ? 'URL Appears Safe' : 'Phishing Detected!';

    // Subtitle
    resultSubtitle.textContent = isSafe
      ? 'No significant phishing indicators were found.'
      : 'This URL shows strong phishing characteristics.';

    // URL
    detailUrlValue.textContent = url;

    // Confidence
    const confPercent = result.confidence;
    confidenceBar.className = `confidence-fill ${isSafe ? 'safe' : 'danger'}`;
    requestAnimationFrame(() => {
      confidenceBar.style.width = confPercent + '%';
    });
    confidenceValue.textContent = confPercent + '%';
    confidenceValue.style.color = isSafe
      ? 'var(--accent-green)'
      : 'var(--accent-red)';

    // Verdict badge
    verdictBadge.className = `detail-value verdict-badge ${isSafe ? 'safe' : 'danger'}`;
    verdictBadge.textContent = isSafe ? 'SAFE' : 'PHISHING';

    // Model used
    if (modelValue) {
      modelValue.textContent = result.model_name || '—';
    }

    // Card glow
    resultCard.style.boxShadow = isSafe
      ? 'var(--shadow-glow-safe)'
      : 'var(--shadow-glow-danger)';

    // Feature breakdown
    renderFeatureGrid(result.features_used || features);
  }

  // ==========================================
  // UI State: Show Error
  // ==========================================
  function showError(url, message) {
    resultIcon.className = 'result-icon danger';
    resultIcon.innerHTML = '❌';
    resultTitle.className = 'result-title danger';
    resultTitle.textContent = 'Analysis Failed';
    resultSubtitle.textContent = message || 'Could not connect to the AI backend. Make sure server.py is running.';
    detailUrlValue.textContent = url;
    confidenceBar.style.width = '0%';
    confidenceValue.textContent = '—';
    verdictBadge.className = 'detail-value verdict-badge';
    verdictBadge.textContent = 'ERROR';
    if (modelValue) modelValue.textContent = '—';
    featureGrid.innerHTML = '';
    resultCard.style.boxShadow = 'var(--shadow-glow-danger)';
  }

  // ==========================================
  // Render Feature Grid (shows all 30 ARFF features)
  // ==========================================
  function renderFeatureGrid(featuresObj) {
    const FEATURE_LABELS = {
      having_IP_Address: 'IP Address',
      URL_Length: 'URL Length',
      Shortining_Service: 'URL Shortener',
      having_At_Symbol: '@ Symbol',
      double_slash_redirecting: '// Redirect',
      Prefix_Suffix: 'Dash in Domain',
      having_Sub_Domain: 'Sub-Domains',
      SSLfinal_State: 'SSL State',
      Domain_registeration_length: 'Domain Reg.',
      Favicon: 'Favicon',
      port: 'Port',
      HTTPS_token: 'HTTPS Token',
      Request_URL: 'Request URL',
      URL_of_Anchor: 'Anchor URLs',
      Links_in_tags: 'Links in Tags',
      SFH: 'SFH',
      Submitting_to_email: 'Email Submit',
      Abnormal_URL: 'Abnormal URL',
      Redirect: 'Redirect',
      on_mouseover: 'onMouseOver',
      RightClick: 'Right Click',
      popUpWidnow: 'Pop-up',
      Iframe: 'Iframe',
      age_of_domain: 'Domain Age',
      DNSRecord: 'DNS Record',
      web_traffic: 'Web Traffic',
      Page_Rank: 'Page Rank',
      Google_Index: 'Google Index',
      Links_pointing_to_page: 'Inbound Links',
      Statistical_report: 'Statistical Report',
    };

    const entries = Object.entries(featuresObj);
    let i = 0;

    featureGrid.innerHTML = entries
      .map(([key, val]) => {
        let status = 'ok';
        if (val === -1) status = 'bad';
        else if (val === 0) status = 'warn';

        const label = FEATURE_LABELS[key] || key;

        return `
        <div class="feature-chip" style="animation: resultSlideUp 0.4s var(--ease-out) ${(i++) * 40}ms both;">
          <div class="feature-dot ${status}"></div>
          <span class="feature-name">${label}</span>
          <span class="feature-val">${val}</span>
        </div>`;
      })
      .join('');
  }

  // ==========================================
  // Shake animation helper
  // ==========================================
  function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.5s ease';
    setTimeout(() => (el.style.animation = ''), 500);
  }

  // Add shake keyframes dynamically
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      15% { transform: translateX(-8px); }
      30% { transform: translateX(6px); }
      45% { transform: translateX(-4px); }
      60% { transform: translateX(3px); }
      75% { transform: translateX(-1px); }
    }
  `;
  document.head.appendChild(shakeStyle);
})();
