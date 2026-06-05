/* ═════════════════════════════════════════════════════════ */
/*  DOM REFS                                                */
/* ═════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

const authScreen    = $('auth-screen');
const appScreen     = $('app-screen');
const googleBtn     = $('google-login-btn');
const logoutBtn     = $('logout-btn');
const userEmail     = $('user-email');
const authError     = $('auth-error');
const itemForm      = $('item-form');
const itemName      = $('item-name');
const itemQty       = $('item-qty');
const formSubmitBtn = $('form-submit-btn');
const formCancelBtn = $('form-cancel-btn');
const shoppingList  = $('shopping-list');
const emptyMsg      = $('empty-msg');
const themeToggle   = $('theme-toggle');

/* ═════════════════════════════════════════════════════════ */
/*  ESTADO                                                  */
/* ═════════════════════════════════════════════════════════ */

let currentUser = null;
let editingId   = null;
let unsubscribe = null;

/* ═════════════════════════════════════════════════════════ */
/*  AUTENTICACIÓN CON GOOGLE                                */
/* ═════════════════════════════════════════════════════════ */

googleBtn.addEventListener('click', async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  } catch (err) {
    authError.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', () => {
  firebase.auth().signOut();
});

/* ═════════════════════════════════════════════════════════ */
/*  ESTADO DE AUTENTICACIÓN                                 */
/* ═════════════════════════════════════════════════════════ */

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    userEmail.textContent = user.email;
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    authError.textContent = '';
    startListening();
  } else {
    currentUser = null;
    editingId = null;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    shoppingList.innerHTML = '';
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
  }
});

/* ═════════════════════════════════════════════════════════ */
/*  TEMA (CLARO / OSCURO)                                   */
/* ═════════════════════════════════════════════════════════ */

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
});

/* ═════════════════════════════════════════════════════════ */
/*  FIRESTORE — REAL-TIME LISTENER                          */
/* ═════════════════════════════════════════════════════════ */

function startListening() {
  if (unsubscribe) unsubscribe();

  unsubscribe = firebase
    .firestore()
    .collection('shopping-list')
    .where('userId', '==', currentUser.uid)
    .onSnapshot(
      (snapshot) => {
        const sorted = snapshot.docs.sort((a, b) => {
          const ta = a.data().createdAt?.toMillis() || 0;
          const tb = b.data().createdAt?.toMillis() || 0;
          return ta - tb;
        });
        renderItems(sorted);
      },
      (error) => {
        console.error('Firestore error:', error);
        alert('Error de Firestore: ' + error.message);
      }
    );
}

/* ═════════════════════════════════════════════════════════ */
/*  RENDER                                                  */
/* ═════════════════════════════════════════════════════════ */

function renderItems(docs) {
  shoppingList.innerHTML = '';

  if (docs.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }

  emptyMsg.classList.add('hidden');

  docs.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement('li');
    li.className = 'shopping-item' + (data.completed ? ' completed' : '');
    li.dataset.id = doc.id;

    li.innerHTML = `
      <input type="checkbox" class="item-check" ${data.completed ? 'checked' : ''} />
      <div class="item-info">
        <div class="item-name">${escapeHtml(data.name)}</div>
        <div class="item-qty">Cantidad: ${data.quantity || 1}</div>
      </div>
      <div class="item-actions">
        <button class="btn-icon edit-btn" title="Editar">✏️</button>
        <button class="btn-icon danger delete-btn" title="Eliminar">🗑️</button>
      </div>
    `;

    const checkbox = li.querySelector('.item-check');
    checkbox.addEventListener('change', () => toggleComplete(doc.id, checkbox.checked));

    li.querySelector('.edit-btn').addEventListener('click', () => startEdit(doc.id, data));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteItem(doc.id));

    shoppingList.appendChild(li);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ═════════════════════════════════════════════════════════ */
/*  CRUD                                                    */
/* ═════════════════════════════════════════════════════════ */

// CREATE
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = itemName.value.trim();
  const qty  = parseInt(itemQty.value, 10) || 1;

  if (!name) return;

  try {
    if (editingId) {
      await firebase.firestore().collection('shopping-list').doc(editingId).update({
        name,
        quantity: qty,
      });
      cancelEdit();
    } else {
      await firebase.firestore().collection('shopping-list').add({
        name,
        quantity: qty,
        completed: false,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: currentUser.uid,
      });
      itemName.value = '';
      itemQty.value = '1';
    }
  } catch (err) {
    console.error('Error saving item:', err);
    alert('Error al guardar: ' + err.message);
  }
});

// EDIT — fill form with existing data
function startEdit(id, data) {
  editingId = id;
  itemName.value = data.name;
  itemQty.value = data.quantity || 1;
  formSubmitBtn.textContent = 'Guardar';
  formCancelBtn.classList.remove('hidden');
  itemName.focus();
}

function cancelEdit() {
  editingId = null;
  itemName.value = '';
  itemQty.value = '1';
  formSubmitBtn.textContent = 'Añadir';
  formCancelBtn.classList.add('hidden');
}

formCancelBtn.addEventListener('click', cancelEdit);

// DELETE
async function deleteItem(id) {
  try {
    await firebase.firestore().collection('shopping-list').doc(id).delete();
    if (editingId === id) cancelEdit();
  } catch (err) {
    console.error('Error deleting item:', err);
    alert('Error al eliminar: ' + err.message);
  }
}

// TOGGLE COMPLETE
async function toggleComplete(id, completed) {
  try {
    await firebase.firestore().collection('shopping-list').doc(id).update({ completed });
  } catch (err) {
    console.error('Error updating item:', err);
    alert('Error al actualizar: ' + err.message);
  }
}
