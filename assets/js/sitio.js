// EV DecoInteriorismo: página web. Cotas, apariciones, menú, comparador, proceso por pasos y servicios.
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hayVigia = 'IntersectionObserver' in window;

  // 1. Cotas y apariciones: una sola vez, al entrar en pantalla. La portada entra al cargar.
  const cotas = document.querySelectorAll('.cota');
  const apariciones = document.querySelectorAll('.aparece');
  const portada = document.querySelector('.portada');
  if (quieto || !hayVigia) {
    cotas.forEach((c) => c.classList.add('trazada'));
    apariciones.forEach((a) => a.classList.add('visto'));
  } else {
    portada.querySelectorAll('.aparece').forEach((a, i) => {
      a.style.transitionDelay = 120 + i * 140 + 'ms';
      requestAnimationFrame(() => requestAnimationFrame(() => a.classList.add('visto')));
    });
    portada.querySelectorAll('.cota').forEach((c) => setTimeout(() => c.classList.add('trazada'), 500));

    const vigia = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('cota') ? 'trazada' : 'visto');
        vigia.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    cotas.forEach((c) => { if (!portada.contains(c)) vigia.observe(c); });
    apariciones.forEach((a) => {
      if (portada.contains(a)) return;
      const hermanos = [...a.parentElement.children].filter((n) => n.classList.contains('aparece'));
      const pos = hermanos.indexOf(a);
      if (pos > 0) a.style.transitionDelay = Math.min(pos, 5) * 90 + 'ms';
      vigia.observe(a);
    });
  }

  // 2. Menú: fondo al bajar, se esconde al seguir bajando y vuelve al subir; enlace activo
  const menu = document.querySelector('[data-menu]');
  const abrir = document.querySelector('.menu-abrir');
  const movil = document.getElementById('menu-movil');
  let ultimo = 0;
  const alDesplazar = () => {
    const y = window.scrollY;
    menu.classList.toggle('fijo', y > 40);
    const abierto = abrir.getAttribute('aria-expanded') === 'true';
    menu.classList.toggle('oculto', !abierto && y > 480 && y > ultimo);
    ultimo = y;
  };
  addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();

  const cerrar = () => {
    abrir.setAttribute('aria-expanded', 'false');
    abrir.textContent = 'Menú';
    movil.hidden = true;
    document.body.style.overflow = '';
  };
  abrir.addEventListener('click', () => {
    if (abrir.getAttribute('aria-expanded') === 'true') { cerrar(); return; }
    abrir.setAttribute('aria-expanded', 'true');
    abrir.textContent = 'Cerrar';
    movil.hidden = false;
    menu.classList.add('fijo');
    menu.classList.remove('oculto');
    document.body.style.overflow = 'hidden';
  });
  movil.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrar));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !movil.hidden) { cerrar(); abrir.focus(); } });

  if (hayVigia) {
    const enlaces = [...document.querySelectorAll('.menu-enlaces a')];
    const zonas = enlaces.map((a) => document.querySelector(a.hash)).filter(Boolean);
    const lector = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        enlaces.forEach((a) => {
          const activo = a.hash === '#' + e.target.id;
          a.classList.toggle('activo', activo);
          if (activo) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    zonas.forEach((z) => lector.observe(z));
  }

  // 3. Comparador: al entrar en pantalla, el corte barre del antes al después una vez
  document.querySelectorAll('[data-comparar]').forEach((marco) => {
    const control = marco.querySelector('input[type="range"]');
    if (!control) return;
    const poner = (v) => { control.value = v; marco.style.setProperty('--corte', v + '%'); };
    let tocado = false;
    control.addEventListener('input', () => { tocado = true; poner(control.value); });
    poner(control.value);
    if (quieto || !hayVigia) return;
    const barrer = () => {
      const tramos = [[50, 92, 900], [92, 8, 1400], [8, 50, 900]];
      const curva = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      let i = 0; let inicio = null;
      const paso = (ahora) => {
        if (tocado) return;
        if (inicio === null) inicio = ahora;
        const [de, a, dura] = tramos[i];
        const t = Math.min((ahora - inicio) / dura, 1);
        poner(Math.round((de + (a - de) * curva(t)) * 10) / 10);
        if (t < 1) { requestAnimationFrame(paso); return; }
        i += 1; inicio = null;
        if (i < tramos.length) setTimeout(() => requestAnimationFrame(paso), 250);
      };
      requestAnimationFrame(paso);
    };
    const vigia = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) { vigia.disconnect(); setTimeout(barrer, 500); }
    }, { threshold: 0.6 });
    vigia.observe(marco);
  });

  // 4. Proceso: la escena queda fija y cada tercio del recorrido muestra un paso
  const pista = document.querySelector('[data-proceso]');
  if (pista) {
    const pasos = [...pista.querySelectorAll('.paso')];
    const ancho = matchMedia('(min-width: 901px)');
    const mostrar = () => {
      if (!ancho.matches) return;
      const caja = pista.getBoundingClientRect();
      const recorrido = caja.height - innerHeight;
      const avance = Math.min(Math.max(-caja.top / recorrido, 0), 0.999);
      const actual = Math.floor(avance * pasos.length);
      pasos.forEach((p, i) => p.classList.toggle('activo', i === actual));
    };
    addEventListener('scroll', mostrar, { passive: true });
    addEventListener('resize', mostrar);
    mostrar();
  }

  // 5. Servicios: las flechas cambian la tarjeta y la imagen a la vez
  const servicios = document.querySelector('[data-servicios]');
  if (servicios) {
    const tarjetas = [...servicios.querySelectorAll('.servicio')];
    const fotos = [...servicios.querySelectorAll('.servicios-imagen figure')];
    let actual = 0;
    const ir = (n) => {
      actual = (n + tarjetas.length) % tarjetas.length;
      tarjetas.forEach((t, i) => { t.classList.toggle('activo', i === actual); t.setAttribute('aria-hidden', String(i !== actual)); });
      fotos.forEach((f, i) => f.classList.toggle('activo', i === actual));
    };
    servicios.querySelectorAll('[data-paso]').forEach((b) => b.addEventListener('click', () => ir(actual + Number(b.dataset.paso))));
    ir(0);
  }
})();
