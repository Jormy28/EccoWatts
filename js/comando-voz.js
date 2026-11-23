const btnVoz = document.querySelector('#btn-voz');
const textoBtnVoz = document.querySelector('#texto-btn-voz');
const btnAyudaVoz = document.querySelector('#btn-ayuda-voz');
const listaComandosVoz = document.querySelector('#lista-comandos-voz');
const estadoVoz = document.querySelector('#estado-voz');

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition || null;

let reconocimiento = null;
let escuchando = false;

function actualizarEstado(mensaje) {
  if (estadoVoz) {
    estadoVoz.textContent = mensaje;
  }
}

function irASeccion(selector) {
  const destino = document.querySelector(selector);
  if (!destino) return false;

  if (window.EccoWattsUI) {
    window.EccoWattsUI.cambiarMenu(false);
  }

  destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
  destino.setAttribute('tabindex', '-1');
  destino.focus({ preventScroll: true });
  actualizarEstado(`Navegando a ${selector.replace('#', '')}`);
  return true;
}

function seleccionarPlan(idRadio, nombrePlan) {
  const radio = document.querySelector(`#${idRadio}`);
  if (!radio) return;

  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
  irASeccion('#orientador');
  actualizarEstado(`Plan seleccionado: ${nombrePlan}`);
}

function procesarComando(textoOriginal) {
  const comando = textoOriginal
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!comando) return;
  actualizarEstado(`Escuché: "${textoOriginal}"`);

  // Planes en #orientador
  if (comando.includes('plan base')) {
    return seleccionarPlan('mochila', 'Plan Base');
  }
  if (comando.includes('plan plus')) {
    return seleccionarPlan('libreta', 'Plan Plus');
  }
  if (comando.includes('plan max')) {
    return seleccionarPlan('abrigo', 'Plan Max');
  }
  if (comando.includes('quiero adquirir') || comando.includes('adquirir plan')) {
    return irASeccion('#contacto');
  }

  // Navegación por secciones
  if (comando.includes('inicio')) return irASeccion('#inicio');
  if (comando.includes('nosotros') || comando.includes('ods')) return irASeccion('#nosotros');
  if (comando.includes('servicio') || comando.includes('ahorro')) return irASeccion('#servicios');
  if (comando.includes('plan') || comando.includes('orientador') || comando.includes('objeto')) {
    return irASeccion('#orientador');
  }
  if (comando.includes('proyecto')) return irASeccion('#proyectos');
  if (comando.includes('galeria') || comando.includes('foto') || comando.includes('historia')) {
    return irASeccion('#galeria');
  }
  if (comando.includes('testimonio')) return irASeccion('#testimonios');
  if (comando.includes('contacto') || comando.includes('formulario') || comando.includes('devolucion')) {
    return irASeccion('#contacto');
  }
  if (comando.includes('guia') || comando.includes('video') || comando.includes('recurso')) {
    actualizarEstado('Abriendo guía y video…');
    window.location.href = 'recursos.html';
    return;
  }

  // Menú y scroll
  if (comando.includes('abrir menu') || comando.includes('mostrar menu')) {
    window.EccoWattsUI?.cambiarMenu(true);
    actualizarEstado('Menú abierto');
    return;
  }
  if (comando.includes('cerrar menu') || comando.includes('ocultar menu')) {
    window.EccoWattsUI?.cambiarMenu(false);
    actualizarEstado('Menú cerrado');
    return;
  }
  if (comando.includes('bajar') || comando.includes('abajo')) {
    window.scrollBy({ top: Math.round(window.innerHeight * 0.7), behavior: 'smooth' });
    actualizarEstado('Bajando');
    return;
  }
  if (comando.includes('subir') || comando.includes('arriba')) {
    window.scrollBy({ top: -Math.round(window.innerHeight * 0.7), behavior: 'smooth' });
    actualizarEstado('Subiendo');
    return;
  }
  if (comando.includes('detener') || comando.includes('apagar') || comando.includes('silencio')) {
    detenerVoz();
    return;
  }

  actualizarEstado(`Sin acción para "${textoOriginal}". Di "ir a planes" o "bajar".`);
}

function iniciarVoz() {
  if (!SpeechRecognitionAPI) {
    actualizarEstado('Tu navegador no soporta reconocimiento de voz.');
    return;
  }

  reconocimiento = new SpeechRecognitionAPI();
  reconocimiento.lang = 'es-PE';
  reconocimiento.continuous = true;
  reconocimiento.interimResults = false;

  reconocimiento.onstart = () => {
    escuchando = true;
    btnVoz?.setAttribute('aria-pressed', 'true');
    if (textoBtnVoz) textoBtnVoz.textContent = 'Escuchando…';
    actualizarEstado('Micrófono encendido. Habla ahora.');
  };

  reconocimiento.onresult = (event) => {
    const ultimoResultado = event.results[event.results.length - 1];
    if (ultimoResultado && ultimoResultado[0]) {
      procesarComando(ultimoResultado[0].transcript);
    }
  };

  reconocimiento.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      actualizarEstado('Permiso de micrófono denegado.');
      detenerVoz();
    } else if (event.error !== 'no-speech') {
      actualizarEstado(`Error de voz: ${event.error}`);
    }
  };

  reconocimiento.onend = () => {
    if (escuchando) {
      try {
        reconocimiento.start();
      } catch {
        detenerVoz();
      }
    }
  };

  try {
    reconocimiento.start();
  } catch {
    actualizarEstado('No se pudo iniciar el micrófono (usa localhost o HTTPS).');
  }
}

function detenerVoz() {
  escuchando = false;
  btnVoz?.setAttribute('aria-pressed', 'false');
  if (textoBtnVoz) textoBtnVoz.textContent = 'Activar voz';

  if (reconocimiento) {
    try {
      reconocimiento.stop();
    } catch {}
    reconocimiento = null;
  }

  actualizarEstado('Voz desactivada.');
}

btnVoz?.addEventListener('click', () => {
  if (escuchando) detenerVoz();
  else iniciarVoz();
});

btnAyudaVoz?.addEventListener('click', () => {
  if (!listaComandosVoz) return;
  const estaOculta = listaComandosVoz.hidden;
  listaComandosVoz.hidden = !estaOculta;
  btnAyudaVoz.setAttribute('aria-expanded', String(estaOculta));
});