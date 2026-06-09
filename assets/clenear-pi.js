/* Clenear P&I: Three.js hero, cursor em 3 camadas, scroll fade, carousel */

/* Three.js particle hero */
(function () {
  var canvas = document.getElementById('cl-pi-canvas');
  if (!canvas) return;
  var THREE, scene, camera, renderer, particles, positions, velocities;
  var mouse = { x: 0, y: 0 };
  var PARTICLE_COUNT = 120;
  var active = false, animFrame, initialized = false;

  function init(T) {
    THREE = T; initialized = true;
    scene = new THREE.Scene();
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.z = 80;
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(PARTICLE_COUNT * 3);
    var col = new Float32Array(PARTICLE_COUNT * 3);
    positions = []; velocities = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var x = (Math.random() - 0.5) * 140;
      var y = (Math.random() - 0.5) * 80;
      var z = (Math.random() - 0.5) * 40;
      pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
      positions.push({ x:x, y:y, z:z, ox:x, oy:y });
      velocities.push({ phase: Math.random() * Math.PI * 2 });
      if (Math.random() > 0.35) { col[i*3]=0.114; col[i*3+1]=0.431; col[i*3+2]=0.353; }
      else { col[i*3]=1; col[i*3+1]=1; col[i*3+2]=1; }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({ size:0.55, vertexColors:true, transparent:true, opacity:0.45, sizeAttenuation:true });
    particles = new THREE.Points(geo, mat);
    scene.add(particles);
    window.addEventListener('resize', function() {
      var w=canvas.clientWidth, h=canvas.clientHeight;
      if(!w||!h) return;
      camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
    });
    document.addEventListener('mousemove', function(e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX-r.left)/r.width - 0.5)*140;
      mouse.y = -((e.clientY-r.top)/r.height - 0.5)*80;
    });
    active = true; animate(0);
  }

  function animate(t) {
    if (!active) return;
    animFrame = requestAnimationFrame(animate);
    var pos = particles.geometry.attributes.position.array;
    var REPEL = 150*150;
    for (var i=0; i<PARTICLE_COUNT; i++) {
      var vel=velocities[i], p=positions[i];
      p.x = p.ox + Math.sin(t*0.0004+vel.phase)*2.5;
      p.y = p.oy + Math.cos(t*0.0003+vel.phase)*1.8;
      var dx=p.x-mouse.x*0.8, dy=p.y-mouse.y*0.8, dist2=dx*dx+dy*dy;
      if (dist2<REPEL && dist2>0.01) {
        var force=(1-dist2/REPEL)*0.18, d=Math.sqrt(dist2);
        p.x+=(dx/d)*force; p.y+=(dy/d)*force;
      }
      pos[i*3]=p.x; pos[i*3+1]=p.y; pos[i*3+2]=p.z;
    }
    particles.geometry.attributes.position.needsUpdate=true;
    renderer.render(scene,camera);
  }

  var heroSection = document.getElementById('cl-pi-hero-section');
  if ('IntersectionObserver' in window && heroSection) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { if (!active && initialized) { active=true; animate(performance.now()); } }
        else { active=false; if(animFrame) cancelAnimationFrame(animFrame); }
      });
    }, { threshold:0 }).observe(heroSection);
  }

  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.crossOrigin = 'anonymous';
  s.onload = function() { init(window.THREE); };
  s.onerror = function() { if(canvas) canvas.style.display='none'; };
  document.head.appendChild(s);
})();

/* Cursor em 3 camadas: glow ambiente + spot preciso + anel sonar */
(function () {
  var glow  = document.getElementById('cl-pi-cursor');
  var inner = document.getElementById('cl-pi-cursor-inner');
  var ring  = document.getElementById('cl-pi-orbit-ring');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;

  var tx = -999, ty = -999;
  var cx = -999, cy = -999;   /* glow: inércia alta (lerp 0.06) */
  var fx = -999, fy = -999;   /* inner: inércia média (lerp 0.15) */
  var isVisible = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  document.addEventListener('mousemove', function(e) {
    tx = e.clientX;
    ty = e.clientY;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var inSection = el && el.closest('[data-cursor-section]');
    if (inSection && !isVisible) {
      isVisible = true;
      glow.style.opacity  = '1';
      if (inner) inner.style.opacity = '1';
      if (ring)  ring.style.opacity  = '1';
    } else if (!inSection && isVisible) {
      isVisible = false;
      glow.style.opacity  = '0';
      if (inner) inner.style.opacity = '0';
      if (ring)  ring.style.opacity  = '0';
    }
  });

  (function tick() {
    /* glow: segue lentamente */
    cx = lerp(cx, tx, 0.06);
    cy = lerp(cy, ty, 0.06);
    glow.style.transform = 'translate(' + (cx - 240) + 'px,' + (cy - 240) + 'px)';

    /* inner: segue com velocidade média */
    fx = lerp(fx, tx, 0.15);
    fy = lerp(fy, ty, 0.15);
    if (inner) inner.style.transform = 'translate(' + (fx - 48) + 'px,' + (fy - 48) + 'px)';

    /* ring: acompanha o cursor imediatamente (raio pequeno) */
    if (ring) ring.style.transform = 'translate(' + (tx - 26) + 'px,' + (ty - 26) + 'px)';

    requestAnimationFrame(tick);
  })();
})();

/* Scroll fade-in */
(function () {
  var fades = document.querySelectorAll('#pesquisa-inovacao .cl-pg-fade');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) { if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target);} });
    }, { threshold:0.08 });
    fades.forEach(function(el) { io.observe(el); });
  } else { fades.forEach(function(el){el.classList.add('is-visible');}); }
})();

/* Mobile carousel dots */
(function () {
  var track = document.getElementById('cl-pilares-track');
  var dotsWrap = document.getElementById('cl-pilares-dots');
  if (!track || !dotsWrap) return;
  var items = track.querySelectorAll('.cl-pi-carousel__item');
  if (!items.length) return;
  var dots = [];
  items.forEach(function(item, i) {
    var dot = document.createElement('span');
    dot.addEventListener('click', function() {
      track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    });
    dotsWrap.appendChild(dot);
    dots.push(dot);
  });
  if (dots.length) dots[0].classList.add('is-active');
  track.addEventListener('scroll', function() {
    var w = items[0].getBoundingClientRect().width;
    var idx = Math.max(0, Math.min(Math.round(track.scrollLeft/(w+16)), dots.length-1));
    dots.forEach(function(d,i){d.classList.toggle('is-active', i===idx);});
  }, { passive:true });
})();
