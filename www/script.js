const app = {
    notes: [],
    settings: {
        theme: 'theme-black',
        fontSize: 16,
        wordCount: true,
        autosave: true
    },
    currentNoteId: null,
    searchQuery: '',

    init() {
        this.loadData();
        this.applySettings();
        this.renderNotes();
        this.setupEventListeners();
        console.log('App initialized');
    },

    // --- Data Management ---
    loadData() {
        const savedNotes = localStorage.getItem('premium-notes-data');
        const savedSettings = localStorage.getItem('premium-notes-settings');
        
        if (savedNotes) this.notes = JSON.parse(savedNotes);
        if (savedSettings) this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    },

    saveData() {
        localStorage.setItem('premium-notes-data', JSON.stringify(this.notes));
    },

    saveSettings() {
        const theme = document.getElementById('theme-select').value;
        const fontSize = parseInt(document.getElementById('font-size-slider').value);
        const wordCount = document.getElementById('word-count-toggle').checked;
        const autosave = document.getElementById('autosave-toggle').checked;

        this.settings = { theme, fontSize, wordCount, autosave };
        localStorage.setItem('premium-notes-settings', JSON.stringify(this.settings));
        this.applySettings();
        this.showToast('Settings saved');
    },

    applySettings() {
        // Theme
        document.body.className = this.settings.theme;
        document.getElementById('theme-select').value = this.settings.theme;

        // Font Size
        document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
        document.body.style.fontSize = `${this.settings.fontSize}px`;
        document.getElementById('font-size-slider').value = this.settings.fontSize;
        document.getElementById('font-size-value').innerText = `${this.settings.fontSize}px`;

        // Toggles
        document.getElementById('word-count-toggle').checked = this.settings.wordCount;
        document.getElementById('autosave-toggle').checked = this.settings.autosave;
        
        document.getElementById('word-count').style.display = this.settings.wordCount ? 'inline' : 'none';
    },

    // --- UI Logic ---
    showSection(sectionId) {
        document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
        document.getElementById(`section-${sectionId}`).classList.remove('hidden');
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById(`nav-${sectionId}`).classList.add('active');
    },

    renderNotes() {
        const grid = document.getElementById('notes-grid');
        grid.innerHTML = '';

        let filteredNotes = this.notes.filter(note => {
            const query = this.searchQuery.toLowerCase();
            return note.title.toLowerCase().includes(query) || 
                   note.content.toLowerCase().includes(query) ||
                   note.tags.some(t => t.toLowerCase().includes(query));
        });

        // Sort: Pinned first, then by last modified
        filteredNotes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.lastModified) - new Date(a.lastModified);
        });

        if (filteredNotes.length === 0) {
            grid.innerHTML = `<div class="empty-state">No notes found. ${this.searchQuery ? 'Try a different search.' : 'Create your first note!'}</div>`;
            return;
        }

        filteredNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = `note-card ${note.pinned ? 'pinned' : ''}`;
            card.onclick = () => this.openNoteEditor(note.id);

            const date = new Date(note.lastModified).toLocaleDateString();
            
            card.innerHTML = `
                <h3>${note.title || 'Untitled'}</h3>
                <p>${note.content || 'No content...'}</p>
                <div class="note-tags">
                    ${note.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                </div>
                <div class="note-meta">
                    <span>${date}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    // --- Note Editor ---
    openNoteEditor(noteId = null) {
        this.currentNoteId = noteId;
        const modal = document.getElementById('note-modal');
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const tagsInput = document.getElementById('note-tags');
        const deleteBtn = document.getElementById('delete-note-btn');
        const pinBtn = document.getElementById('pin-btn');

        if (noteId) {
            const note = this.notes.find(n => n.id === noteId);
            titleInput.value = note.title;
            contentInput.value = note.content;
            tagsInput.value = note.tags.join(', ');
            deleteBtn.style.display = 'block';
            pinBtn.innerText = note.pinned ? '📌' : '📍';
            document.getElementById('last-modified').innerText = `Last modified: ${new Date(note.lastModified).toLocaleString()}`;
        } else {
            titleInput.value = '';
            contentInput.value = '';
            tagsInput.value = '';
            deleteBtn.style.display = 'none';
            pinBtn.innerText = '📍';
            document.getElementById('last-modified').innerText = '';
        }

        modal.classList.remove('hidden');
        this.updateWordCount();
    },

    closeNoteEditor() {
        document.getElementById('note-modal').classList.add('hidden');
        this.currentNoteId = null;
    },

    saveCurrentNote() {
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        const tags = document.getElementById('note-tags').value.split(',').map(t => t.trim()).filter(t => t !== '');
        
        if (!title && !content) {
            this.closeNoteEditor();
            return;
        }

        const now = new Date().toISOString();

        if (this.currentNoteId) {
            // Update existing
            const index = this.notes.findIndex(n => n.id === this.currentNoteId);
            this.notes[index] = {
                ...this.notes[index],
                title,
                content,
                tags,
                lastModified: now
            };
        } else {
            // Create new
            const newNote = {
                id: Date.now().toString(),
                title,
                content,
                tags,
                pinned: false,
                created: now,
                lastModified: now
            };
            this.notes.push(newNote);
        }

        this.saveData();
        this.renderNotes();
        this.closeNoteEditor();
        this.showToast('Note saved');
    },

    deleteCurrentNote() {
        if (!this.currentNoteId) return;
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(n => n.id !== this.currentNoteId);
            this.saveData();
            this.renderNotes();
            this.closeNoteEditor();
            this.showToast('Note deleted');
        }
    },

    togglePin() {
        if (!this.currentNoteId) return;
        const index = this.notes.findIndex(n => n.id === this.currentNoteId);
        this.notes[index].pinned = !this.notes[index].pinned;
        document.getElementById('pin-btn').innerText = this.notes[index].pinned ? '📌' : '📍';
        this.saveData();
        this.renderNotes();
    },

    handleAutoSave() {
        this.updateWordCount();
        if (this.settings.autosave && this.currentNoteId) {
            // Debounced autosave could be added here, but for now instant update
            const title = document.getElementById('note-title').value.trim();
            const content = document.getElementById('note-content').value.trim();
            const tags = document.getElementById('note-tags').value.split(',').map(t => t.trim()).filter(t => t !== '');
            
            const index = this.notes.findIndex(n => n.id === this.currentNoteId);
            if (index !== -1) {
                this.notes[index].title = title;
                this.notes[index].content = content;
                this.notes[index].tags = tags;
                this.notes[index].lastModified = new Date().toISOString();
                this.saveData();
                // We don't re-render notes grid during typing to avoid focus issues
            }
        }
    },

    updateWordCount() {
        const content = document.getElementById('note-content').value;
        const count = content.trim() ? content.trim().split(/\s+/).length : 0;
        document.getElementById('word-count').innerText = `Words: ${count}`;
    },

    handleSearch() {
        this.searchQuery = document.getElementById('search-input').value;
        this.renderNotes();
    },

    // --- Data Actions ---
    exportNotes() {
        const data = JSON.stringify(this.notes, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Backup downloaded');
    },

    importNotes(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedNotes = JSON.parse(e.target.result);
                if (Array.isArray(importedNotes)) {
                    this.notes = [...this.notes, ...importedNotes];
                    // Remove duplicates by ID
                    const uniqueNotes = [];
                    const ids = new Set();
                    this.notes.forEach(note => {
                        if (!ids.has(note.id)) {
                            ids.add(note.id);
                            uniqueNotes.push(note);
                        }
                    });
                    this.notes = uniqueNotes;
                    this.saveData();
                    this.renderNotes();
                    this.showToast('Notes imported successfully');
                } else {
                    throw new Error('Invalid format');
                }
            } catch (err) {
                alert('Error importing notes: Please ensure the file is a valid notes-backup.json');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    },

    clearData() {
        if (confirm('CRITICAL: This will delete ALL notes and settings. This cannot be undone. Are you sure?')) {
            localStorage.clear();
            this.notes = [];
            this.settings = {
                theme: 'theme-black',
                fontSize: 16,
                wordCount: true,
                autosave: true
            };
            this.applySettings();
            this.renderNotes();
            this.showToast('All data cleared');
        }
    },

    // --- Helpers ---
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.innerText = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    updateTheme() {
        this.saveSettings();
    },

    updateFontSize() {
        const size = document.getElementById('font-size-slider').value;
        document.getElementById('font-size-value').innerText = `${size}px`;
        // We don't save on every slider move, but we could.
        // Let's save on change instead or keep it as is.
        this.settings.fontSize = parseInt(size);
        this.applySettings();
    },

    setupEventListeners() {
        // Close modal on outside click
        window.onclick = (event) => {
            const modal = document.getElementById('note-modal');
            if (event.target === modal) {
                this.saveCurrentNote();
            }
        };

        // Handle font size slider release
        document.getElementById('font-size-slider').onchange = () => this.saveSettings();
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => app.init());
