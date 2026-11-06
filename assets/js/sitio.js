// EV DecoInteriorismo: página web. Cotas que se trazan, aparición suave, menú y comparador.
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hayVigia = 'IntersectionObserver' in window;

  // 1. Cotas y apariciones: una sola vez, al entrar en pantalla
  const cotas = document.querySelectorAll('.cota');
  const apariciones = document.querySelectorAll('.aparece');
  if (quieto || !hayVigia) {
    cotas.forEach((c) => c.classList.add('trazada'));
    apariciones.forEach((a) => a.classList.add('visto'));
  } else {
    const vigia = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('cota') ? 'trazada' : 'visto');
        vigia.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    // la portada no espera al desplazamiento: entra completa al cargar, escalonada
    const portada = document.querySelector('.portada');
    portada.querySelectorAll('.aparece').forEach((a, i) => {
      a.style.transitionDelay = 120 + i * 110 + 'ms';
      requestAnimationFrame(() => requestAnimationFrame(() => a.classList.add('visto')));
    });
    portada.querySelectorAll('.cota').forEach((c) => setTimeout(() => c.classList.add('trazada'), 450));

    cotas.forEach((c) => { if (!portada.contains(c)) vigia.observe(c); });
    apariciones.forEach((a) => {
      if (portada.contains(a)) return;
      // los hermanos de una misma lista entran escalonados
      const hermanos = a.parentElement ? [...a.parentElement.children].filter((n) => n.classList.contains('aparece')) : [];
      const pos = hermanos.indexOf(a);
      if (pos > 0) a.style.transitionDelay = Math.min(pos, 5) * 90 + 'ms';
      vigia.observe(a);
    });
  }

  // 2. Menú: fondo al bajar, se esconde al seguir bajando y vuelve al subir
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
    const abierto = abrir.getAttribute('aria-expanded') === 'true';
    if (abierto) { cerrar(); return; }
    abrir.setAttribute('aria-expanded', 'true');
    abrir.textContent = 'Cerrar';
    movil.hidden = false;
    menu.classList.add('fijo');
    menu.classList.remove('oculto');
    document.body.style.overflow = 'hidden';
  });
  movil.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrar));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !movil.hidden) { cerrar(); abrir.focus(); } });

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
})();
