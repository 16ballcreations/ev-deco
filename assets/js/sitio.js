// EV DecoInteriorismo: página web. Cotas, apariciones, menú, comparador, proceso por pasos y servicios.
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hayVigia = 'IntersectionObserver' in window;

  // 1. Cotas y apariciones: una sola vez, al entrar en pantalla. La portada entra al cargar.
  const cotas = document.querySelectorAll('.cota');
  const apariciones = document.querySelectorAll('.aparece');
  const portada = document.querySelector('.portada, .cabecera') || document.createElement('div');
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

  // 6. Contacto: el formulario arma el mensaje y lo abre en WhatsApp (no se envía a ningún servidor)
  const formulario = document.querySelector('[data-formulario]');
  if (formulario) {
    const error = formulario.querySelector('.formulario-error');
    formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!formulario.checkValidity()) { error.hidden = false; formulario.querySelector(':invalid').focus(); return; }
      error.hidden = true;
      const d = new FormData(formulario);
      const texto = `Hola, soy ${d.get('nombre')}. Quiero cotizar: ${d.get('servicio')}. Zona: ${d.get('zona')}.

${d.get('mensaje')}`;
      window.open('https://wa.me/573204980360?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });
  }

  // 7. Tema claro / oscuro: se guarda en este navegador
  const botonTema = document.querySelector('[data-tema-boton]');
  const colorBarra = document.querySelector('meta[name="theme-color"]');
  const pintarTema = () => {
    const claro = document.documentElement.dataset.tema === 'claro';
    if (botonTema) {
      botonTema.setAttribute('aria-label', claro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
      botonTema.setAttribute('aria-pressed', String(claro));
    }
    if (colorBarra) colorBarra.content = claro ? '#EEE7DF' : '#111317';
  };
  if (botonTema) {
    botonTema.addEventListener('click', () => {
      const claro = document.documentElement.dataset.tema !== 'claro';
      if (claro) document.documentElement.dataset.tema = 'claro'; else delete document.documentElement.dataset.tema;
      try { localStorage.setItem('ev-tema', claro ? 'claro' : 'oscuro'); } catch (e) {}
      pintarTema();
    });
  }
  pintarTema();
})();
