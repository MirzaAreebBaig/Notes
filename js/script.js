        const notepad = document.getElementById('notepad');
        const wordCount = document.getElementById('wordCount');
        const charCount = document.getElementById('charCount');
        const saveStatus = document.querySelector('.save-status');
        const speechToggle = document.getElementById('speechToggle');
        const savedNotesContainer = document.getElementById('savedNotes');
        const noteTitle = document.getElementById('noteTitle');
        let saveTimeout;
        let speechEnabled = false;
        let currentNoteId = 'default';
        let selectedReminderText = ''; // Moved declaration here
        let reminders = JSON.parse(localStorage.getItem('reminders') || '[]'); // Moved declaration here

        function loadPreferences() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.body.classList.toggle('dark-theme', savedTheme === 'dark');
            speechEnabled = localStorage.getItem('speechEnabled') === 'true';
            updateSpeechButton();
            loadSavedNotes();
            loadNote(currentNoteId);
            reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
            updateReminderList();
        }
        

        setInterval(checkReminders, 60000); // Check every minute
        
        document.addEventListener('DOMContentLoaded', () => {
            loadPreferences();
            updateReminderList();
        });


        function createNewNote() {
    currentNoteId = 'note_' + Date.now();
    noteTitle.value = '';
    notepad.value = '';
    updateCounts();
    saveCurrentNote();
}

        function saveCurrentNote() {
    if (!notepad.value.trim() && !noteTitle.value.trim()) return;

    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    notes[currentNoteId] = {
        title: noteTitle.value.trim() || notepad.value.substring(0, 20).trim(),
        content: notepad.value,
        timestamp: Date.now(),
        preview: notepad.value.substring(0, 20) + '...'
    };
    localStorage.setItem('notes', JSON.stringify(notes));
    loadSavedNotes();
    showSaveStatus();
}

        function loadSavedNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    savedNotesContainer.innerHTML = '';

    Object.entries(notes).forEach(([id, note]) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';

        const headerElement = document.createElement('div');
        headerElement.className = 'note-header';

        const titleElement = document.createElement('div');
        titleElement.className = 'note-title';
        titleElement.textContent = note.title || 'Untitled';
        titleElement.onclick = () => loadNote(id);

        const contentElement = document.createElement('div');

        const timestampElement = document.createElement('div');
        timestampElement.className = 'timestamp';
        timestampElement.textContent = new Date(note.timestamp).toLocaleString();

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteNote(id);
        };

        headerElement.appendChild(titleElement);
        headerElement.appendChild(deleteButton);
        noteElement.appendChild(headerElement);
        noteElement.appendChild(contentElement);
        noteElement.appendChild(timestampElement);
        savedNotesContainer.appendChild(noteElement);
        searchNotes();
    });
}
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    updateReminderList();
    
    // Add the search functionality
    const searchInput = document.getElementById('searchNotes');
    searchInput.addEventListener('input', searchNotes);
});

        function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        const notes = JSON.parse(localStorage.getItem('notes') || '{}');
        delete notes[id];
        localStorage.setItem('notes', JSON.stringify(notes));

        if (id === currentNoteId) {
            currentNoteId = 'default';
            noteTitle.value = '';
            notepad.value = '';
            updateCounts();
        }

        loadSavedNotes();
    }
}

        function loadNote(id) {
    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    if (notes[id]) {
        currentNoteId = id;
        noteTitle.value = notes[id].title || '';
        notepad.value = notes[id].content;
        updateCounts();
    }
}

        function exportNote() {
            if (!notepad.value.trim()) return;
            const blob = new Blob([notepad.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `note_${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function updateCounts() {
            const text = notepad.value;
            const words = text.trim() ? text.match(/\S+/g)?.length || 0 : 0;
            const chars = text.length;
            wordCount.textContent = `${words} words`;
            charCount.textContent = `${chars} characters`;
        }

        function showSaveStatus() {
            saveStatus.classList.add('visible');
            setTimeout(() => saveStatus.classList.remove('visible'), 2000);
        }

        notepad.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 1000);
    updateCounts();
});

noteTitle.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 1000);
});

        notepad.addEventListener('mouseup', () => {
            if (!speechEnabled) return;
            const selectedText = notepad.value.substring(
                notepad.selectionStart, 
                notepad.selectionEnd
            ).trim();
            if (selectedText) {
                stopSpeaking();
                const utterance = new SpeechSynthesisUtterance(selectedText);
                window.speechSynthesis.speak(utterance);
            }
        });

        function toggleSpeech() {
            speechEnabled = !speechEnabled;
            speechToggle.innerHTML = `<i class="fas fa-microphone"></i> Speech ${speechEnabled ? 'On' : 'Off'}`;
            speechToggle.classList.toggle('active', speechEnabled);
            localStorage.setItem('speechEnabled', speechEnabled);
        }

        function updateSpeechButton() {
            speechToggle.innerHTML = `<i class="fas fa-microphone"></i> Speech ${speechEnabled ? 'On' : 'Off'}`;
            speechToggle.classList.toggle('active', speechEnabled);
        }

        function stopSpeaking() {
            window.speechSynthesis.cancel();
        }

        function toggleTheme() {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        }

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveCurrentNote();
            }
        });

        loadPreferences();
        
        
        function handleReminderButton() {
            const selectedText = notepad.value.substring(
                notepad.selectionStart,
                notepad.selectionEnd
            ).trim();

            if (selectedText) {
                selectedReminderText = selectedText;
                document.getElementById('selectedTextPreview').textContent = 
                    `Set reminder for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`;
                document.getElementById('reminderDialog').classList.add('visible');
                document.getElementById('overlay').classList.add('visible');
            } else {
                showNotification('Please select text to set a reminder');
            }
        }

        function setReminder(minutes) {
            const reminderTime = new Date(Date.now() + minutes * 60000);
            const reminder = {
                id: Date.now(),
                text: selectedReminderText,
                time: reminderTime.toISOString(),
                triggered: false
            };

            reminders.push(reminder);
            localStorage.setItem('reminders', JSON.stringify(reminders));
            closeReminderDialog();
            showNotification('Reminder set successfully');
            updateReminderList();
            
            
            if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_REMINDER',
      id: reminder.id,
      time: reminderTime.toISOString(),
      text: selectedReminderText
    });
  }

  closeReminderDialog();
  showNotification(`Reminder set for ${Math.floor(minutes/60)}h ${minutes%60}m from now`);
  updateReminderList();

        }

        function closeReminderDialog() {
            document.getElementById('reminderDialog').classList.remove('visible');
            document.getElementById('overlay').classList.remove('visible');
            selectedReminderText = '';
        }

        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('visible');
            setTimeout(() => {
                notification.classList.remove('visible');
            }, 3000);
        }

        function updateReminderList() {
            const reminderList = document.getElementById('reminderList');
            reminderList.innerHTML = '';

            const activeReminders = reminders.filter(r => !r.triggered);
            if (activeReminders.length === 0) return;

            const title = document.createElement('h3');
            title.textContent = 'Active Reminders';
            reminderList.appendChild(title);

            activeReminders.forEach(reminder => {
                const reminderElement = document.createElement('div');
                reminderElement.className = 'reminder-item';
                reminderElement.innerHTML = `
                    <div class="reminder-text">${reminder.text.substring(0, 50)}${reminder.text.length > 50 ? '...' : ''}</div>
                    <div class="reminder-time">${new Date(reminder.time).toLocaleTimeString()}</div>
                    <button class="reminder-delete" onclick="deleteReminder(${reminder.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                reminderList.appendChild(reminderElement);
            });
        }

        function deleteReminder(id) {
            reminders = reminders.filter(r => r.id !== id);
            localStorage.setItem('reminders', JSON.stringify(reminders));
            updateReminderList();
        }

        function checkReminders() {
  const now = new Date();
  let hasTriggered = false;
  
  reminders.forEach(reminder => {
    if (!reminder.triggered && new Date(reminder.time) <= now) {
      // Only handle speech if speech is enabled
      if (speechEnabled) {
        speakReminder(reminder.text);
      }
      
      // Show notification regardless of speech setting
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reminder', {
          body: reminder.text,
          icon: '/favicon.ico',
          requireInteraction: true
        });
      }
      
      reminder.triggered = true;
      hasTriggered = true;
    }
  });
  
  if (hasTriggered) {
    localStorage.setItem('reminders', JSON.stringify(reminders));
    updateReminderList();
  }
}


        function speakReminder(text) {
            const utterance = new SpeechSynthesisUtterance(`Reminder: ${text}`);
            window.speechSynthesis.speak(utterance);
            showNotification('Speaking reminder: ' + text.substring(0, 30) + '...');
        }
        
        
        let speechQueue = [];
        let isSpeaking = false;

        function validateAndSetReminder() {
            const hours = parseInt(document.getElementById('hoursInput').value) || 0;
            const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
            const totalMinutes = hours * 60 + minutes;
            const timeError = document.getElementById('timeError');

            if (totalMinutes < 1) {
                timeError.classList.add('visible');
                return;
            }

            timeError.classList.remove('visible');
            setReminder(totalMinutes);
        }

        function setReminder(minutes) {
            const reminderTime = new Date(Date.now() + minutes * 60000);
            const reminder = {
                id: Date.now(),
                text: selectedReminderText,
                time: reminderTime.toISOString(),
                triggered: false
            };

            reminders.push(reminder);
            localStorage.setItem('reminders', JSON.stringify(reminders));
            closeReminderDialog();
            
            const timeStr = `${Math.floor(minutes/60)}h ${minutes%60}m`;
            showNotification(`Reminder set for ${timeStr} from now`);
            updateReminderList();
        }

        function handleReminderButton() {
            const selectedText = notepad.value.substring(
                notepad.selectionStart,
                notepad.selectionEnd
            ).trim();

            if (selectedText) {
                selectedReminderText = selectedText;
                document.getElementById('selectedTextPreview').textContent = selectedText;
                document.getElementById('reminderDialog').classList.add('visible');
                document.getElementById('overlay').classList.add('visible');
                
                // Reset inputs
                document.getElementById('hoursInput').value = "0";
                document.getElementById('minutesInput').value = "0";
                document.getElementById('timeError').classList.remove('visible');
            } else {
                showNotification('Please select text to set a reminder');
            }
        }

        function processReminderQueue() {
            if (isSpeaking || speechQueue.length === 0) return;
            
            isSpeaking = true;
            const text = speechQueue.shift();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => {
                isSpeaking = false;
                processReminderQueue();
            };
            
            window.speechSynthesis.speak(utterance);
        }

        function speakReminder(text) {
            speechQueue.push(`Reminder: ${text}`);
            processReminderQueue();
            
            // Show notification
            showNotification('⏰ Reminder: ' + text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            
            // Also show browser notification if supported
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification('Reminder', { body: text });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification('Reminder', { body: text });
                        }
                    });
                }
            }
        }

        function updateReminderList() {
            const reminderList = document.getElementById('reminderList');
            reminderList.innerHTML = '';

            const activeReminders = reminders.filter(r => !r.triggered)
                .sort((a, b) => new Date(a.time) - new Date(b.time));
                
            if (activeReminders.length === 0) return;

            const title = document.createElement('h3');
            title.textContent = 'Active Reminders';
            reminderList.appendChild(title);

            activeReminders.forEach(reminder => {
                const reminderElement = document.createElement('div');
                reminderElement.className = 'reminder-item';
                
                const timeUntil = getTimeUntil(new Date(reminder.time));
                
                reminderElement.innerHTML = `
                    <div class="reminder-text">${reminder.text.substring(0, 50)}${reminder.text.length > 50 ? '...' : ''}</div>
                    <div class="reminder-time">
                        ${timeUntil} (${new Date(reminder.time).toLocaleTimeString()})
                    </div>
                    <button class="reminder-delete" onclick="deleteReminder(${reminder.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                reminderList.appendChild(reminderElement);
            });
        }

        function getTimeUntil(date) {
            const now = new Date();
            const diff = date - now;
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                return `${hours}h ${minutes}m remaining`;
            }
            return `${minutes}m remaining`;
        }

        function checkReminders() {
            const now = new Date();
            let hasTriggered = false;
            
            reminders.forEach(reminder => {
                if (!reminder.triggered && new Date(reminder.time) <= now) {
                    speakReminder(reminder.text);
                    reminder.triggered = true;
                    hasTriggered = true;
                }
            });
            
            if (hasTriggered) {
                localStorage.setItem('reminders', JSON.stringify(reminders));
                updateReminderList();
            }
        }

        // Check reminders more frequently (every 15 seconds)
        setInterval(checkReminders, 15000);

        // Initialize everything when the page loads
        document.addEventListener('DOMContentLoaded', () => {
  loadPreferences();
  initializeReminders();
  updateReminderList();
  checkReminders();
            
            // Add input validation
            const timeInputs = document.querySelectorAll('.time-input');
            timeInputs.forEach(input => {
                input.addEventListener('input', function() {
                    let value = parseInt(this.value) || 0;
                    const max = parseInt(this.max);
                    const min = parseInt(this.min);
                    
                    if (value > max) this.value = max;
                    if (value < min) this.value = min;
                });
            });
        });
        // Speech synthesis configuration
const speechConfig = {
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1
};

window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer higher quality voices in this order: Microsoft, Google, then others
    speechConfig.voice = voices.find(voice => 
        voice.name.includes('Microsoft') && voice.name.includes('Female')) ||
        voices.find(voice => voice.name.includes('Google') && voice.name.includes('Female')) ||
        voices.find(voice => voice.lang.startsWith('en-')) ||
        voices[0];
};

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice configuration
    utterance.voice = speechConfig.voice;
    utterance.rate = speechConfig.rate;
    utterance.pitch = speechConfig.pitch;
    utterance.volume = speechConfig.volume;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    // Speak the new text
    window.speechSynthesis.speak(utterance);
}

function speakReminder(text) {
    speechQueue.push(`Reminder: ${text}`);
    processReminderQueue();
    
    showNotification('⏰ Reminder: ' + text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification('Reminder', { 
                body: text,
                icon: '/favicon.ico'  // Add icon for better visibility
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Reminder', { 
                        body: text,
                        icon: '/favicon.ico'
                    });
                }
            });
        }
    }
}

function processReminderQueue() {
    if (isSpeaking || speechQueue.length === 0) return;
    
    isSpeaking = true;
    const text = speechQueue.shift();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.voice = speechConfig.voice;
    utterance.rate = 0.9;  
    utterance.pitch = 1.1; 
    utterance.volume = 1;  
    
    utterance.onend = () => {
        isSpeaking = false;
        processReminderQueue();
    };
    
    window.speechSynthesis.speak(utterance);
}

notepad.addEventListener('mouseup', () => {
    if (!speechEnabled) return;
    const selectedText = notepad.value.substring(
        notepad.selectionStart, 
        notepad.selectionEnd
    ).trim();
    if (selectedText) {
        speak(selectedText);
    }
});

function createVoiceControls() {
    const controls = document.createElement('div');
    controls.className = 'voice-controls';
    controls.style.display = speechEnabled ? 'block' : 'none';
    controls.innerHTML = `
        <select id="voiceSelect" class="control-btn">
            ${window.speechSynthesis.getVoices().map(voice => 
                `<option value="${voice.name}">${voice.name} (${voice.lang})</option>`
            ).join('')}
        </select>
        <input type="range" id="rateControl" min="0.5" max="2" step="0.1" value="1" class="control-btn">
        <label for="rateControl">Speed</label>
    `;
    
    document.querySelector('.control-row').appendChild(controls);
    
    // Update voice settings when changed
    document.getElementById('voiceSelect').addEventListener('change', (e) => {
        speechConfig.voice = window.speechSynthesis.getVoices()
            .find(voice => voice.name === e.target.value);
    });
    
    document.getElementById('rateControl').addEventListener('input', (e) => {
        speechConfig.rate = parseFloat(e.target.value);
    });
}

window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    speechConfig.voice = voices.find(voice => 
        voice.name.includes('Microsoft') && voice.name.includes('Female')) ||
        voices.find(voice => voice.name.includes('Google') && voice.name.includes('Female')) ||
        voices.find(voice => voice.lang.startsWith('en-')) ||
        voices[0];
    
    createVoiceControls();
};


function initializeReminders() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered');
        requestNotificationPermission();
      })
      .catch(err => console.error('Service Worker registration failed:', err));
  }
}

async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
    }
  }
}
function searchNotes() {
    const searchTerm = document.getElementById('searchNotes').value.toLowerCase();
    const notes = JSON.parse(localStorage.getItem('notes') || '{}');
    savedNotesContainer.innerHTML = '';
    
    let matchCount = 0;
    
    Object.entries(notes).forEach(([id, note]) => {
        // Search in both title and content
        const titleMatch = note.title && note.title.toLowerCase().includes(searchTerm);
        const contentMatch = note.content && note.content.toLowerCase().includes(searchTerm);
        
        if (searchTerm === '' || titleMatch || contentMatch) {
            matchCount++;
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            
            const headerElement = document.createElement('div');
            headerElement.className = 'note-header';
            
            const titleElement = document.createElement('div');
            titleElement.className = 'note-title';
            
            // Highlight matching text in title
            const title = note.title || 'Untitled';
            if (titleMatch && searchTerm !== '') {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                titleElement.innerHTML = title.replace(regex, '<span class="highlight">$1</span>');
            } else {
                titleElement.textContent = title;
            }
            
            titleElement.onclick = () => loadNote(id);
            
            const contentElement = document.createElement('div');
            contentElement.className = 'note-content';
            
            // Add content preview with highlighting if it matches search
            if (contentMatch && searchTerm !== '') {
                // Find the position of the match
                const matchPos = note.content.toLowerCase().indexOf(searchTerm);
                // Get a snippet around the match
                const start = Math.max(0, matchPos - 20);
                const end = Math.min(note.content.length, matchPos + searchTerm.length + 20);
                let snippet = note.content.substring(start, end);
                
                // Add ellipsis if needed
                if (start > 0) snippet = '...' + snippet;
                if (end < note.content.length) snippet = snippet + '...';
                
                // Highlight the match
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                contentElement.innerHTML = snippet.replace(regex, '<span class="highlight">$1</span>');
            }
            
            const timestampElement = document.createElement('div');
            timestampElement.className = 'timestamp';
            timestampElement.textContent = new Date(note.timestamp).toLocaleString();
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.onclick = (e) => {
                e.stopPropagation();
                deleteNote(id);
            };
            
            headerElement.appendChild(titleElement);
            headerElement.appendChild(deleteButton);
            noteElement.appendChild(headerElement);
            if (contentMatch) noteElement.appendChild(contentElement);
            noteElement.appendChild(timestampElement);
            savedNotesContainer.appendChild(noteElement);
        }
    });
    
    // Show a message if no notes match
    if (matchCount === 0 && searchTerm !== '') {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No matching notes found';
        savedNotesContainer.appendChild(noResults);
    }
}

// Feature acknowledgments data
const featureAcknowledgments = [
    {
        id: 1,
        feature: "Notes.OneBrain.me Project",
        description: "Started this project and developed the entire notepad application. Active contributor.",
        requester: "Areeb",
        date: "September 21, 2024",
        icon: "fa-code"
    },
    {
        id: 2,
        feature: "Image Insertion & Rich Editor",
        description: "Requested support for inserting images and rich text editing features. (Coming soon)",
        requester: "Sameera",
        date: "November 19, 2024",
        icon: "fa-image",
        pending: true
    },
    {
        id: 2,
        feature: "Note Encryption",
        description: "Adding browser level encryption for notes.",
        requester: "Mohammed Sameer",
        date: "November 22, 2024",
        icon: "fa-lock"
    },
    {
        id: 3,
        feature: "Note Dates & Change Log",
        description: "Adding date information to each note and maintaining a history of changes.",
        requester: "Mubashir Hussain",
        date: "November 22, 2024",
        icon: "fa-calendar-alt"
    },
    {
        id: 5,
        feature: "Voice Note Reminders",
        description: "Setting timed reminders for important notes with voice notifications.",
        requester: "Mohammad Anwar",
        date: "November 23, 2024",
        icon: "fa-bell"
    },
    {
        id: 6,
        feature: "Double-Click Text to Voice",
        description: "Reading selected text aloud by double-clicking for accessibility and multitasking.",
        requester: "Areeb",
        date: "November 25, 2024",
        icon: "fa-volume-up"
    },
    {
        id: 7,
        feature: "Text Formatting",
        description: "Bullet points, task checkboxes, text styling with underline/border/text size options. (Coming soon)",
        requester: "Mubashir Hussain",
        date: "November 26, 2024",
        icon: "fa-list",
        pending: true
    },
    {
        id: 8,
        feature: "Note Titles",
        description: "Adding titles to notes for better organization and quick identification.",
        requester: "Mubashir Hussain",
        date: "November 27, 2024",
        icon: "fa-heading"
    },
    {
        id: 9,
        feature: "Note Titles Enhancement",
        description: "Further improvements to the note titles feature.",
        requester: "Hamza Habeeb",
        date: "May 6, 2025",
        icon: "fa-heading"
    },
    {
        id: 10,
        feature: "Search Feature",
        description: "Ability to search through all saved notes by title and content.",
        requester: "Areeb",
        date: "May 6, 2025",
        icon: "fa-search"
    }
];


function loadAcknowledgments() {
    const acknowledgmentsList = document.getElementById('acknowledgmentsList');
    acknowledgmentsList.innerHTML = '';
    
    featureAcknowledgments.forEach(item => {
        const featureElement = document.createElement('div');
        featureElement.className = 'feature-item';
        
        featureElement.innerHTML = `
            <div class="feature-icon">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="feature-content">
                <div class="feature-title">${item.feature}</div>
                <div class="feature-description">${item.description}</div>
                <div class="feature-requester">
                    <i class="fas fa-user"></i> Requested by: ${item.requester}
                    <span class="feature-date">(${item.date})</span>
                </div>
            </div>
        `;
        
        acknowledgmentsList.appendChild(featureElement);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    initializeReminders();
    updateReminderList();
    checkReminders();
    loadAcknowledgments(); // Add this line
    
    // Add the search functionality
    const searchInput = document.getElementById('searchNotes');
    if (searchInput) {
        searchInput.addEventListener('input', searchNotes);
    }
    
    // Rest of your initialization code...
});
