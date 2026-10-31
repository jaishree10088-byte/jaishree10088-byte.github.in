/* 2D Cartoon Animation - cutout puppet studio. All UI text is English. */
var RATE = 1;          // 1 = normal, 0.4 = slow motion
var busy = false;      // true while a scripted move is playing
var gen = 0;           // bumped to cancel idle loops
var running = [];      // live WAAPI animations
var current = 'police';
var P = {};            // current character part elements
var HEAD_BASE = 'head.png';

var CHARACTERS = {
  police: {
    dir: '/2d-cartoon-animation/images/police',
    heads: ['head.png', 'head_blink.png', 'head_smile.png', 'head_laugh.png',
            'head_cry.png', 'head_angry.png', 'head_surprised.png',
            'head_talk1.png', 'head_talk2.png'],
    parts: {
      legL:  { f: 'legL.png',  w: 95,  h: 224, left: 64,  top: 271, z: 1, o: 'top center' },
      legR:  { f: 'legR.png',  w: 70,  h: 236, left: 133, top: 271, z: 2, o: 'top center' },
      torso: { f: 'torso.png', w: 144, h: 199, left: 68,  top: 55,  z: 3, o: 'center' },
      belt:  { f: 'belt.png',  w: 105, h: 92,  left: 88,  top: 217, z: 4, o: 'center' },
      holster:{ f: 'holster.png', w: 42, h: 62,  left: 162, top: 306, z: 4, o: 'top center' },
      armL:  { f: 'armL.png',  w: 77,  h: 185, left: 33,  top: 136, z: 5, o: 'top center' },
      armR:  { f: 'armR.png',  w: 77,  h: 189, left: 170, top: 136, z: 5, o: 'top center' },
      head:  { f: 'head.png',  w: 124, h: 141, left: 78,  top: 9,   z: 6, o: 'bottom center' }
    }
  },
  man: {
    dir: '/2d-cartoon-animation/images/man',
    heads: ['head.png', 'head_blink.png', 'head_smile.png', 'head_laugh.png',
            'head_cry.png', 'head_angry.png', 'head_surprised.png',
            'head_talk1.png', 'head_talk2.png'],
    parts: {
      legL:  { f: 'legL.png',  w: 84,  h: 202, left: 70,  top: 305, z: 1, o: 'top center' },
      legR:  { f: 'legR.png',  w: 75,  h: 198, left: 130, top: 305, z: 2, o: 'top center' },
      torso: { f: 'torso.png', w: 122, h: 234, left: 79,  top: 102, z: 3, o: 'center' },
      pants: { f: 'pants.png', w: 101, h: 65,  left: 90,  top: 288, z: 4, o: 'center' },
      armL:  { f: 'armL.png',  w: 52,  h: 119, left: 71,  top: 158, z: 5, o: 'top center' },
      armR:  { f: 'armR.png',  w: 52,  h: 122, left: 161, top: 158, z: 5, o: 'top center' },
      head:  { f: 'head.png',  w: 139, h: 158, left: 70,  top: 9,   z: 6, o: 'bottom center' }
    }
  },
  cutout: {
    dir: '/2d-cartoon-animation/images/cutout',
    heads: ['head.png', 'head_blink.png'],
    parts: {
      shoeL: { f: 'shoeL.png', w: 105, h: 47,  left: 60,  top: 463, z: 1, o: 'top center' },
      shoeR: { f: 'shoeR.png', w: 105, h: 47,  left: 116, top: 463, z: 1, o: 'top center' },
      shinL: { f: 'shinL.png', w: 66,  h: 109, left: 79,  top: 367, z: 2, o: 'top center' },
      shinR: { f: 'shinR.png', w: 66,  h: 109, left: 135, top: 367, z: 2, o: 'top center' },
      thighL:{ f: 'thighL.png',w: 92,  h: 127, left: 66,  top: 255, z: 3, o: 'top center' },
      thighR:{ f: 'thighR.png',w: 92,  h: 127, left: 123, top: 255, z: 3, o: 'top center' },
      torso: { f: 'torso.png', w: 132, h: 133, left: 74,  top: 112, z: 4, o: 'center' },
      belt:  { f: 'belt.png',  w: 152, h: 33,  left: 64,  top: 235, z: 5, o: 'center' },
      sleeveL:{ f: 'sleeveL.png',w: 70, h: 94,  left: 29,  top: 122, z: 6, o: 'top center' },
      sleeveR:{ f: 'sleeveR.png',w: 70, h: 94,  left: 181, top: 122, z: 6, o: 'top center' },
      foreL: { f: 'foreL.png', w: 81,  h: 168, left: 24,  top: 184, z: 7, o: 'top center' },
      foreR: { f: 'foreR.png', w: 81,  h: 168, left: 176, top: 184, z: 7, o: 'top center' },
      head:  { f: 'head.png',  w: 116, h: 115, left: 82,  top: 13,  z: 8, o: 'bottom center' }
    }
  }
};

var stage = document.getElementById('stage');
var charSlot = document.getElementById('charSlot');
var animalSlot = document.getElementById('animalSlot');
var propSlot = document.getElementById('propSlot');
var burstEl = document.getElementById('burst');
var bubbleEl = document.getElementById('bubble');
var captionEl = document.getElementById('caption');

function D(ms) { return ms / RATE; }
function wait(ms) { return new Promise(function (r) { setTimeout(r, D(ms)); }); }
function A(el, kf, ms, ease) {
  if (!el) return null;
  var an = el.animate(kf, { duration: D(ms), easing: ease || 'ease-in-out', fill: 'both' });
  running.push(an);
  return an;
}
function fin(an) { return an ? an.finished.catch(function () {}) : Promise.resolve(); }
function resetEl(el) { if (el) { el.style.transform = ''; } }

function stopAll() {
  gen++;
  busy = false;
  running.forEach(function (an) { try { an.cancel(); } catch (e) {} });
  running = [];
  if (P.char) resetEl(P.char);
  Object.keys(P).forEach(function (k) { if (P[k] && P[k].style) resetEl(P[k]); });
  setHead('head.png');
  stage.style.transform = '';
  burstEl.classList.add('hidden');
  bubbleEl.classList.add('hidden');
  captionEl.textContent = '';
  animalSlot.innerHTML = '';
  propSlot.innerHTML = '';
  var opp = document.getElementById('oppSlot');
  if (opp) opp.remove();
  document.querySelectorAll('.story-extra').forEach(function (el) { el.remove(); });
  var up = document.querySelector('#uploadSlot img');
  if (up) up.style.transform = '';
}

function buildChar(key) {
  stopAll();
  clearUpload();
  current = key;
  var cfg = CHARACTERS[key];
  charSlot.innerHTML = '';
  var note0 = document.getElementById('loadNote');
  if (note0) note0.classList.remove('hidden');
  setTimeout(function () { var n = document.getElementById('loadNote'); if (n) n.classList.add('hidden'); }, 10000);
  var wrap = document.createElement('div');
  wrap.className = 'char';
  P = { char: wrap };
  Object.keys(cfg.parts).forEach(function (name) {
    var p = cfg.parts[name];
    var img = document.createElement('img');
    img.className = 'part';
    img.draggable = false;
    img.src = cfg.dir + '/' + p.f + '?v=3';
    if (name === 'head') { img.onload = function () { var n = document.getElementById('loadNote'); if (n) n.classList.add('hidden'); }; }
    img.style.cssText = 'width:' + p.w + 'px;height:' + p.h + 'px;left:' + p.left +
      'px;top:' + p.top + 'px;z-index:' + p.z + ';transform-origin:' + p.o + ';';
    wrap.appendChild(img);
    P[name] = img;
  });
  charSlot.appendChild(wrap);
  document.querySelectorAll('.char-btn').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-char') === key);
  });
  idleBlink();
}

function setHead(file) {
  if (P.head) P.head.src = CHARACTERS[current].dir + '/' + file + '?v=3';
}
function headEl() { return P.head; }

/* Idle blinking, only while nothing else plays. */
function idleBlink() {
  var g = gen;
  (function loop() {
    setTimeout(function () {
      if (g !== gen || busy) { if (g === gen) setTimeout(loop, 1200); return; }
      if (P.head) {
        setHead('head_blink.png');
        setTimeout(function () { if (g === gen && !busy) setHead('head.png'); }, 150);
      }
      if (g === gen) loop();
    }, 3800);
  })();
}

function showBubble(text, ms) {
  bubbleEl.textContent = text;
  bubbleEl.style.left = '50%';
  bubbleEl.style.top = '6px';
  bubbleEl.style.transform = 'translateX(-50%)';
  bubbleEl.classList.remove('hidden');
  if (ms) setTimeout(function () { bubbleEl.classList.add('hidden'); }, D(ms));
}
function showCaption(text) { captionEl.textContent = text; }
function showBurst(text, left, top) {
  burstEl.textContent = text;
  burstEl.style.left = left;
  burstEl.style.top = top;
  burstEl.classList.remove('hidden');
}
function hideBurst() { burstEl.classList.add('hidden'); }

function setBackdrop(name) {
  stage.className = 'backdrop-' + name;
  var sel = document.getElementById('backdropSel');
  if (sel) sel.value = name;
  document.getElementById('bgFar').innerHTML = BACKDROPS[name] ? BACKDROPS[name][0] : '';
  document.getElementById('bgNear').innerHTML = BACKDROPS[name] ? BACKDROPS[name][1] : '';
}
var BACKDROPS = {
  sky: ['<svg width="100%" height="200"><circle cx="80" cy="60" r="42" fill="#ffe066"/><g fill="#ffffff" opacity="0.9"><ellipse cx="250" cy="55" rx="60" ry="22"/><ellipse cx="310" cy="48" rx="55" ry="20"/></g></svg>', ''],
  village: ['<svg width="100%" height="220"><g fill="#fff8e7"><rect x="40" y="110" width="90" height="70"/><polygon points="35,110 85,70 135,110" fill="#c96a3b"/><rect x="250" y="120" width="100" height="60"/><polygon points="245,120 300,80 355,120" fill="#c96a3b"/></g></svg>', '<svg width="100%" height="120"><g fill="#3f8f2f"><circle cx="120" cy="40" r="42"/><circle cx="300" cy="35" r="50"/></g></svg>'],
  jungle: ['<svg width="100%" height="260"><g fill="#2f7a1e"><ellipse cx="80" cy="90" rx="70" ry="90"/><ellipse cx="260" cy="80" rx="80" ry="100"/><ellipse cx="430" cy="95" rx="70" ry="85"/></g></svg>', '<svg width="100%" height="120"><g fill="#1e5c14"><ellipse cx="150" cy="70" rx="60" ry="50"/><ellipse cx="350" cy="70" rx="70" ry="55"/></g></svg>'],
  school: ['<svg width="100%" height="220"><g fill="#fff"><rect x="120" y="80" width="220" height="110" fill="#fdf6dd"/><rect x="200" y="30" width="60" height="55" fill="#fdf6dd"/><polygon points="195,32 230,5 265,32" fill="#b34a2e"/></g></svg>', ''],
  haunted: ['<svg width="100%" height="240"><g fill="#151528"><rect x="150" y="60" width="170" height="140"/><polygon points="140,62 235,10 330,62"/><rect x="220" y="140" width="34" height="60"/></g><circle cx="70" cy="50" r="26" fill="#f5f0dc"/></svg>', '<svg width="100%" height="120"><g fill="#0f0f22"><ellipse cx="100" cy="80" rx="60" ry="40"/><ellipse cx="320" cy="85" rx="70" ry="42"/></g></svg>'],
  city: ['<svg width="100%" height="240"><g fill="#5d768d"><rect x="30" y="60" width="70" height="150"/><rect x="120" y="30" width="80" height="180"/><rect x="230" y="80" width="60" height="130"/><rect x="320" y="40" width="80" height="170"/></g></svg>', ''],
  beach: ['<svg width="100%" height="200"><circle cx="80" cy="55" r="38" fill="#ffe066"/><g fill="#8a5a2b"><ellipse cx="300" cy="150" rx="45" ry="14"/><rect x="296" y="60" width="8" height="95"/></g></svg>', '<svg width="100%" height="90"><g fill="#e8c07a"><circle cx="90" cy="55" r="26"/><circle cx="280" cy="60" r="30"/></g></svg>'],
  palace: ['<svg width="100%" height="240"><g fill="#f6d47c" stroke="#b8860b"><rect x="140" y="80" width="200" height="120"/><polygon points="130,82 240,20 350,82"/><rect x="225" y="140" width="30" height="60"/></g></svg>', '']
};

function propSVG(kind, size) {
  var s = size || 110;
  var map = {
    apple: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><circle cx="38" cy="55" r="26" fill="#e23b2e"/><circle cx="62" cy="55" r="26" fill="#e23b2e"/><path d="M50 30 Q52 12 66 10" stroke="#2f7a1e" stroke-width="5" fill="none"/><ellipse cx="62" cy="42" rx="12" ry="6" fill="#3f9a2e"/></svg>',
    cup: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><rect x="28" y="30" width="44" height="55" rx="8" fill="#2f7ad4"/><rect x="72" y="40" width="12" height="26" rx="6" fill="none" stroke="#2f7ad4" stroke-width="5"/><rect x="28" y="30" width="44" height="12" fill="#7fb6ec"/></svg>',
    book: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><rect x="12" y="22" width="38" height="58" rx="4" fill="#b34a2e"/><rect x="50" y="22" width="38" height="58" rx="4" fill="#d4693f"/><line x1="20" y1="36" x2="42" y2="36" stroke="#fff" stroke-width="3"/><line x1="20" y1="48" x2="42" y2="48" stroke="#fff" stroke-width="3"/><line x1="58" y1="36" x2="80" y2="36" stroke="#fff" stroke-width="3"/><line x1="58" y1="48" x2="80" y2="48" stroke="#fff" stroke-width="3"/></svg>',
    pot: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><ellipse cx="50" cy="38" rx="36" ry="12" fill="#3a3a3a"/><rect x="14" y="38" width="72" height="42" rx="10" fill="#3a3a3a"/><ellipse cx="50" cy="40" rx="28" ry="7" fill="#7a4a21"/></svg>',
    bush: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><g fill="#2f7a1e"><circle cx="30" cy="65" r="24"/><circle cx="55" cy="52" r="28"/><circle cx="78" cy="66" r="22"/></g></svg>',
    crown: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><polygon points="10,70 10,30 30,50 50,25 70,50 90,30 90,70" fill="#ffcf2e" stroke="#b8860b" stroke-width="3"/><rect x="10" y="70" width="80" height="10" fill="#ffcf2e" stroke="#b8860b" stroke-width="3"/></svg>',
    chest: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100"><rect x="12" y="42" width="76" height="44" rx="6" fill="#8a5a2b"/><path d="M12 46 Q50 8 88 46" fill="#a66a33"/><rect x="44" y="58" width="12" height="12" fill="#ffcf2e"/></svg>'
  };
  return map[kind] || '';
}
function showProp(kind, left, bottom, size) {
  var d = document.createElement('div');
  d.className = 'prop';
  d.style.left = left;
  d.style.bottom = bottom;
  d.innerHTML = propSVG(kind, size || 110);
  propSlot.appendChild(d);
  return d;
}

/* ---------------- Face & body ---------------- */
async function expr(file, ms) {
  setHead(file);
  await wait(ms || 1600);
  setHead('head.png');
}
async function doBlink() {
  setHead('head_blink.png');
  await wait(160);
  setHead('head.png');
}
async function talkCycle(ms, withBubble) {
  var g = gen;
  var line = document.getElementById('talkInput').value || 'Hello friends!';
  if (withBubble) showBubble(line, ms);
  var end = Date.now() + D(ms);
  var i = 0;
  while (Date.now() < end && g === gen) {
    setHead(i % 2 === 0 ? 'head_talk1.png' : 'head_talk2.png');
    i++;
    await wait(170);
  }
  if (g === gen) setHead('head.png');
  bubbleEl.classList.add('hidden');
}
async function wave() {
  var a = A(P.armR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-140deg)' }, { transform: 'rotate(-118deg)' }, { transform: 'rotate(-142deg)' }, { transform: 'rotate(-118deg)' }, { transform: 'rotate(0deg)' }], 5200);
  await fin(a);
}
async function headTurn() {
  var a = A(P.head, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(0deg)' }], 1800);
  await fin(a);
}

/* ---------------- Cartoon actions ---------------- */
function burstAt(text, left, top, ms) {
  showBurst(text, left, top);
  return wait(ms || 700).then(hideBurst);
}
async function punch() {
  var lunge = A(P.char, [{ transform: 'translateX(0px)' }, { transform: 'translateX(26px)' }, { transform: 'translateX(0px)' }], 700);
  var arm = A(P.armR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-72deg)' }, { transform: 'rotate(0deg)' }], 700);
  await wait(280);
  await burstAt('POW!', '68%', '38%', 650);
  await Promise.all([fin(lunge), fin(arm)]);
}
async function kick() {
  var lunge = A(P.char, [{ transform: 'translateX(0px)' }, { transform: 'translateX(22px)' }, { transform: 'translateX(0px)' }], 700);
  var leg = A(P.legR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-58deg)' }, { transform: 'rotate(0deg)' }], 700);
  await wait(280);
  await burstAt('BAM!', '70%', '62%', 650);
  await Promise.all([fin(lunge), fin(leg)]);
}
async function slap() {
  var arm = A(P.armL, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-95deg)' }, { transform: 'rotate(0deg)' }], 550);
  await wait(200);
  await burstAt('SLAP!', '22%', '40%', 650);
  await fin(arm);
}
async function fight() {
  var other = current === 'police' ? 'man' : 'police';
  var cfg = CHARACTERS[other];
  var opp = document.createElement('div');
  opp.id = 'oppSlot';
  opp.style.cssText = 'position:absolute;right:6%;bottom:8px;width:280px;height:520px;z-index:3;';
  var w = document.createElement('div');
  w.className = 'char';
  var refs = {};
  Object.keys(cfg.parts).forEach(function (name) {
    var p = cfg.parts[name];
    var img = document.createElement('img');
    img.className = 'part';
    img.src = cfg.dir + '/' + p.f + '?v=3';
    img.style.cssText = 'width:' + p.w + 'px;height:' + p.h + 'px;left:' + p.left + 'px;top:' + p.top + 'px;z-index:' + p.z + ';transform-origin:' + p.o + ';';
    w.appendChild(img);
    refs[name] = img;
  });
  opp.appendChild(w);
  stage.appendChild(opp);
  showCaption('A friendly fight! No one really gets hurt.');
  await punch();
  var sh = A(w, [{ transform: 'translateX(0px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(0px)' }], 500);
  await fin(sh);
  var oArm = A(refs.armL, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-70deg)' }, { transform: 'rotate(0deg)' }], 600);
  var hShake = A(P.char, [{ transform: 'translateX(0px)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0px)' }], 500);
  await Promise.all([fin(oArm), fin(hShake)]);
  await punch();
  var fall = A(w, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(80deg) translateY(60px)' }], 700);
  await fin(fall);
  showCaption('And the hero wins! Friends again.');
  await wait(1400);
  opp.remove();
  captionEl.textContent = '';
}
async function chase() {
  var dog = showAnimal('dog');
  showCaption('Run! The dog is chasing!');
  var legs = [A(P.legL, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(38deg)' }, { transform: 'rotate(-30deg)' }, { transform: 'rotate(0deg)' }], 900), A(P.legR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-30deg)' }, { transform: 'rotate(38deg)' }, { transform: 'rotate(0deg)' }], 900)];
  var run = A(P.char, [{ transform: 'translateX(-260px)' }, { transform: 'translateX(280px)' }], 2600, 'linear');
  var dRun = null;
  if (dog) dRun = A(dog, [{ transform: 'translateX(-320px)' }, { transform: 'translateX(300px)' }], 2600, 'linear');
  await Promise.all([fin(run)].concat(dRun ? [fin(dRun)] : [], legs.map(fin)));
  captionEl.textContent = '';
}
async function hide() {
  var bush = showProp('bush', '38%', '30px', 220);
  bush.style.zIndex = 6;
  showCaption('Shh! Hiding behind the bush...');
  var h = A(P.char, [{ transform: 'scale(1)' }, { transform: 'scale(0.45) translateY(90px)' }], 900);
  await fin(h);
  await wait(1100);
  var back = A(P.char, [{ transform: 'scale(0.45) translateY(90px)' }, { transform: 'scale(1)' }], 700);
  await fin(back);
  showCaption('Found you!');
  await wait(900);
  captionEl.textContent = '';
}
async function eat() {
  var apple = showProp('apple', '64%', '300px', 70);
  showCaption('Yum! Eating an apple.');
  var arm = A(P.armR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-128deg)' }], 700);
  await fin(arm);
  for (var i = 0; i < 3; i++) {
    var m = A(P.head, [{ transform: 'translateY(0px)' }, { transform: 'translateY(5px)' }, { transform: 'translateY(0px)' }], 320);
    await fin(m);
    apple.style.transform = 'scale(' + (1 - (i + 1) * 0.28) + ')';
    await wait(120);
  }
  apple.remove();
  var down = A(P.armR, [{ transform: 'rotate(-128deg)' }, { transform: 'rotate(0deg)' }], 600);
  await fin(down);
  captionEl.textContent = '';
}
async function drink() {
  var cup = showProp('cup', '62%', '300px', 70);
  showCaption('Drinking a cool drink.');
  var arm = A(P.armR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-128deg)' }], 700);
  await fin(arm);
  var tilt = A(P.head, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-14deg)' }], 500);
  var ctilt = A(cup, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(38deg)' }], 500);
  await Promise.all([fin(tilt), fin(ctilt)]);
  await wait(800);
  await Promise.all([fin(A(P.head, [{ transform: 'rotate(-14deg)' }, { transform: 'rotate(0deg)' }], 500)), fin(A(cup, [{ transform: 'rotate(38deg)' }, { transform: 'rotate(0deg)' }], 500))]);
  cup.remove();
  var down = A(P.armR, [{ transform: 'rotate(-128deg)' }, { transform: 'rotate(0deg)' }], 600);
  await fin(down);
  captionEl.textContent = '';
}
async function cook() {
  var pot = showProp('pot', '40%', '40px', 150);
  showCaption('Cooking something tasty...');
  for (var i = 0; i < 4; i++) {
    var st = A(P.armR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-28deg)' }, { transform: 'rotate(0deg)' }], 500);
    await fin(st);
  }
  for (var j = 0; j < 3; j++) {
    var steam = document.createElement('div');
    steam.textContent = '~';
    steam.style.cssText = 'position:absolute;left:' + (46 + j * 3) + '%;bottom:190px;font-size:34px;color:#fff;opacity:0.8;';
    propSlot.appendChild(steam);
    var up = A(steam, [{ transform: 'translateY(0px)', opacity: 0.8 }, { transform: 'translateY(-70px)', opacity: 0 }], 1300);
    await fin(up);
    steam.remove();
  }
  pot.remove();
  captionEl.textContent = '';
}
async function read() {
  var book = showProp('book', '42%', '250px', 120);
  showCaption('Reading a very good book.');
  var tilt = A(P.head, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(13deg)' }], 600);
  await fin(tilt);
  for (var i = 0; i < 3; i++) {
    var nod = A(P.head, [{ transform: 'rotate(13deg)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(13deg)' }], 500);
    await fin(nod);
  }
  book.remove();
  var up = A(P.head, [{ transform: 'rotate(13deg)' }, { transform: 'rotate(0deg)' }], 500);
  await fin(up);
  captionEl.textContent = '';
}

/* ---------------- Advanced ---------------- */
async function walkInPlace(ms) {
  ms = ms || 3200;
  var g = gen;
  var t0 = Date.now();
  while (Date.now() - t0 < D(ms) && g === gen) {
    var a1 = A(P.legL, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(28deg)' }, { transform: 'rotate(0deg)' }], 600);
    var a2 = A(P.legR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-28deg)' }, { transform: 'rotate(0deg)' }], 600);
    var b = A(P.char, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-7px)' }, { transform: 'translateY(0px)' }], 600);
    await Promise.all([fin(a1), fin(a2), fin(b)]);
    var a3 = A(P.legL, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-28deg)' }, { transform: 'rotate(0deg)' }], 600);
    var a4 = A(P.legR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(28deg)' }, { transform: 'rotate(0deg)' }], 600);
    var b2 = A(P.char, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-7px)' }, { transform: 'translateY(0px)' }], 600);
    await Promise.all([fin(a3), fin(a4), fin(b2)]);
  }
}
async function runAcross() {
  showCaption('Running fast!');
  var legs = [A(P.legL, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(42deg)' }, { transform: 'rotate(-36deg)' }, { transform: 'rotate(0deg)' }], 700), A(P.legR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-36deg)' }, { transform: 'rotate(42deg)' }, { transform: 'rotate(0deg)' }], 700)];
  var lean = A(P.char, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(7deg)' }], 500);
  var mv = A(P.char, [{ transform: 'translateX(-280px) rotate(7deg)' }, { transform: 'translateX(300px) rotate(7deg)' }], 2400, 'linear');
  await fin(mv);
  await Promise.all(legs.map(fin));
  await fin(lean);
  captionEl.textContent = '';
}
async function jumps() {
  for (var i = 0; i < 3; i++) {
    var up = A(P.char, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-95px)' }], 380);
    var tuck = A(P.legL, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(30deg)' }], 380);
    var tuck2 = A(P.legR, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-30deg)' }], 380);
    await Promise.all([fin(up), fin(tuck), fin(tuck2)]);
    var dn = A(P.char, [{ transform: 'translateY(-95px)' }, { transform: 'translateY(0px)' }], 380);
    var un = A(P.legL, [{ transform: 'rotate(30deg)' }, { transform: 'rotate(0deg)' }], 380);
    var un2 = A(P.legR, [{ transform: 'rotate(-30deg)' }, { transform: 'rotate(0deg)' }], 380);
    await Promise.all([fin(dn), fin(un), fin(un2)]);
  }
}
async function charRotate() {
  var a = A(P.char, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], 1400);
  await fin(a);
}
async function zoomIn() {
  var a = A(stage, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }], 900);
  await fin(a);
  await wait(1200);
  var b = A(stage, [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], 900);
  await fin(b);
}
async function zoomOut() {
  var a = A(stage, [{ transform: 'scale(1)' }, { transform: 'scale(0.72)' }], 900);
  await fin(a);
  await wait(1200);
  var b = A(stage, [{ transform: 'scale(0.72)' }, { transform: 'scale(1)' }], 900);
  await fin(b);
}
async function parallax() {
  showCaption('Parallax: near trees move faster than far hills.');
  var far = document.getElementById('bgFar');
  var near = document.getElementById('bgNear');
  var f = A(far, [{ transform: 'translateX(0px)' }, { transform: 'translateX(-45px)' }], 3000, 'linear');
  var n = A(near, [{ transform: 'translateX(0px)' }, { transform: 'translateX(-110px)' }], 3000, 'linear');
  await walkInPlace(3000);
  await Promise.all([fin(f), fin(n)]);
  far.style.transform = '';
  near.style.transform = '';
  captionEl.textContent = '';
}
function toggleSlow() {
  RATE = RATE === 1 ? 0.4 : 1;
  document.getElementById('slowBtn').textContent = 'Slow motion: ' + (RATE === 1 ? 'OFF' : 'ON');
  return RATE;
}
async function slowmo() {
  toggleSlow();
  showCaption(RATE === 0.4 ? 'Slow motion ON. Watch the walk closely.' : 'Slow motion OFF.');
  await walkInPlace(2200);
  captionEl.textContent = '';
}
var BACKDROP_ORDER = ['sky', 'village', 'jungle', 'school', 'haunted', 'city', 'beach', 'palace'];
async function transition() {
  var cur = BACKDROP_ORDER.indexOf(document.getElementById('backdropSel').value);
  var nxt = BACKDROP_ORDER[(cur + 1) % BACKDROP_ORDER.length];
  var f = A(stage, [{ opacity: 1 }, { opacity: 0 }], 600);
  await fin(f);
  setBackdrop(nxt);
  var b = A(stage, [{ opacity: 0 }, { opacity: 1 }], 600);
  await fin(b);
}
async function morph() {
  showCaption('Morphing into the other character...');
  var out = A(P.char, [{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(0) rotate(180deg)' }], 700);
  await fin(out);
  var other = current === 'police' ? 'man' : 'police';
  buildChar(other);
  var inn = A(P.char, [{ transform: 'scale(0) rotate(-180deg)' }, { transform: 'scale(1) rotate(0deg)' }], 700);
  await fin(inn);
  captionEl.textContent = '';
}

/* ---------------- Animals (simple SVG friends) ---------------- */
function svgAnimal(kind) {
  var S = {
    mouse: '<svg width="170" height="110" viewBox="0 0 170 110"><path d="M20 80 Q50 95 95 80" stroke="#888" stroke-width="4" fill="none"/><ellipse cx="85" cy="70" rx="42" ry="26" fill="#9a9a9a"/><circle cx="118" cy="48" r="16" fill="#9a9a9a"/><circle cx="128" cy="40" r="14" fill="#c9c9c9"/><circle cx="138" cy="42" r="6" fill="#f4c6c6"/><circle cx="118" cy="46" r="4" fill="#222"/><line x1="60" y1="96" x2="55" y2="110" stroke="#888" stroke-width="4"/><line x1="105" y1="96" x2="110" y2="110" stroke="#888" stroke-width="4"/></svg>',
    lion: '<svg width="190" height="130" viewBox="0 0 190 130"><ellipse cx="95" cy="85" rx="52" ry="30" fill="#e8a33d"/><circle cx="140" cy="55" r="40" fill="#b06a1f"/><circle cx="140" cy="55" r="26" fill="#f4c07a"/><circle cx="132" cy="50" r="4" fill="#222"/><circle cx="150" cy="50" r="4" fill="#222"/><ellipse cx="141" cy="66" rx="9" ry="7" fill="#222"/><line x1="50" y1="112" x2="45" y2="128" stroke="#e8a33d" stroke-width="6"/><line x1="135" y1="112" x2="140" y2="128" stroke="#e8a33d" stroke-width="6"/></svg>',
    monkey: '<svg width="170" height="130" viewBox="0 0 170 130"><path d="M30 90 Q10 70 22 50" stroke="#8a5a2b" stroke-width="5" fill="none"/><ellipse cx="85" cy="85" rx="40" ry="28" fill="#8a5a2b"/><circle cx="120" cy="50" r="26" fill="#8a5a2b"/><circle cx="112" cy="46" r="16" fill="#f0c8a0"/><circle cx="130" cy="46" r="16" fill="#f0c8a0"/><circle cx="116" cy="48" r="3" fill="#222"/><circle cx="128" cy="48" r="3" fill="#222"/><circle cx="96" cy="40" r="9" fill="#8a5a2b"/><circle cx="146" cy="40" r="9" fill="#8a5a2b"/></svg>',
    elephant: '<svg width="210" height="130" viewBox="0 0 210 130"><ellipse cx="100" cy="75" rx="58" ry="36" fill="#8d99ae"/><circle cx="158" cy="52" r="30" fill="#8d99ae"/><ellipse cx="146" cy="42" rx="16" ry="22" fill="#7a8698"/><path d="M178 60 Q196 70 188 96" stroke="#8d99ae" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="168" cy="48" r="4" fill="#222"/><path d="M178 78 L196 84" stroke="#fff" stroke-width="4"/><line x1="60" y1="108" x2="58" y2="128" stroke="#8d99ae" stroke-width="9"/><line x1="140" y1="108" x2="142" y2="128" stroke="#8d99ae" stroke-width="9"/></svg>',
    rabbit: '<svg width="160" height="130" viewBox="0 0 160 130"><ellipse cx="50" cy="30" rx="10" ry="30" fill="#d9d9d9" transform="rotate(-12 50 30)"/><ellipse cx="78" cy="28" rx="10" ry="30" fill="#d9d9d9" transform="rotate(10 78 28)"/><ellipse cx="85" cy="85" rx="42" ry="26" fill="#e8e8e8"/><circle cx="122" cy="68" r="20" fill="#e8e8e8"/><circle cx="128" cy="66" r="3" fill="#222"/><line x1="60" y1="110" x2="58" y2="126" stroke="#d9d9d9" stroke-width="5"/><line x1="108" y1="110" x2="110" y2="126" stroke="#d9d9d9" stroke-width="5"/></svg>',
    cat: '<svg width="180" height="110" viewBox="0 0 180 110"><ellipse cx="85" cy="75" rx="48" ry="24" fill="#e8a33d"/><circle cx="130" cy="55" r="22" fill="#e8a33d"/><polygon points="114,40 118,20 130,34" fill="#e8a33d"/><polygon points="136,34 148,20 150,40" fill="#e8a33d"/><line x1="124" y1="54" x2="132" y2="54" stroke="#222" stroke-width="3"/><line x1="138" y1="54" x2="146" y2="54" stroke="#222" stroke-width="3"/><path d="M40 70 Q20 60 28 45" stroke="#e8a33d" stroke-width="6" fill="none"/></svg>',
    dog: '<svg width="180" height="115" viewBox="0 0 180 115"><ellipse cx="80" cy="72" rx="44" ry="26" fill="#a66a33"/><circle cx="128" cy="50" r="22" fill="#a66a33"/><ellipse cx="112" cy="42" rx="9" ry="16" fill="#7a4a21"/><circle cx="134" cy="48" r="3" fill="#222"/><ellipse cx="140" cy="60" rx="6" ry="4" fill="#222"/><path d="M38 66 Q18 58 24 42" stroke="#a66a33" stroke-width="6" fill="none"/><line x1="55" y1="96" x2="52" y2="112" stroke="#a66a33" stroke-width="5"/><line x1="105" y1="96" x2="108" y2="112" stroke="#a66a33" stroke-width="5"/></svg>',
    peacock: '<svg width="200" height="140" viewBox="0 0 200 140"><g><ellipse cx="100" cy="55" rx="14" ry="40" fill="#2e86c1" transform="rotate(-28 100 90)"/><ellipse cx="100" cy="55" rx="14" ry="44" fill="#27ae60" transform="rotate(-14 100 90)"/><ellipse cx="100" cy="55" rx="14" ry="46" fill="#2e86c1"/><ellipse cx="100" cy="55" rx="14" ry="44" fill="#27ae60" transform="rotate(14 100 90)"/><ellipse cx="100" cy="55" rx="14" ry="40" fill="#2e86c1" transform="rotate(28 100 90)"/></g><ellipse cx="100" cy="105" rx="26" ry="20" fill="#1f6fb2"/><circle cx="100" cy="82" r="13" fill="#1f6fb2"/><circle cx="104" cy="80" r="2" fill="#fff"/><path d="M100 70 L100 62 M96 71 L92 64 M104 71 L108 64" stroke="#1f6fb2" stroke-width="2"/></svg>',
    snake: '<svg width="220" height="90" viewBox="0 0 220 90"><path d="M10 55 Q40 20 70 55 T130 55 T190 55" stroke="#27ae60" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="196" cy="52" r="14" fill="#27ae60"/><circle cx="200" cy="49" r="3" fill="#222"/><path d="M208 52 L218 48 M208 52 L218 56" stroke="#e23b2e" stroke-width="3"/></svg>',
    cow: '<svg width="200" height="120" viewBox="0 0 200 120"><ellipse cx="95" cy="72" rx="55" ry="30" fill="#fdfdfd" stroke="#ddd"/><ellipse cx="75" cy="66" rx="12" ry="8" fill="#222"/><ellipse cx="110" cy="80" rx="10" ry="7" fill="#222"/><circle cx="158" cy="50" r="22" fill="#fdfdfd" stroke="#ddd"/><path d="M142 34 L134 22 M174 34 L182 22" stroke="#e8dcc0" stroke-width="5"/><ellipse cx="140" cy="48" rx="8" ry="12" fill="#fdfdfd" stroke="#ddd"/><ellipse cx="176" cy="48" rx="8" ry="12" fill="#fdfdfd" stroke="#ddd"/><circle cx="154" cy="48" r="3" fill="#222"/><circle cx="166" cy="48" r="3" fill="#222"/><ellipse cx="160" cy="60" rx="8" ry="5" fill="#f4c6c6"/><line x1="60" y1="100" x2="58" y2="118" stroke="#eee" stroke-width="6"/><line x1="130" y1="100" x2="132" y2="118" stroke="#eee" stroke-width="6"/></svg>'
  };
  return S[kind] || '';
}
function showAnimal(kind, spot, keep) {
  if (!keep) animalSlot.innerHTML = '';
  var w = document.createElement('div');
  w.style.cssText = 'position:absolute;bottom:6px;left:50%;margin-left:-95px;width:190px;text-align:center;';
  w.innerHTML = svgAnimal(kind);
  animalSlot.appendChild(w);
  if (spot === 'left') { w.style.marginLeft = '-300px'; }
  if (spot === 'right') { w.style.marginLeft = '110px'; }
  return w;
}
async function animal(kind) {
  if (kind === 'mouse' || kind === 'dog' || kind === 'elephant' || kind === 'cow') {
    var w = showAnimal(kind);
    var fast = (kind === 'mouse' || kind === 'dog') ? 2400 : 4200;
    var a = A(w, [{ transform: 'translateX(-330px)' }, { transform: 'translateX(330px)' }], fast, 'linear');
    if (kind !== 'mouse' && kind !== 'dog') {
      var bob = A(w, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0px)' }], 500);
      await fin(bob);
    }
    await fin(a);
  } else if (kind === 'lion') {
    var l = showAnimal('lion');
    showBurst('ROAR!', '55%', '30%', 1200);
    var s = A(l, [{ transform: 'translateX(-4px) scale(1)' }, { transform: 'translateX(4px) scale(1.06)' }, { transform: 'translateX(-4px) scale(1)' }, { transform: 'translateX(0px) scale(1)' }], 1200);
    await fin(s);
    await wait(200);
    hideBurst();
  } else if (kind === 'monkey') {
    var m = showAnimal('monkey');
    for (var i = 0; i < 4; i++) {
      var j = A(m, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-70px)' }, { transform: 'translateY(0px)' }], 650);
      await fin(j);
    }
  } else if (kind === 'rabbit') {
    var r = showAnimal('rabbit');
    var hop = A(r, [{ transform: 'translateX(-300px) translateY(0px)' }, { transform: 'translateX(-150px) translateY(-65px)' }, { transform: 'translateX(0px) translateY(0px)' }, { transform: 'translateX(150px) translateY(-65px)' }, { transform: 'translateX(300px) translateY(0px)' }], 2600, 'linear');
    await fin(hop);
  } else if (kind === 'cat') {
    var c = showAnimal('cat');
    showCaption('The cat is sleeping. Shh...');
    var br = A(c, [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], 1600);
    for (var k = 0; k < 3; k++) {
      var z = document.createElement('div');
      z.textContent = 'Z';
      z.style.cssText = 'position:absolute;left:62%;bottom:150px;font-size:26px;font-weight:bold;color:#33475b;';
      propSlot.appendChild(z);
      var up = A(z, [{ transform: 'translateY(0px)', opacity: 1 }, { transform: 'translateY(-60px)', opacity: 0 }], 1400);
      await fin(up);
      z.remove();
    }
    await fin(br);
    captionEl.textContent = '';
  } else if (kind === 'peacock') {
    var p = showAnimal('peacock');
    showCaption('The peacock dances!');
    var d = A(p, [{ transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(0deg)' }], 2000);
    await fin(d);
    captionEl.textContent = '';
  } else if (kind === 'snake') {
    var s2 = showAnimal('snake');
    var sl = A(s2, [{ transform: 'translateX(-320px) rotate(-6deg)' }, { transform: 'translateX(-160px) rotate(6deg)' }, { transform: 'translateX(0px) rotate(-6deg)' }, { transform: 'translateX(160px) rotate(6deg)' }, { transform: 'translateX(320px) rotate(-6deg)' }], 3000, 'linear');
    await fin(sl);
  }
}

/* ---------------- Story scenes ---------------- */
function svgPerson(kind) {
  if (kind === 'girl') return '<svg width="150" height="210" viewBox="0 0 150 210"><circle cx="75" cy="40" r="24" fill="#f0c8a0"/><path d="M50 28 Q75 0 100 28 L100 48 Q75 30 50 48" fill="#222"/><polygon points="45,200 105,200 88,85 62,85" fill="#e86aa0"/><line x1="62" y1="110" x2="40" y2="150" stroke="#f0c8a0" stroke-width="7"/><line x1="88" y1="110" x2="110" y2="150" stroke="#f0c8a0" stroke-width="7"/><circle cx="68" cy="38" r="3" fill="#222"/><circle cx="82" cy="38" r="3" fill="#222"/></svg>';
  if (kind === 'woman') return '<svg width="160" height="220" viewBox="0 0 160 220"><circle cx="80" cy="42" r="25" fill="#f0c8a0"/><circle cx="80" cy="22" r="18" fill="#3a2a1a"/><polygon points="48,210 112,210 94,88 66,88" fill="#7a4a9e"/><line x1="66" y1="115" x2="44" y2="155" stroke="#f0c8a0" stroke-width="7"/><line x1="94" y1="115" x2="116" y2="155" stroke="#f0c8a0" stroke-width="7"/></svg>';
  return '<svg width="100" height="140" viewBox="0 0 100 140"><circle cx="50" cy="28" r="18" fill="#f0c8a0"/><path d="M32 22 Q50 4 68 22" fill="#222"/><rect x="34" y="55" width="32" height="45" rx="6" fill="#2f7ad4"/><line x1="34" y1="70" x2="18" y2="95" stroke="#f0c8a0" stroke-width="6"/><line x1="66" y1="70" x2="82" y2="95" stroke="#f0c8a0" stroke-width="6"/><line x1="42" y1="100" x2="40" y2="130" stroke="#333" stroke-width="6"/><line x1="58" y1="100" x2="60" y2="130" stroke="#333" stroke-width="6"/></svg>';
}
function showPerson(kind, spot) {
  var w = document.createElement('div');
  w.className = 'story-extra';
  w.style.cssText = 'position:absolute;bottom:30px;z-index:3;';
  w.style.left = spot === 'left' ? '22%' : spot === 'right' ? '64%' : '50%';
  w.innerHTML = svgPerson(kind);
  stage.appendChild(w);
  return w;
}
async function sayLines(lines) {
  var g = gen;
  for (var i = 0; i < lines.length; i++) {
    if (g !== gen) break;
    showCaption(lines[i]);
    await wait(2100);
  }
}
async function storyBoyMeetsGirl() {
  setBackdrop('city');
  var girl = showPerson('girl', 'right');
  await sayLines(['Rahul walks to the park.', 'He meets Priya. They wave and smile!']);
  await wave();
  await expr('head_smile.png', 1400);
  girl.remove();
}
async function storyMotherChild() {
  setBackdrop('village');
  var mom = showPerson('woman', 'left');
  var kid = showPerson('child', 'right');
  await sayLines(['Mother and child walk home together.', 'The child jumps with joy!']);
  for (var i = 0; i < 3; i++) {
    var j = A(kid, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-35px)' }, { transform: 'translateY(0px)' }], 550);
    await fin(j);
  }
  mom.remove(); kid.remove();
}
async function storyVillageLife() {
  setBackdrop('village');
  await sayLines(['Morning in the village.', 'Everyone greets each other and gets to work.']);
  await walkInPlace(2400);
}
async function storySchoolLife() {
  setBackdrop('school');
  await sayLines(['It is school time.', 'The children read, learn and play.']);
  await read();
}
async function storyJungleAdventure() {
  setBackdrop('jungle');
  await sayLines(['Deep in the jungle...', 'A monkey jumps by to say hello!']);
  var mk = showAnimal('monkey');
  for (var i = 0; i < 3; i++) {
    var j = A(mk, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-60px)' }, { transform: 'translateY(0px)' }], 600);
    await fin(j);
  }
  await walkInPlace(2000);
}
async function storyHauntedHouse() {
  setBackdrop('haunted');
  await sayLines(['The old house creaks...', 'Something moves in the dark!']);
  var sh = A(P.char, [{ transform: 'translateX(0px)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0px)' }], 400);
  await fin(sh);
  await sayLines(['It was only the wind. Phew!']);
}
async function storyTreasureHunt() {
  setBackdrop('beach');
  var chest = showProp('chest', '60%', '40px', 130);
  await sayLines(['A map! An island! A treasure chest!', 'We found the gold!']);
  await jumps();
  chest.remove();
}
async function storySuperhero() {
  setBackdrop('city');
  var cape = document.createElement('div');
  cape.className = 'story-extra';
  cape.style.cssText = 'position:absolute;left:50%;margin-left:-100px;bottom:60px;width:200px;height:320px;background:#d21f2c;border-radius:50% 50% 12% 12%;z-index:2;';
  stage.appendChild(cape);
  await sayLines(['Help! Someone needs saving!', 'The hero flies in!']);
  showBurst('RESCUE!', '58%', '30%', 1300);
  await jumps();
  cape.remove();
}
async function storyAnimalFriend() {
  setBackdrop('village');
  var d = showAnimal('dog', 'left', true);
  var c = showAnimal('cat', 'right', true);
  await sayLines(['The dog and the cat were never friends...', 'Until today. Now they play together!']);
  var w1 = A(d, [{ transform: 'translateX(0px)' }, { transform: 'translateX(40px)' }, { transform: 'translateX(0px)' }], 900);
  var w2 = A(c, [{ transform: 'translateX(0px)' }, { transform: 'translateX(-40px)' }, { transform: 'translateX(0px)' }], 900);
  await Promise.all([fin(w1), fin(w2)]);
}
async function storyKingdom() {
  setBackdrop('palace');
  var crown = document.createElement('div');
  crown.className = 'story-extra';
  crown.innerHTML = propSVG('crown', 70);
  crown.style.cssText = 'position:absolute;left:50%;margin-left:-35px;top:8px;z-index:8;';
  stage.appendChild(crown);
  await sayLines(['In a faraway kingdom...', 'The king waves to his happy people!']);
  await wave();
  crown.remove();
}

/* ---------------- Uploaded picture ---------------- */
var uploadImg = null;
function setupUpload(file) {
  var rd = new FileReader();
  rd.onload = function () {
    var tmp = new Image();
    tmp.onload = function () {
      var src = rd.result;
      if (tmp.width > 900 || tmp.height > 900) {
        var sc = Math.min(900 / tmp.width, 900 / tmp.height);
        var cv = document.createElement('canvas');
        cv.width = Math.round(tmp.width * sc);
        cv.height = Math.round(tmp.height * sc);
        cv.getContext('2d').drawImage(tmp, 0, 0, cv.width, cv.height);
        src = cv.toDataURL('image/jpeg', 0.85);
      }
      var slot = document.getElementById('uploadSlot');
      if (!slot) {
        slot = document.createElement('div');
        slot.id = 'uploadSlot';
        stage.appendChild(slot);
      }
      slot.innerHTML = '';
      var img = document.createElement('img');
      img.src = src;
      slot.appendChild(img);
      uploadImg = img;
      charSlot.style.display = 'none';
      document.getElementById('removeUploadBtn').classList.remove('hidden');
      showCaption('Your picture is on stage! Try the motion buttons.');
      setTimeout(function () { captionEl.textContent = ''; }, 2600);
    };
    tmp.src = rd.result;
  };
  rd.readAsDataURL(file);
}
function clearUpload() {
  var slot = document.getElementById('uploadSlot');
  if (slot) slot.innerHTML = '';
  uploadImg = null;
  charSlot.style.display = '';
  var rb = document.getElementById('removeUploadBtn');
  if (rb) rb.classList.add('hidden');
}
async function uploadAnim(kind) {
  if (!uploadImg) { showCaption('Upload a picture first!'); await wait(1400); captionEl.textContent = ''; return; }
  var img = uploadImg;
  if (kind === 'bounce') {
    for (var i = 0; i < 3; i++) {
      var a = A(img, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-45px)' }, { transform: 'translateY(0px)' }], 550);
      await fin(a);
    }
  } else if (kind === 'dance') {
    var d = A(img, [{ transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(0deg)' }], 1600);
    await fin(d);
  } else if (kind === 'spin') {
    var s = A(img, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], 1300);
    await fin(s);
  } else if (kind === 'walkAcross') {
    var w = A(img, [{ transform: 'translateX(-300px)' }, { transform: 'translateX(300px)' }], 2600, 'linear');
    await fin(w);
  } else if (kind === 'zoomUp') {
    var z = A(img, [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], 1600);
    await fin(z);
  } else if (kind === 'shake') {
    var sh = A(img, [{ transform: 'translateX(0px)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(12px)' }, { transform: 'translateX(0px)' }], 600);
    await fin(sh);
  } else if (kind === 'talkBob') {
    var line = document.getElementById('talkInput').value || 'Hello friends!';
    showBubble(line, 2600);
    for (var j = 0; j < 4; j++) {
      var b = A(img, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0px)' }], 320);
      await fin(b);
    }
    bubbleEl.classList.add('hidden');
  }
}

/* ---------------- Wiring ---------------- */
var ANIMS = {
  blink: doBlink,
  lipsync: function () { return talkCycle(2600, false); },
  talk: function () { return talkCycle(3600, true); },
  smile: function () { return expr('head_smile.png', 1700); },
  laugh: function () { return expr('head_laugh.png', 1700); },
  cry: function () { return expr('head_cry.png', 1700); },
  angry: function () { return expr('head_angry.png', 1700); },
  surprised: function () { return expr('head_surprised.png', 1700); },
  headTurn: headTurn,
  wave: wave,
  fight: fight,
  punch: punch,
  kick: kick,
  slap: slap,
  chase: chase,
  hide: hide,
  eat: eat,
  drink: drink,
  cook: cook,
  read: read,
  boyMeetsGirl: storyBoyMeetsGirl,
  motherChild: storyMotherChild,
  villageLife: storyVillageLife,
  schoolLife: storySchoolLife,
  jungleAdventure: storyJungleAdventure,
  hauntedHouse: storyHauntedHouse,
  treasureHunt: storyTreasureHunt,
  superhero: storySuperhero,
  animalFriend: storyAnimalFriend,
  kingdom: storyKingdom,
  morph: morph,
  walk: async function () { var g = gen; while (g === gen) { await walkInPlace(1200); } },
  run: runAcross,
  jump: jumps,
  charRotate: charRotate,
  zoomIn: zoomIn,
  zoomOut: zoomOut,
  parallax: parallax,
  slowmo: slowmo,
  transition: transition,
  mouse: function () { return animal('mouse'); },
  lion: function () { return animal('lion'); },
  monkey: function () { return animal('monkey'); },
  elephant: function () { return animal('elephant'); },
  rabbit: function () { return animal('rabbit'); },
  cat: function () { return animal('cat'); },
  dog: function () { return animal('dog'); },
  peacock: function () { return animal('peacock'); },
  snake: function () { return animal('snake'); },
  cow: function () { return animal('cow'); }
};

async function runAnim(key) {
  stopAll();
  busy = true;
  try { await ANIMS[key](); } catch (e) {}
  busy = false;
  stopAll();
  idleBlink();
}
document.querySelectorAll('[data-anim]').forEach(function (b) {
  b.addEventListener('click', function () { runAnim(b.getAttribute('data-anim')); });
});
document.querySelectorAll('[data-up]').forEach(function (b) {
  b.addEventListener('click', function () {
    stopAll();
    busy = true;
    uploadAnim(b.getAttribute('data-up')).then(function () { busy = false; idleBlink(); });
  });
});
document.querySelectorAll('.char-btn').forEach(function (b) {
  b.addEventListener('click', function () { buildChar(b.getAttribute('data-char')); });
});
document.getElementById('talkBtn').addEventListener('click', function () { runAnim('talk'); });
document.getElementById('backdropSel').addEventListener('change', function (e) { setBackdrop(e.target.value); });
document.getElementById('slowBtn').addEventListener('click', function () { toggleSlow(); });
document.getElementById('stopBtn').addEventListener('click', function () { stopAll(); idleBlink(); });
document.getElementById('uploadInput').addEventListener('change', function (e) {
  if (e.target.files && e.target.files[0]) setupUpload(e.target.files[0]);
});
document.getElementById('removeUploadBtn').addEventListener('click', function () { clearUpload(); });

/* ---------------- Init ---------------- */
setBackdrop('sky');
buildChar('police');
