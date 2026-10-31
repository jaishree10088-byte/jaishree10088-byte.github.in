// Whiteboard Animation — in-browser version of the SRT whiteboard idea:
// the picture is revealed zone by zone, each zone drawn while its subtitle
// line is spoken by the narrator voice. No upload, no server, no export yet.
(function () {
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var statusEl = document.getElementById('status');
  var sceneImg = new Image();
  var handImg = new Image();
  var imgReady = false, handReady = false;

  var state = { playing: false, lineIndex: -1, progress: 0, lastTs: 0, estMs: 3000, doneZones: 0, speechDone: false };

  function fit() {
    var r = stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
    draw();
  }
  function imgBox() {
    if (!imgReady) return null;
    var cw = canvas.width, ch = canvas.height;
    var s = Math.min(cw / sceneImg.width, ch / sceneImg.height);
    var dw = sceneImg.width * s, dh = sceneImg.height * s;
    return { dx: (cw - dw) / 2, dy: (ch - dh) / 2, dw: dw, dh: dh };
  }
  function draw() {
    ctx.fillStyle = '#F5EBD7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var b = imgBox();
    if (!b) return;
    var lines = getLines();
    var n = lines.length;
    // fully drawn zones
    for (var i = 0; i < state.doneZones && i < n; i++) {
      var x0 = b.dx + (b.dw * i) / n, x1 = b.dx + (b.dw * (i + 1)) / n;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, canvas.height); ctx.clip();
      ctx.drawImage(sceneImg, b.dx, b.dy, b.dw, b.dh);
      ctx.restore();
    }
    // current zone, partially revealed left -> right
    if (state.playing && state.lineIndex >= 0 && state.lineIndex < n) {
      var i2 = state.lineIndex;
      var zx0 = b.dx + (b.dw * i2) / n, zx1 = b.dx + (b.dw * (i2 + 1)) / n;
      var fx = zx0 + (zx1 - zx0) * state.progress;
      ctx.save();
      ctx.beginPath(); ctx.rect(zx0, 0, fx - zx0, canvas.height); ctx.clip();
      ctx.drawImage(sceneImg, b.dx, b.dy, b.dw, b.dh);
      ctx.restore();
      // hand with its pen tip on the frontier
      if (handReady) {
        var hw = canvas.width * 0.11;
        var hh = hw * (handImg.height / handImg.width);
        ctx.drawImage(handImg, fx - hw * 0.089, (canvas.height / 2) - hh * 0.071 - hh * 0.35, hw, hh);
      }
    }
  }
  function getLines() {
    return document.getElementById('lines').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function setStatus(t) { statusEl.textContent = t; }

  // ---- narrator voice ----
  var voiceSel = document.getElementById('voice');
  function fillVoices() {
    var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voiceSel.innerHTML = '';
    if (!vs.length) { voiceSel.innerHTML = '<option value="">Default voice</option>'; return; }
    vs.forEach(function (v, i) {
      var o = document.createElement('option');
      o.value = i; o.textContent = v.name + ' (' + v.lang + ')';
      voiceSel.appendChild(o);
    });
    var hi = vs.findIndex(function (v) { return v.lang.toLowerCase().indexOf('hi') === 0; });
    voiceSel.value = String(hi >= 0 ? hi : 0);
  }
  if (window.speechSynthesis) {
    fillVoices();
    speechSynthesis.onvoiceschanged = fillVoices;
  }
  function pickVoice() {
    var vs = speechSynthesis.getVoices();
    var i = parseInt(voiceSel.value, 10);
    return vs[isNaN(i) ? 0 : i] || null;
  }
  function speak(text, onend) {
    if (!window.speechSynthesis) { setStatus('Voice not supported in this browser.'); if (onend) onend(); return; }
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice(); if (v) u.voice = v;
    u.rate = parseFloat(document.getElementById('rate').value) || 1;
    u.pitch = parseFloat(document.getElementById('pitch').value) || 1;
    u.onend = function () { if (onend) onend(); };
    u.onerror = function () { if (onend) onend(); };
    speechSynthesis.speak(u);
  }

  // ---- story player ----
  var raf = 0;
  function maybeAdvance() {
    if (!state.playing) return;
    if (state.progress >= 1 && state.speechDone) {
      state.doneZones = state.lineIndex + 1; state.progress = 1; draw();
      playLine(state.lineIndex + 1);
    }
  }
  function tick(ts) {
    if (!state.playing) return;
    if (state.lastTs) {
      var dt = ts - state.lastTs;
      state.progress = Math.min(1, state.progress + dt / state.estMs);
      draw();
    }
    state.lastTs = ts;
    if (state.progress >= 1 && state.speechDone) { maybeAdvance(); return; }
    raf = requestAnimationFrame(tick);
  }
  function playLine(i) {
    var lines = getLines();
    if (i >= lines.length) {
      // moral line over the finished drawing
      var moral = document.getElementById('moral').value.trim();
      state.doneZones = lines.length; state.lineIndex = -1; draw();
      if (moral) {
        setStatus('Moral: ' + moral);
        speak(moral, function () { state.playing = false; setStatus('Finished. Press Play to watch again.'); });
      } else { state.playing = false; setStatus('Finished. Press Play to watch again.'); }
      return;
    }
    state.lineIndex = i; state.progress = 0; state.lastTs = 0; state.speechDone = false;
    state.estMs = Math.max(2500, lines[i].length * 90);
    setStatus('Drawing + speaking line ' + (i + 1) + ' of ' + lines.length + '…');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    speak(lines[i], function () {
      state.speechDone = true; maybeAdvance();
    });
  }
  document.getElementById('playBtn').addEventListener('click', function () {
    if (!imgReady) { setStatus('Scene picture is still loading, please wait a second.'); return; }
    speechSynthesis.cancel();
    state.playing = true; state.doneZones = 0;
    playLine(0);
  });
  document.getElementById('stopBtn').addEventListener('click', function () {
    state.playing = false; cancelAnimationFrame(raf);
    speechSynthesis.cancel();
    state.doneZones = 0; state.lineIndex = -1; state.progress = 0; state.speechDone = false;
    draw(); setStatus('Stopped. Press Play to start again.');
  });
  document.getElementById('ratio').addEventListener('change', function (e) {
    var v = e.target.value;
    stage.style.aspectRatio = v;
    stage.style.maxWidth = (v === '9/16') ? '360px' : '960px';
    setTimeout(fit, 50);
  });
  document.getElementById('imgUpload').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { imgReady = false; sceneImg.src = r.result; };
    r.readAsDataURL(f);
  });
  sceneImg.onload = function () { imgReady = true; draw(); };
  handImg.onload = function () { handReady = true; draw(); };
  sceneImg.src = 'images/chidiya-scene.png';
  handImg.src = 'images/hand.png';

  // ---- standalone narrator voice ----
  document.getElementById('speakBtn').addEventListener('click', function () {
    var t = document.getElementById('ttsText').value.trim();
    if (!t) return;
    document.getElementById('ttsStatus').textContent = 'Speaking…';
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(t);
    var v = pickVoice(); if (v) u.voice = v;
    u.rate = parseFloat(document.getElementById('rate').value) || 1;
    u.pitch = parseFloat(document.getElementById('pitch').value) || 1;
    u.onend = function () { document.getElementById('ttsStatus').textContent = 'Done.'; };
    speechSynthesis.speak(u);
  });
  document.getElementById('speakStopBtn').addEventListener('click', function () {
    speechSynthesis.cancel();
    document.getElementById('ttsStatus').textContent = 'Stopped.';
  });

  window.addEventListener('resize', fit);
  fit();
})();
