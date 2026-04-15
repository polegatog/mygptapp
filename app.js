const STORAGE_KEYS = {
  todos: 'voice_todo_items_v1',
  notes: 'voice_note_items_v1',
};

const state = {
  todos: loadJSON(STORAGE_KEYS.todos, []),
  notes: loadJSON(STORAGE_KEYS.notes, []),
  mediaRecorder: null,
  stream: null,
  chunks: [],
  isRecording: false,
};

const todoForm = document.querySelector('#todo-form');
const todoInput = document.querySelector('#todo-input');
const todoList = document.querySelector('#todo-list');
const todoTemplate = document.querySelector('#todo-item-template');

const recordBtn = document.querySelector('#record-btn');
const recordingStatus = document.querySelector('#recording-status');
const voiceList = document.querySelector('#voice-list');
const voiceTemplate = document.querySelector('#voice-item-template');

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function persistTodos() {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(state.todos));
}

function persistNotes() {
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notes));
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTodos() {
  todoList.innerHTML = '';

  if (!state.todos.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No tasks yet.';
    empty.style.listStyle = 'none';
    todoList.append(empty);
    return;
  }

  for (const item of state.todos) {
    const node = todoTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = item.id;

    const checkbox = node.querySelector('.todo-checkbox');
    const text = node.querySelector('.todo-text');
    const deleteBtn = node.querySelector('button');

    checkbox.checked = item.done;
    text.textContent = item.text;

    if (item.done) node.classList.add('done');

    checkbox.addEventListener('change', () => {
      item.done = checkbox.checked;
      node.classList.toggle('done', item.done);
      persistTodos();
    });

    deleteBtn.addEventListener('click', () => {
      state.todos = state.todos.filter((t) => t.id !== item.id);
      persistTodos();
      renderTodos();
    });

    todoList.append(node);
  }
}

function renderNotes() {
  voiceList.innerHTML = '';

  if (!state.notes.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No voice notes yet.';
    voiceList.append(empty);
    return;
  }

  for (const note of state.notes) {
    const node = voiceTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = note.id;

    const title = node.querySelector('.voice-title');
    const audio = node.querySelector('audio');
    const deleteBtn = node.querySelector('button');

    title.textContent = `Recorded ${new Date(note.createdAt).toLocaleString()}`;
    audio.src = note.dataUrl;

    deleteBtn.addEventListener('click', () => {
      state.notes = state.notes.filter((n) => n.id !== note.id);
      persistNotes();
      renderNotes();
    });

    voiceList.append(node);
  }
}

function onTodoSubmit(event) {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  state.todos.unshift({
    id: uid(),
    text,
    done: false,
  });

  persistTodos();
  renderTodos();
  todoForm.reset();
  todoInput.focus();
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read audio blob.'));
    reader.readAsDataURL(blob);
  });
}

function setRecordingUI(isRecording) {
  state.isRecording = isRecording;
  recordBtn.textContent = isRecording ? 'Stop Recording' : 'Start Recording';
  recordingStatus.textContent = isRecording ? 'Recording...' : 'Idle';
}

async function ensureRecorder() {
  if (state.mediaRecorder) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Your browser does not support audio recording.');
  }

  state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  state.mediaRecorder = new MediaRecorder(state.stream);

  state.mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data && event.data.size > 0) {
      state.chunks.push(event.data);
    }
  });

  state.mediaRecorder.addEventListener('stop', async () => {
    if (!state.chunks.length) return;

    const blob = new Blob(state.chunks, { type: 'audio/webm' });
    state.chunks = [];

    try {
      const dataUrl = await blobToDataURL(blob);
      state.notes.unshift({
        id: uid(),
        createdAt: new Date().toISOString(),
        dataUrl,
      });
      persistNotes();
      renderNotes();
    } catch (error) {
      console.error(error);
      alert('Unable to save this recording.');
    }
  });
}

async function onRecordClick() {
  try {
    await ensureRecorder();

    if (!state.mediaRecorder) return;

    if (state.mediaRecorder.state === 'inactive') {
      state.chunks = [];
      state.mediaRecorder.start();
      setRecordingUI(true);
      return;
    }

    if (state.mediaRecorder.state === 'recording') {
      state.mediaRecorder.stop();
      setRecordingUI(false);
    }
  } catch (error) {
    console.error(error);
    alert(error.message || 'Microphone access was denied.');
    setRecordingUI(false);
  }
}

function init() {
  todoForm.addEventListener('submit', onTodoSubmit);
  recordBtn.addEventListener('click', onRecordClick);
  renderTodos();
  renderNotes();
  setRecordingUI(false);
}

init();
