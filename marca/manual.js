// Manual de marca (andamiaje 16 Ball, sale de Cardona): índice activo, recurso gráfico
// que se activa al entrar en pantalla, botón de repetir y comparador antes / después.
// Cambia RECURSO por la clase del recurso gráfico de la marca (en Cardona, '.luz'; en SAIR, '.px').
(() => {
  const RECURSO = '.cota';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Cotas: se trazan al entrar en pantalla
  const luces = document.querySelectorAll(RECURSO);
  if (quieto || !('IntersectionObserver' in window)) {
    luces.forEach((l) => l.classList.add('trazada'));
  } else {
    const vigia = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('trazada'); vigia.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    luces.forEach((l) => vigia.observe(l));
  }

  // 2. Índice: marca la sección que se está leyendo
  const enlaces = new Map();
  document.querySelectorAll('.indice-enlace').forEach((a) => enlaces.set(a.hash.slice(1), a));
  if ('IntersectionObserver' in window) {
    const visibles = new Map();
    const lector = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => visibles.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let mejor = null; let max = 0;
      document.querySelectorAll('main > section[id]').forEach((s) => {
        const v = visibles.get(s.id) || 0;
        if (v > max) { max = v; mejor = s.id; }
      });
      if (!mejor) return;
      enlaces.forEach((a, id) => {
        const activo = id === mejor;
        a.classList.toggle('activo', activo);
        if (activo) {
          a.setAttribute('aria-current', 'true');
          // en móvil el índice es una fila: lleva el enlace activo a la vista. Sin animación propia:
          // un desplazamiento suave aquí interrumpe en Chrome el desplazamiento suave de la página.
          const fila = a.closest('nav');
          if (fila && fila.scrollWidth > fila.clientWidth) fila.scrollLeft = a.offsetLeft - 24;
        } else {
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.5, 1] });
    document.querySelectorAll('main > section[id]').forEach((s) => lector.observe(s));
  }

  // 2b. Enlaces internos (índice, portada, «ver sección»): el desplazamiento lo hace el script,
  // descuenta la fila del índice en móvil y, si el navegador no llega, salta al final.
  const alto = () => {
    const indice = document.querySelector('.indice');
    return indice && indice.getBoundingClientRect().width >= innerWidth - 1 ? indice.offsetHeight + 8 : 0;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const destino = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!destino) return;
    e.preventDefault();
    const top = () => Math.max(0, destino.getBoundingClientRect().top + scrollY - alto());
    history.pushState(null, '', a.hash);
    scrollTo({ top: top(), behavior: quieto ? 'instant' : 'smooth' });
    setTimeout(() => { if (Math.abs(destino.getBoundingClientRect().top - alto()) > 4) scrollTo({ top: top(), behavior: 'instant' }); }, 1400);
  });

  // 3. Repetir el encendido en las demostraciones
  document.querySelectorAll('[data-reencender]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const zona = document.getElementById(boton.dataset.reencender);
      if (!zona) return;
      zona.querySelectorAll(RECURSO).forEach((l) => {
        l.classList.remove('trazada');
        void l.offsetWidth;
        requestAnimationFrame(() => l.classList.add('trazada'));
      });
    });
  });

  // 4. Comparador antes / después
  document.querySelectorAll('[data-comparar]').forEach((marco) => {
    const control = marco.querySelector('input[type="range"]');
    if (!control) return;
    const mover = () => marco.style.setProperty('--corte', control.value + '%');
    control.addEventListener('input', mover);
    mover();
  });
})();
