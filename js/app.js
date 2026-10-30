// StudyFlow (front-end version). Data lives in the browser's localStorage.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DB = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};

async function hashPassword(s) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return btoa(unescape(encodeURIComponent(s)));
}

function showErrors(list) {
  const el = $('#errors');
  el.innerHTML = list.map((m) => '<li>' + esc(m) + '</li>').join('');
  el.hidden = !list.length;
}

const page = document.body.dataset.page;
const currentUser = () => DB.get('sf_users').find((u) => String(u.id) === localStorage.getItem('sf_session'));

// ---------- Login / register ----------
function initLogin() {
  if (currentUser()) { location.replace('index.html'); return; }
  const tabs = document.querySelectorAll('.tabs [data-tab]');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute('aria-selected', active);
      $('#form-' + t.dataset.tab).hidden = !active;
    });
    showErrors([]);
  }));

  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, email = f.email.value.trim().toLowerCase();
    const user = DB.get('sf_users').find((u) => u.email === email);
    if (user && user.hash === await hashPassword(f.password.value)) {
      localStorage.setItem('sf_session', user.id);
      location.href = 'index.html';
    } else showErrors(['Email or password is incorrect.']);
  });

  $('#form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, errs = [];
    const name = f.name.value.trim(), email = f.email.value.trim().toLowerCase();
    if (!name || name.length > 100) errs.push('Enter your name (up to 100 characters).');
    if (!EMAIL_RE.test(email)) errs.push('Enter a valid email address.');
    if (f.password.value.length < 8) errs.push('Password must be at least 8 characters.');
    if (f.password.value !== f.confirm.value) errs.push('Passwords do not match.');
    const users = DB.get('sf_users');
    if (!errs.length && users.some((u) => u.email === email)) errs.push('That email is already registered. Log in instead.');
    showErrors(errs);
    if (errs.length) return;
    const user = { id: Date.now(), name, email, hash: await hashPassword(f.password.value) };
    DB.set('sf_users', users.concat(user));
    localStorage.setItem('sf_session', user.id);
    location.href = 'index.html';
  });
}

// ---------- Dashboard ----------
function initDashboard(user) {
  $('#greeting').textContent = 'Hi, ' + user.name;
  const list = $('#task-list'), form = $('#task-form'), cancel = $('#form-cancel');
  const mine = () => DB.get('sf_tasks').filter((t) => t.userId === user.id);
  const update = (fn) => { DB.set('sf_tasks', fn(DB.get('sf_tasks'))); render(); };

  function dueText(t) {
    if (!t.due) return { text: 'No deadline', late: false };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(t.due + 'T00:00:00') - today) / 86400000);
    if (days < 0) return { text: 'Overdue by ' + -days + (days === -1 ? ' day' : ' days'), late: true };
    if (days === 0) return { text: 'Due today', late: false };
    return { text: 'Due in ' + days + (days === 1 ? ' day' : ' days'), late: false };
  }

  function render() {
    const all = mine(), done = all.filter((t) => t.status === 'done').length;
    $('#progress-text').textContent = done + ' of ' + all.length + ' tasks done';
    $('#progress-fill').style.width = (all.length ? done / all.length * 100 : 0) + '%';

    const q = $('#search').value.trim().toLowerCase();
    const fs = $('#filter-status').value, fp = $('#filter-priority').value;
    const shown = all.filter((t) =>
      (t.title + ' ' + t.desc).toLowerCase().includes(q) &&
      (fs === 'all' || t.status === fs) && (fp === 'all' || t.priority === fp))
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'done' ? 1 : -1) ||
        (a.due ? 0 : 1) - (b.due ? 0 : 1) || (a.due || '').localeCompare(b.due || '') || b.id - a.id);

    list.innerHTML = shown.map((t) => {
      const d = dueText(t);
      return '<li class="task prio-' + t.priority + (t.status === 'done' ? ' is-done' : '') + '" data-id="' + t.id + '">' +
        '<input type="checkbox" class="toggle" aria-label="Mark done"' + (t.status === 'done' ? ' checked' : '') + '>' +
        '<div class="task-body"><strong>' + esc(t.title) + '</strong>' +
        (t.desc ? '<span class="notes">' + esc(t.desc) + '</span>' : '') +
        '<span class="due' + (d.late ? ' overdue' : '') + '">' + d.text + '</span></div>' +
        '<span class="tag">' + t.priority + '</span>' +
        '<button type="button" class="link edit">Edit</button>' +
        '<button type="button" class="link danger delete">Delete</button></li>';
    }).join('');
    $('#empty').hidden = shown.length > 0;
  }

  const taskId = (el) => Number(el.closest('.task').dataset.id);

  list.addEventListener('change', (e) => {
    if (!e.target.classList.contains('toggle')) return;
    const id = taskId(e.target);
    update((all) => all.map((t) => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t));
  });

  list.addEventListener('click', (e) => {
    const id = e.target.closest('.task') && taskId(e.target);
    if (e.target.classList.contains('delete') && confirm('Delete this task?')) {
      update((all) => all.filter((t) => t.id !== id));
    }
    if (e.target.classList.contains('edit')) {
      const t = mine().find((x) => x.id === id);
      $('#t-id').value = t.id; $('#t-title').value = t.title; $('#t-desc').value = t.desc;
      $('#t-due').value = t.due; $('#t-prio').value = t.priority;
      $('#form-title').textContent = 'Edit task';
      $('#form-submit').textContent = 'Save changes';
      cancel.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#t-title').focus();
    }
  });

  function resetForm() {
    form.reset(); $('#t-id').value = '';
    $('#form-title').textContent = 'Add a task';
    $('#form-submit').textContent = 'Add task';
    cancel.hidden = true;
  }
  cancel.addEventListener('click', resetForm);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#t-title').value.trim();
    $('#t-title').classList.toggle('invalid', !title);
    if (!title) { $('#t-title').focus(); return; }
    const data = { title, desc: $('#t-desc').value.trim(), due: $('#t-due').value, priority: $('#t-prio').value };
    const id = Number($('#t-id').value);
    update((all) => id
      ? all.map((t) => t.id === id && t.userId === user.id ? { ...t, ...data } : t)
      : all.concat({ id: Date.now(), userId: user.id, status: 'pending', ...data }));
    resetForm();
  });

  ['#search', '#filter-status', '#filter-priority'].forEach((s) => $(s).addEventListener('input', render));
  render();
}

// ---------- Contact ----------
function initContact(user) {
  const form = $('#contact-form'), msg = $('#c-message');
  $('#c-name').value = user.name; $('#c-email').value = user.email;
  const count = () => { $('#counter').textContent = msg.value.length + ' / 1000'; };
  msg.addEventListener('input', count); count();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#c-name').value.trim(), email = $('#c-email').value.trim(), text = msg.value.trim();
    const errs = [];
    if (!name) errs.push('Enter your name.');
    if (!EMAIL_RE.test(email)) errs.push('Enter a valid email address.');
    if (text.length < 10) errs.push('Write at least 10 characters in your message.');
    showErrors(errs);
    $('#success').hidden = true;
    if (errs.length) return;
    DB.set('sf_messages', DB.get('sf_messages').concat({ name, email, message: text, createdAt: new Date().toISOString() }));
    msg.value = ''; count();
    $('#success').hidden = false;
  });
}

// ---------- Start ----------
if (page === 'login') initLogin();
else {
  const user = currentUser();
  if (!user) location.replace('login.html');
  else {
    $('#logout').addEventListener('click', () => localStorage.removeItem('sf_session'));
    page === 'dashboard' ? initDashboard(user) : initContact(user);
  }
}
