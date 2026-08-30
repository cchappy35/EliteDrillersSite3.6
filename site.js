(function () {
  var CHIP_ON = "display:inline-flex; align-items:center; min-height:44px; padding:0 16px; border:1.5px solid var(--signal); background:var(--signal); font-family:'Spline Sans Mono',monospace; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#fff; cursor:pointer; transition:.12s;";
  var CHIP_OFF = "display:inline-flex; align-items:center; min-height:44px; padding:0 16px; border:1.5px solid var(--line); background:var(--paper); font-family:'Spline Sans Mono',monospace; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink2); cursor:pointer; transition:.12s;";
  function setBurger(open) {
    var b = document.querySelector('[data-burger]');
    if (!b) return;
    b.setAttribute('aria-expanded', String(open));
    var o = b.querySelector('[data-icon-open]'), c = b.querySelector('[data-icon-close]');
    if (o) o.style.display = open ? 'none' : 'flex';
    if (c) c.style.display = open ? 'block' : 'none';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-menu-toggle]');
    if (t) {
      var d = document.querySelector('[data-mobile-drawer]');
      if (!d) return;
      var open = d.style.display === 'block';
      d.style.display = open ? 'none' : 'block';
      setBurger(!open);
      return;
    }
    var ch = e.target.closest && e.target.closest('[data-chip-group]');
    if (ch) {
      var g = ch.getAttribute('data-chip-group');
      var form = ch.closest('form');
      if (!form) return;
      var inp = form.querySelector('input[name="' + g + '"]');
      if (inp) inp.value = ch.getAttribute('data-chip-value');
      var all = form.querySelectorAll('[data-chip-group="' + g + '"]');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('style', CHIP_OFF);
      ch.setAttribute('style', CHIP_ON);
    }
  });
  // Both forms POST to a Pages Function and share the same UX: disable the
  // button, show an inline message on failure, redirect on success.
  function wireForm(sel, btnSel, errSel, done) {
    var f = document.querySelector(sel);
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector(btnSel);
      var err = f.querySelector(errSel);
      if (err) err.hidden = true;
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      function fail(msg) {
        if (err) {
          if (msg) err.textContent = msg;
          err.hidden = false;
        }
        if (window.turnstile) { try { window.turnstile.reset(); } catch (x) {} }
        if (btn) { btn.disabled = false; btn.textContent = label; }
      }
      fetch(f.getAttribute('action'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(f)
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false }; }).then(function (d) {
          if (r.ok && d.ok) { window.location.href = done; return; }
          fail(d.message);
        });
      }).catch(function () { fail(); });
    });
  }
  wireForm('[data-quote-form]', '[data-quote-submit]', '[data-quote-error]', '/quote-received.html');
  wireForm('[data-apply-form]', '[data-apply-submit]', '[data-apply-error]', '/thanks.html');
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      var d = document.querySelector('[data-mobile-drawer]');
      if (d && d.style.display === 'block') { d.style.display = 'none'; setBurger(false); }
    }
  });
})();
