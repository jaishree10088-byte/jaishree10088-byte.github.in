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
  var voiceWarn = document.getElementById('voiceWarn');
  var voiceList = [];
  function fillVoices() {
    var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    var lang = document.getElementById('lang').value || 'hi';
    var type = document.getElementById('voiceType').value || 'auto';
    var matching = [];
    vs.forEach(function (v, i) {
      if (v.lang.toLowerCase().indexOf(lang) === 0) matching.push({ v: v, i: i });
    });
    var femaleRe = /female|woman|girl|samantha|zira|aria|jenny|michelle|emma/i;
    var maleRe = /male|guy|david|daniel|ravi|arjun/i;
    var gendered = matching.filter(function (m) {
      return type === 'female' ? femaleRe.test(m.v.name) : maleRe.test(m.v.name);
    });
    if (type !== 'auto' && gendered.length) matching = gendered;
    voiceList = matching;
    voiceSel.innerHTML = '';
    if (!matching.length) {
      voiceSel.innerHTML = '<option value="">Default voice</option>';
      voiceWarn.style.display = (lang === 'hi') ? 'block' : 'none';
      return;
    }
    voiceWarn.style.display = 'none';
    matching.forEach(function (m) {
      var o = document.createElement('option');
      o.value = m.i; o.textContent = m.v.name + ' (' + m.v.lang + ')';
      voiceSel.appendChild(o);
    });
    voiceSel.value = String(matching[0].i);
  }
  if (window.speechSynthesis) {
    fillVoices();
    speechSynthesis.onvoiceschanged = fillVoices;
  }
  document.getElementById('lang').addEventListener('change', fillVoices);
  document.getElementById('voiceType').addEventListener('change', fillVoices);
  function pickVoice() {
    var vs = speechSynthesis.getVoices();
    var i = parseInt(voiceSel.value, 10);
    if (!isNaN(i) && vs[i]) return vs[i];
    return voiceList.length ? voiceList[0].v : null;
  }
  function voicePitch() {
    var p = parseFloat(document.getElementById('pitch').value) || 1;
    var vt = document.getElementById('voiceType').value;
    if (vt === 'male') p = Math.max(0.7, p - 0.2);
    if (vt === 'female') p = Math.min(1.3, p + 0.2);
    return p;
  }
  function speak(text, onend) {
    if (!window.speechSynthesis) { setStatus('Voice not supported in this browser.'); if (onend) onend(); return; }
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice(); if (v) u.voice = v;
    u.rate = parseFloat(document.getElementById('rate').value) || 1;
    u.pitch = voicePitch();
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
        speak(moral, function () { state.playing = false; if (recordingVoice) { setTimeout(stopVoiceRec, 900); } else { setStatus('Finished. Press Play to watch again.'); } });
      } else { state.playing = false; if (recordingVoice) { setTimeout(stopVoiceRec, 900); } else { setStatus('Finished. Press Play to watch again.'); } }
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
    if (exporting || recordingVoice) return;
    if (!imgReady) { setStatus('Scene picture is still loading, please wait a second.'); return; }
    speechSynthesis.cancel();
    state.playing = true; state.doneZones = 0;
    playLine(0);
  });
  document.getElementById('stopBtn').addEventListener('click', function () {
    state.playing = false; cancelAnimationFrame(raf);
    speechSynthesis.cancel();
    if (recordingVoice) { stopVoiceRec(); }
    if (exporting && rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} }
    exporting = false;
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

  // ---- download video (canvas recording; browser speech cannot be captured,
  // so the exported file has animation but no voice — the page says so plainly)
  var rec = null, chunks = [], exporting = false;
  function pickMime() {
    var cands = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    for (var k = 0; k < cands.length; k++) {
      try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(cands[k])) return cands[k]; } catch (e) {}
    }
    return '';
  }
  document.getElementById('dlBtn').addEventListener('click', function () {
    if (!imgReady) { setStatus('Scene picture is still loading, please wait a second.'); return; }
    if (exporting || recordingVoice) return;
    var mime = pickMime();
    if (!mime) { setStatus('Is browser me video recording supported nahi hai.'); return; }
    speechSynthesis.cancel();
    exporting = true; chunks = [];
    var stream = canvas.captureStream(30);
    try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 }); }
    catch (e) { exporting = false; setStatus('Recording start nahi ho paya.'); return; }
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      exporting = false; state.playing = false;
      var ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
      var blob = new Blob(chunks, { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'whiteboard-video.' + ext;
      document.body.appendChild(a); a.click(); a.remove();
      setStatus('Download ho gaya — Downloads/Gallery me whiteboard-video.' + ext + ' milega. (Video me awaaz nahi hoti — awaaz wali MP4 ke liye story mujhe bhejo.)');
    };
    rec.start();
    state.playing = true; state.doneZones = 0; state.speechDone = true;
    setStatus('Recording… video ban rahi hai, thoda wait karo.');
    playLineExport(0);
    function playLineExport(i) {
      var lines = getLines();
      if (i >= lines.length) {
        state.doneZones = lines.length; state.lineIndex = -1; draw();
        setTimeout(function () { try { rec.stop(); } catch (e) {} }, 900);
        return;
      }
      state.lineIndex = i; state.progress = 0; state.lastTs = 0;
      state.estMs = Math.max(2500, lines[i].length * 90);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tickExport);
    }
    function tickExport(ts) {
      if (!exporting) return;
      if (state.lastTs) {
        var dt = ts - state.lastTs;
        state.progress = Math.min(1, state.progress + dt / state.estMs);
        draw();
      }
      state.lastTs = ts;
      if (state.progress >= 1) { state.doneZones = state.lineIndex + 1; playLineExport(state.lineIndex + 1); return; }
      raf = requestAnimationFrame(tickExport);
    }
  });

  // ---- download video + voice (canvas video + mic audio in ONE file.
  // Browser speech cannot be captured directly, so the mic hears the speaker.)
  var recV = null, chunksV = [], micStream = null, recordingVoice = false;
  function stopVoiceRec() {
    try { if (recV && recV.state !== 'inactive') recV.stop(); } catch (e) {}
  }
  document.getElementById('dlVoiceBtn').addEventListener('click', function () {
    if (!imgReady) { setStatus('Scene picture is still loading, please wait a second.'); return; }
    if (exporting || recordingVoice) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus('Is browser me mic recording supported nahi hai.'); return; }
    setStatus('Mic permission maang raha hai… Allow karo.');
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (ms) {
      micStream = ms;
      var vs = canvas.captureStream(30);
      var combined = new MediaStream(vs.getVideoTracks().concat(ms.getAudioTracks()));
      var mimes = [pickMime(), 'video/webm', ''];
      var started = false;
      for (var k = 0; k < mimes.length && !started; k++) {
        try {
          recV = mimes[k] ? new MediaRecorder(combined, { mimeType: mimes[k], videoBitsPerSecond: 2500000 }) : new MediaRecorder(combined);
          chunksV = [];
          recV.ondataavailable = function (e) { if (e.data && e.data.size) chunksV.push(e.data); };
          recV.onstop = function () {
            recordingVoice = false; state.playing = false;
            if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
            var mt = recV.mimeType || 'video/webm';
            var ext = mt.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
            var blob = new Blob(chunksV, { type: mt });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'whiteboard-video-voice.' + ext;
            document.body.appendChild(a); a.click(); a.remove();
            setStatus('Download ho gaya — Downloads/Gallery me whiteboard-video-voice.' + ext + ' milega (video + voice ek file me).');
          };
          recV.start(); started = true;
        } catch (e) { /* try next mime */ }
      }
      if (!started) {
        recordingVoice = false;
        if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
        setStatus('Voice recording start nahi ho paya. Silent video download try karo.');
        return;
      }
      recordingVoice = true;
      speechSynthesis.cancel();
      state.playing = true; state.doneZones = 0;
      setStatus('Recording with voice… story chal rahi hai, mic awaaz record kar raha hai.');
      playLine(0);
    }).catch(function () {
      setStatus('Mic permission nahi mili. Mic allow karo, ya silent video download karo.');
    });
  });

  // ---- standalone narrator voice ----
  document.getElementById('speakBtn').addEventListener('click', function () {
    var t = document.getElementById('ttsText').value.trim();
    if (!t) return;
    document.getElementById('ttsStatus').textContent = 'Speaking…';
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(t);
    var v = pickVoice(); if (v) u.voice = v;
    u.rate = parseFloat(document.getElementById('rate').value) || 1;
    u.pitch = voicePitch();
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
