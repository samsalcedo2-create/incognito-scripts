(function () {
  // ─── CONFIG ───────────────────────────────────────────────────────────────
  var DELAY_MS   = 10000;
  var WEBHOOK    = 'https://grazia-n8n.eijgnl.easypanel.host/webhook/incognito_popup';
  var BANNER_URL = 'https://samsalcedo2-create.github.io/incognito-scripts/banner-popup.png';
  // ──────────────────────────────────────────────────────────────────────────

  // Inyectar estilos
  var style = document.createElement('style');
  style.textContent = `
    #incognito-popup-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.80);
      z-index: 99999;
      justify-content: center;
      align-items: center;
    }
    #incognito-popup-overlay.active { display: flex; }
    #incognito-popup-box {
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      overflow: hidden;
      max-width: 420px;
      width: 90%;
      text-align: center;
      position: relative;
      font-family: Arial, sans-serif;
    }
    #incognito-popup-box img.banner { width: 100%; display: block; }
    #incognito-popup-content { padding: 24px 28px 28px; }
    #incognito-popup-box h2 {
      color: #fff;
      font-size: 18px;
      margin: 0 0 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    #incognito-popup-box .subtitle {
      color: #aaa;
      font-size: 13px;
      margin-bottom: 18px;
    }
    #incognito-popup-box input {
      width: 100%;
      padding: 12px 14px;
      margin: 6px 0;
      border: 1px solid #333;
      border-radius: 8px;
      background: #1a1a1a;
      color: #fff;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
    }
    #incognito-popup-box input::placeholder { color: #555; }
    #incognito-popup-box input:focus { border-color: #e63946; }
    #incognito-popup-box button {
      width: 100%;
      padding: 14px;
      margin-top: 12px;
      background: #e63946;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #incognito-popup-box button:hover { background: #c1121f; }
    #incognito-popup-close {
      position: absolute;
      top: 10px; right: 14px;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      text-shadow: 0 0 4px rgba(0,0,0,0.8);
      z-index: 10;
    }
    #incognito-popup-close:hover { color: #e63946; }
    #incognito-popup-success {
      display: none;
      color: #fff;
      padding: 32px 28px;
    }
    #incognito-popup-success h3 { font-size: 20px; margin-bottom: 8px; }
    #incognito-popup-success p { color: #aaa; font-size: 14px; }
    #incognito-popup-error {
      color: #e63946;
      font-size: 13px;
      margin-top: 8px;
      display: none;
    }
  `;
  document.head.appendChild(style);

  // Inyectar HTML
  var html = `
    <div id="incognito-popup-overlay">
      <div id="incognito-popup-box">
        <span id="incognito-popup-close">&times;</span>
        <img class="banner" src="${BANNER_URL}" alt="Cupón 10% OFF Incognito" />
        <div id="incognito-popup-content">
          <div id="incognito-popup-form">
            <h2>Suscribite y llevate tu descuento</h2>
            <p class="subtitle">Recibí novedades, lanzamientos y promociones por WhatsApp 🖤</p>
            <input type="text"  id="popup-nombre"    placeholder="Tu nombre" />
            <input type="tel"   id="popup-telefono"  placeholder="WhatsApp (ej: +5491112345678)" />
            <input type="text"  id="popup-cumple"    placeholder="Cumpleaños (DD/MM)" maxlength="5" />
            <button id="popup-btn-enviar">QUIERO MI DESCUENTO</button>
            <div id="incognito-popup-error"></div>
          </div>
          <div id="incognito-popup-success">
            <h3>¡Gracias! 🎉</h3>
            <p>Te enviamos tu cupón por WhatsApp en instantes.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  function mostrarError(msg) {
    var el = document.getElementById('incognito-popup-error');
    el.textContent = msg;
    el.style.display = 'block';
  }

  function ocultarError() {
    document.getElementById('incognito-popup-error').style.display = 'none';
  }

  function validarCumple(val) {
    // Acepta vacío o formato DD/MM (01-31 / 01-12)
    if (!val) return true;
    return /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/.test(val);
  }

  function validarTelefono(val) {
  return /[\d]{8,}/.test(val);
}

  // ─── AUTO-FORMATEO CUMPLEAÑOS ─────────────────────────────────────────────
  document.getElementById('popup-cumple').addEventListener('input', function (e) {
    var v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
    e.target.value = v;
  });

  // ─── MOSTRAR / OCULTAR ────────────────────────────────────────────────────

  function mostrarPopup() {
    if (localStorage.getItem('incognito_popup_suscripto')) return;
    
    var bloqueadoHasta = localStorage.getItem('incognito_popup_bloqueado_hasta');
    if (bloqueadoHasta && Date.now() < parseInt(bloqueadoHasta)) return;
    
    document.getElementById('incognito-popup-overlay').classList.add('active');
  }

  function cerrarPopup() {
    document.getElementById('incognito-popup-overlay').classList.remove('active');
    
    var veces = parseInt(localStorage.getItem('incognito_popup_cerrado_veces') || '0');
    veces++;
    localStorage.setItem('incognito_popup_cerrado_veces', veces);
    
    if (veces >= 2) {
      var siete_dias = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('incognito_popup_bloqueado_hasta', siete_dias);
    } else {
      setTimeout(mostrarPopup, 300000);
    }
  }

  setTimeout(mostrarPopup, DELAY_MS);

  document.getElementById('incognito-popup-close').addEventListener('click', cerrarPopup);

  // Cerrar al click en overlay (fuera del box)
  document.getElementById('incognito-popup-overlay').addEventListener('click', function (e) {
    if (e.target === this) cerrarPopup();
  });

  // ─── ENVÍO ────────────────────────────────────────────────────────────────

  document.getElementById('popup-btn-enviar').addEventListener('click', function () {
    var nombre   = document.getElementById('popup-nombre').value.trim();
    var telefono = document.getElementById('popup-telefono').value.trim();
    var cumple   = document.getElementById('popup-cumple').value.trim();

    ocultarError();

    if (!nombre) { mostrarError('Por favor ingresá tu nombre.'); return; }
    if (!telefono || !validarTelefono(telefono)) {
      mostrarError('Ingresá un número de WhatsApp válido (ej: +5491112345678).');
      return;
    }
    if (!validarCumple(cumple)) {
      mostrarError('El cumpleaños debe tener el formato DD/MM (ej: 15/06).');
      return;
    }

    var btn = document.getElementById('popup-btn-enviar');
    btn.disabled = true;
    btn.textContent = 'ENVIANDO...';

    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:     nombre,
        telefono:   telefono,
        cumpleanos: cumple || null,
        fuente:     'popup_tiendanube'
      })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      document.getElementById('incognito-popup-form').style.display = 'none';
      document.getElementById('incognito-popup-success').style.display = 'block';
      localStorage.setItem('incognito_popup_suscripto', '1');
      setTimeout(cerrarPopup, 3000);
    })
    .catch(function () {
      btn.disabled = false;
      btn.textContent = 'QUIERO MI DESCUENTO';
      mostrarError('Hubo un error al enviar. Intentá de nuevo.');
    });
  });

})();
