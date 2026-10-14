/* Request form: checks the fields, then opens the visitor's e-mail program with a prepared letter
   to the address in data-mailto (subject and every field in the body). Nothing is sent in the background. */
(function () {
  var forms = document.querySelectorAll('form[data-mailto]');
  Array.prototype.forEach.call(forms, function (f) {
    var d = f.dataset;
    f.setAttribute('novalidate', '');
    f.removeAttribute('onsubmit');
    var status = d.status ? document.querySelector(d.status) : f.querySelector('[data-mail-status]');

    function fields() {
      return Array.prototype.filter.call(f.elements, function (el) {
        return el.name && !el.disabled && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) &&
          !/^(submit|button|reset|hidden|file)$/.test(el.type);
      });
    }
    function labelOf(el) {
      if (el.dataset.label) return el.dataset.label;
      var l = el.closest('label') || (el.id && f.querySelector('label[for="' + el.id + '"]'));
      if (!l) return el.name;
      var s = l.querySelector('span:not([aria-hidden])');
      var t = (s && el.type !== 'checkbox' ? s.textContent : '') || Array.prototype.map.call(l.childNodes, function (n) {
        return n.nodeType === 3 ? n.textContent : (n.tagName === 'SPAN' && !n.hasAttribute('aria-hidden') ? n.textContent : '');
      }).join(' ');
      return t.replace(/\s+/g, ' ').replace(/[\s*:]+$/, '').trim() || el.name;
    }
    function valueOf(el) {
      if (el.type === 'checkbox') return el.checked ? (d.yes || '+') : (d.no || '-');
      if (el.tagName === 'SELECT') return el.value ? el.options[el.selectedIndex].text.trim() : '';
      return el.value.trim();
    }
    function errBox(el) {
      var anchor = el.type === 'checkbox' ? (el.closest('label') || el) : el;
      var box = anchor.nextElementSibling;
      if (box && box.classList.contains('mf-err')) return box;
      box = document.createElement('span');
      box.className = 'mf-err';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'display:block;margin-top:.35rem;font-size:.82rem;font-weight:600;line-height:1.35;' +
        'text-transform:none;letter-spacing:0;color:' + (d.errColor || '#d93025');
      anchor.parentNode.insertBefore(box, anchor.nextSibling);
      return box;
    }
    function check(el) {
      var v = el.type === 'checkbox' ? el.checked : el.value.trim();
      var msg = '';
      if (el.required && !v) msg = el.type === 'checkbox' ? (d.errConsent || d.errRequired) : d.errRequired;
      else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = d.errEmail;
      else if (v && (el.type === 'tel' || /phone|tel/i.test(el.name)) && (String(v).match(/\d/g) || []).length < 7) msg = d.errPhone;
      else if (v && el.minLength > 0 && String(v).length < el.minLength) msg = d.errShort || d.errRequired;
      var box = errBox(el);
      if (msg) { el.setAttribute('aria-invalid', 'true'); box.textContent = msg; box.hidden = false; }
      else { el.removeAttribute('aria-invalid'); box.textContent = ''; box.hidden = true; }
      return !msg;
    }
    fields().forEach(function (el) {
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true') check(el);
      });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var list = fields(), bad = null;
      list.forEach(function (el) { if (!check(el) && !bad) bad = el; });
      if (bad) { if (status) status.textContent = ''; bad.focus(); return; }
      var lines = [], seen = {};
      list.forEach(function (el) {
        if (el.type === 'radio') { if (seen[el.name]) return; seen[el.name] = 1; var c = f.querySelector('input[name="' + el.name + '"]:checked'); lines.push(labelOf(el) + ': ' + (c ? labelOf(c) : '-')); return; }
        lines.push(labelOf(el) + ': ' + (valueOf(el) || '-'));
      });
      var href = 'mailto:' + d.mailto + '?subject=' + encodeURIComponent(d.mailSubject || '') +
        '&body=' + encodeURIComponent(lines.join('\n'));
      if (status) { status.hidden = false; var hp = status.closest('[hidden]'); if (hp) hp.hidden = false; status.textContent = d.mailOk || ''; }
      f.classList.add('is-sent');
      if (status && d.okClass) status.classList.add(d.okClass);
      var a = document.createElement('a');
      a.href = href;
      a.click();
    });
  });
})();
