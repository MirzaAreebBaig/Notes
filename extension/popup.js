let notes = {};
let editingNoteId = null;
let webAppTabId = null;

const statusDiv = document.getElementById('status');
const notesListDiv = document.getElementById('notes-list');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');

// Utility: format timestamp to "Today", "Yesterday", or date/time
function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const diff = now - date;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  } else if (
    diff < 2 * oneDay &&
    new Date(now - oneDay).getDate() === date.getDate()
  ) {
    return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  } else {
    return date.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'}) +
      ', ' +
      date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  }
}

function showStatus(msg, color = "#faad14") {
  statusDiv.textContent = msg;
  statusDiv.style.color = color;
}

function findWebAppTab(callback) {
  chrome.tabs.query({url: "https://notes.onebrain.me/*"}, (tabs) => {
    if (tabs.length === 0) {
      showStatus("Open https://notes.onebrain.me in a tab to sync.");
      callback(null);
      return;
    }
    webAppTabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: {tabId: webAppTabId},
      files: ["contentScript.js"]
    }, () => {
      callback(webAppTabId);
    });
  });
}

function sendMessageToWebApp(message, callback) {
  if (!webAppTabId) {
    findWebAppTab((tabId) => {
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, message, callback);
    });
  } else {
    chrome.tabs.sendMessage(webAppTabId, message, callback);
  }
}

function loadNotesFromWebApp() {
  findWebAppTab((tabId) => {
    if (!tabId) return;
    sendMessageToWebApp({action: 'getNotes'}, (response) => {
      if (response && response.notes) {
        notes = response.notes;
        renderNotes();
        showStatus("Synced with notes.onebrain.me", "#52c41a");
      } else {
        showStatus("Failed to sync. Reload web app tab.");
      }
    });
  });
}

function saveNotesToWebApp() {
  sendMessageToWebApp({action: 'setNotes', notes}, (response) => {
    if (response && response.success) {
      loadNotesFromWebApp();
    } else {
      showStatus("Failed to save notes.");
    }
  });
}

function renderNotes() {
  notesListDiv.innerHTML = '';
  const noteEntries = Object.entries(notes);
  if (noteEntries.length === 0) {
    notesListDiv.innerHTML = '<p style="color:#aaa;text-align:center;">No notes yet.</p>';
    return;
  }
  // Sort by timestamp descending, fallback to id (for old notes)
  noteEntries.sort((a, b) => {
    const at = a[1].timestamp || 0, bt = b[1].timestamp || 0;
    return bt - at;
  });

  noteEntries.forEach(([id, noteObj]) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';
    noteDiv.innerHTML = `
      <div class="note-title">${noteObj.title || '(No Title)'}</div>
      <div class="note-content">${noteObj.content ? noteObj.content.replace(/\n/g, '<br>') : ''}</div>
      <div class="note-meta">${formatTimestamp(noteObj.timestamp)}</div>
      <div class="note-actions">
        <button data-edit="${id}">Edit</button>
        <button data-delete="${id}" class="delete-btn">Delete</button>
      </div>
    `;
    notesListDiv.appendChild(noteDiv);
  });
}

function showEditor(content = '', title = '', id = null) {
  document.getElementById('note-editor').style.display = 'flex';
  notesListDiv.style.display = 'none';
  document.getElementById('add-note-btn').style.display = 'none';
  noteTitleInput.value = title;
  noteContentInput.value = content;
  editingNoteId = id;
}

function hideEditor() {
  document.getElementById('note-editor').style.display = 'none';
  notesListDiv.style.display = '';
  document.getElementById('add-note-btn').style.display = '';
  noteTitleInput.value = '';
  noteContentInput.value = '';
  editingNoteId = null;
}

document.getElementById('add-note-btn').addEventListener('click', () => {
  showEditor();
  noteTitleInput.focus();
});

document.getElementById('save-note-btn').addEventListener('click', () => {
  const content = noteContentInput.value.trim();
  const title = noteTitleInput.value.trim();
  if (content === '' && title === '') return;
  if (editingNoteId !== null) {
    notes[editingNoteId] = {
      ...notes[editingNoteId],
      content,
      title
    };
  } else {
    const id = 'note_' + Date.now();
    notes[id] = {
      content,
      title,
      timestamp: Date.now()
    };
  }
  saveNotesToWebApp();
  hideEditor();
});

document.getElementById('cancel-note-btn').addEventListener('click', () => {
  hideEditor();
});

notesListDiv.addEventListener('click', (e) => {
  if (e.target.dataset.edit !== undefined) {
    const id = e.target.dataset.edit;
    showEditor(notes[id].content, notes[id].title, id);
    noteTitleInput.focus();
  }
  if (e.target.dataset.delete !== undefined) {
    const id = e.target.dataset.delete;
    delete notes[id];
    saveNotesToWebApp();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadNotesFromWebApp();
});