const STORAGE_KEY = 'premium-notes-data';
const SETTINGS_KEY = 'premium-notes-settings';

const app = {
  notes: [],
  settings: { theme: 'theme-black', fontSize: 16, wordCount: true, autosave: true },
  currentNoteId: null,
  searchQuery: '',
  autosaveTimer: null,

  init() {
    this.loadData();
    this.setupEventListeners();
    this.applySettings();
    this.renderNotes();
    this.updateNoteCount();
  },

  loadData() {
    try {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      this.notes = Array.isArray(notes) ? notes.map(this.normalizeNote) : [];
      this.settings = { ...this.settings, ...(settings && typeof settings === 'object' ? settings : {}) };
    } catch (error) {
      console.error('Could not load notes:', error);
      this.notes = [];
    }
  },

  normalizeNote(note) {
    return {
      id: String(note?.id || Date.now()),
      title: String(note?.title || ''),
      content: String(note?.content || ''),
      tags: Array.isArray(note?.tags) ? note.tags.map(String).filter(Boolean) : [],
      pinned: Boolean(note?.pinned),
      created: note?.created || new Date().toISOString(),
      lastModified: note?.lastModified || note?.created || new Date().toISOString()
    };
  },

  saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes)); },

  saveSettings() {
    this.settings = {
      theme: document.getElementById('theme-select').value,
      fontSize: Number(document.getElementById('font-size-slider').value),
      wordCount: document.getElementById('word-count-toggle').checked,
      autosave: document.getElementById('autosave-toggle').checked
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    this.applySettings();
  },

  applySettings() {
    document.body.className = this.settings.theme;
    document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
    document.getElementById('theme-select').value = this.settings.theme;
    document.getElementById('font-size-slider').value = this.settings.fontSize;
    document.getElementById('font-size-value').textContent = `${this.settings.fontSize}px`;
    document.getElementById('word-count-toggle').checked = this.settings.wordCount;
    document.getElementById('autosave-toggle').checked = this.settings.autosave;
    document.getElementById('word-count').style.display = this.settings.wordCount ? 'inline' : 'none';
  },

  showSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => section.classList.add('hidden'));
    document.getElementById(`section-${sectionId}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const nav = document.getElementById(`nav-${sectionId}`);
    nav.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.removeAttribute('aria-current'));
    nav.setAttribute('aria-current', 'page');
  },

  getFilteredNotes() {
    const query = this.searchQuery.trim().toLowerCase();
    return this.notes.filter(note => !query || [note.title, note.content, ...note.tags].some(value => value.toLowerCase().includes(query)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.lastModified) - new Date(a.lastModified));
  },

  renderNotes() {
    const grid = document.getElementById('notes-grid');
    grid.replaceChildren();
    const notes = this.getFilteredNotes();
    this.updateNoteCount();

    if (!notes.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const strong = document.createElement('strong');
      strong.textContent = this.searchQuery ? 'No matching notes' : 'Your notebook is empty';
      const text = document.createElement('span');
      text.textContent = this.searchQuery ? 'Try another search.' : 'Create your first note and start writing.';
      empty.append(strong, text);
      grid.appendChild(empty);
      return;
    }

    notes.forEach(note => {
      const card = document.createElement('article');
      card.className = `note-card${note.pinned ? ' pinned' : ''}`;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Open ${note.title || 'untitled note'}`);
      card.addEventListener('click', () => this.openNoteEditor(note.id));
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.openNoteEditor(note.id); } });

      const title = document.createElement('h3');
      title.textContent = note.title || 'Untitled note';
      const preview = document.createElement('p');
      preview.textContent = note.content || 'No content yet...';
      const tags = document.createElement('div');
      tags.className = 'note-tags';
      note.tags.slice(0, 4).forEach(tag => { const el = document.createElement('span'); el.className = 'tag'; el.textContent = tag; tags.appendChild(el); });
      const meta = document.createElement('div');
      meta.className = 'note-meta';
      const date = document.createElement('span');
      date.textContent = this.formatDate(note.lastModified);
      const count = document.createElement('span');
      count.textContent = `${this.wordCount(note.content)} words`;
      meta.append(date, count);
      card.append(title, preview, tags, meta);
      grid.appendChild(card);
    });
  },

  updateNoteCount() {
    const count = this.notes.length;
    document.getElementById('note-count').textContent = `${count} ${count === 1 ? 'note' : 'notes'}`;
  },

  openNoteEditor(noteId = null) {
    this.currentNoteId = noteId;
    const title = document.getElementById('note-title');
    const content = document.getElementById('note-content');
    const tags = document.getElementById('note-tags');
    const note = noteId ? this.notes.find(item => item.id === noteId) : null;
    title.value = note?.title || '';
    content.value = note?.content || '';
    tags.value = note?.tags.join(', ') || '';
    document.getElementById('delete-note-btn').style.display = note ? 'inline-flex' : 'none';
    document.getElementById('pin-btn').textContent = note?.pinned ? '📌' : '📍';
    document.getElementById('last-modified').textContent = note ? `Edited ${this.formatDate(note.lastModified)}` : '';
    document.getElementById('save-status').textContent = note ? 'Saved' : 'Ready';
    document.getElementById('note-modal').classList.remove('hidden');
    this.updateWordCount();
    requestAnimationFrame(() => title.focus());
  },

  closeNoteEditor() {
    clearTimeout(this.autosaveTimer);
    document.getElementById('note-modal').classList.add('hidden');
    this.currentNoteId = null;
  },

  saveCurrentNote(silent = false) {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const tags = this.parseTags(document.getElementById('note-tags').value);
    if (!title && !content) { this.closeNoteEditor(); return; }

    const now = new Date().toISOString();
    if (this.currentNoteId) {
      const index = this.notes.findIndex(note => note.id === this.currentNoteId);
      if (index !== -1) this.notes[index] = { ...this.notes[index], title, content, tags, lastModified: now };
    } else {
      const newNote = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, content, tags, pinned: false, created: now, lastModified: now };
      this.notes.push(newNote);
      this.currentNoteId = newNote.id;
    }
    this.saveData();
    this.renderNotes();
    document.getElementById('save-status').textContent = 'Saved';
    if (!silent) { this.showToast('Note saved'); this.closeNoteEditor(); }
  },

  scheduleAutosave() {
    this.updateWordCount();
    if (!this.settings.autosave || !this.currentNoteId) return;
    clearTimeout(this.autosaveTimer);
    document.getElementById('save-status').textContent = 'Saving…';
    this.autosaveTimer = setTimeout(() => this.saveCurrentNote(true), 500);
  },

  deleteCurrentNote() {
    if (!this.currentNoteId) return;
    if (!confirm('Delete this note? This cannot be undone.')) return;
    this.notes = this.notes.filter(note => note.id !== this.currentNoteId);
    this.saveData(); this.renderNotes(); this.closeNoteEditor(); this.showToast('Note deleted');
  },

  togglePin() {
    if (!this.currentNoteId) return;
    const note = this.notes.find(item => item.id === this.currentNoteId);
    if (!note) return;
    note.pinned = !note.pinned;
    note.lastModified = new Date().toISOString();
    document.getElementById('pin-btn').textContent = note.pinned ? '📌' : '📍';
    this.saveData(); this.renderNotes();
    this.showToast(note.pinned ? 'Note pinned' : 'Note unpinned');
  },

  updateWordCount() {
    const content = document.getElementById('note-content').value;
    const words = this.wordCount(content);
    document.getElementById('word-count').textContent = `Words: ${words} • Characters: ${content.length}`;
  },

  wordCount(text) { return text.trim() ? text.trim().split(/\s+/).length : 0; },
  parseTags(value) { return [...new Set(value.split(',').map(tag => tag.trim()).filter(Boolean))].slice(0, 20); },
  formatDate(value) { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); },

  handleSearch() { this.searchQuery = document.getElementById('search-input').value; this.renderNotes(); },

  exportNotes() {
    const payload = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), notes: this.notes }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `premium-notes-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url); this.showToast('Backup exported');
  },

  importNotes(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const imported = Array.isArray(parsed) ? parsed : parsed.notes;
        if (!Array.isArray(imported)) throw new Error('Invalid backup');
        const existing = new Map(this.notes.map(note => [note.id, note]));
        imported.map(this.normalizeNote).forEach(note => existing.set(note.id, note));
        this.notes = [...existing.values()]; this.saveData(); this.renderNotes(); this.showToast(`${imported.length} notes imported`);
      } catch { alert('That backup file is not valid Premium Notes data.'); }
      event.target.value = '';
    };
    reader.readAsText(file);
  },

  clearData() {
    if (!confirm('Delete all notes and settings? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(SETTINGS_KEY);
    this.notes = []; this.settings = { theme: 'theme-black', fontSize: 16, wordCount: true, autosave: true };
    this.applySettings(); this.renderNotes(); this.showToast('All data cleared');
  },

  showToast(message) {
    const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.remove('hidden');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => toast.classList.add('hidden'), 2400);
  },

  setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', () => this.handleSearch());
    ['note-title', 'note-content', 'note-tags'].forEach(id => document.getElementById(id).addEventListener('input', () => this.scheduleAutosave()));
    document.getElementById('theme-select').addEventListener('change', () => { this.saveSettings(); this.showToast('Theme updated'); });
    document.getElementById('font-size-slider').addEventListener('input', () => { this.settings.fontSize = Number(event.target.value); this.applySettings(); });
    document.getElementById('font-size-slider').addEventListener('change', () => this.saveSettings());
    document.getElementById('word-count-toggle').addEventListener('change', () => this.saveSettings());
    document.getElementById('autosave-toggle').addEventListener('change', () => this.saveSettings());
    document.getElementById('import-input').addEventListener('change', event => this.importNotes(event));

    document.addEventListener('keydown', event => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); this.showSection('notes'); document.getElementById('search-input').focus(); }
      if (mod && event.key.toLowerCase() === 'n') { event.preventDefault(); this.openNoteEditor(); }
      if (event.key === 'Escape' && !document.getElementById('note-modal').classList.contains('hidden')) this.closeNoteEditor();
    });

    document.getElementById('note-modal').addEventListener('click', event => {
      if (event.target.id === 'note-modal') this.closeNoteEditor();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
