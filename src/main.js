const mainMenuEl = document.getElementById('main-menu');
const noteListEl = document.getElementById('note-list');
const addNoteBtn = document.getElementById('add-note');
const hideMainMenuBtn = document.getElementById('hide-main-menu');
const shortcutHintEl = document.getElementById('shortcut-hint');

const DEFAULT_WIDTH = 260;
const DEFAULT_HEIGHT = 260;
const DEFAULT_OPACITY = 0.92;
const DEFAULT_COLOR = '#2B2B2B';
const DEFAULT_FONT = 'BBH Sans Hegartly';

const state = {
    notes: [],
    shortcut: null,
};

function ensureArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value;
}

function normalizeHex(color) {
    if (typeof color !== 'string') {
        return DEFAULT_COLOR;
    }
    let hex = color.trim();
    const shortMatch = /^#([A-Fa-f0-9]{3})$/;
    const longMatch = /^#([A-Fa-f0-9]{6})$/;

    if (shortMatch.test(hex)) {
        const [, digits] = hex.match(shortMatch);
        hex = `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`;
    }

    if (!longMatch.test(hex)) {
        return DEFAULT_COLOR;
    }
    return hex.toUpperCase();
}

function hexToRgb(hex) {
    const sanitized = normalizeHex(hex).replace('#', '');
    const intVal = Number.parseInt(sanitized, 16);
    return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255,
    };
}

function hexToRgba(hex, alpha = 1) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getReadableTextColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const toLinear = channel => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.55 ? '#0F0F10' : '#F8F9FB';
}

function truncate(value, maxLength) {
    const s = value == null ? '' : String(value);
    if (s.length <= maxLength) {
        return s;
    }
    if (maxLength <= 1) {
        return '…';
    }
    return `${s.slice(0, maxLength - 1)}…`;
}

function deriveTitle(note) {
    const content = (note?.content ?? '').trim();
    if (!content) {
        return 'Untitled note';
    }
    const firstLine = content.split('\n').find(line => line.trim().length > 0);
    return truncate(firstLine ?? 'Untitled note', 42);
}

function derivePreview(note) {
    const content = (note?.content ?? '').replace(/\s+/g, ' ').trim();
    if (!content) {
        return 'Tap to add some thoughts';
    }
    return truncate(content, 120);
}

function renderEmptyState() {
    const placeholder = document.createElement('div');
    placeholder.className = 'empty';
    placeholder.textContent = 'No notes yet — press ＋ to create one.';
    noteListEl.replaceChildren(placeholder);
}

function renderNotes() {
    if (!noteListEl) {
        return;
    }

    const notes = ensureArray(state.notes);
    if (notes.length === 0) {
        renderEmptyState();
        return;
    }

    const fragment = document.createDocumentFragment();

    notes.forEach(note => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'note-card';
        button.dataset.noteId = String(note.id);
        button.style.background = hexToRgba(note.theme_color ?? DEFAULT_COLOR, Math.min(1, note.opacity ?? DEFAULT_OPACITY));
        button.style.color = getReadableTextColor(note.theme_color ?? DEFAULT_COLOR);
        button.style.borderColor = hexToRgba(note.theme_color ?? DEFAULT_COLOR, 0.35);
        button.style.boxShadow = `0 16px 34px ${hexToRgba(note.theme_color ?? DEFAULT_COLOR, 0.28)}`;

        const title = document.createElement('strong');
        title.textContent = deriveTitle(note);

        const preview = document.createElement('span');
        preview.textContent = derivePreview(note);

        button.appendChild(title);
        button.appendChild(preview);

        button.addEventListener('click', () => {
            focusNote(note.id);
        });

        button.addEventListener('contextmenu', event => {
            event.preventDefault();
            showContextMenu(note, event.clientX, event.clientY);
        });
  
        fragment.appendChild(button);
    });
  
    noteListEl.replaceChildren(fragment);
}
  
// Context menu for note actions (Delete / Pin)
let _contextMenuEl = null;
function ensureContextMenu() {
    if (_contextMenuEl) return _contextMenuEl;
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.setAttribute('role', 'menu');
    menu.style.position = 'fixed';
    menu.style.zIndex = 10000;
    menu.style.minWidth = '160px';
    menu.style.borderRadius = '10px';
    menu.style.overflow = 'hidden';
    menu.style.boxShadow = '0 12px 32px rgba(0,0,0,0.48)';
    menu.style.background = 'linear-gradient(180deg, rgba(28,28,30,0.86), rgba(18,18,20,0.86))';
    menu.style.backdropFilter = 'blur(10px) saturate(120%)';
    menu.style.padding = '6px 6px';
    menu.style.display = 'none';
    menu.addEventListener('click', e => {
        e.stopPropagation();
    });
    document.body.appendChild(menu);
    _contextMenuEl = menu;
    return menu;
}

function hideContextMenu() {
    if (!_contextMenuEl) return;
    _contextMenuEl.style.display = 'none';
    _contextMenuEl.innerHTML = '';
    _contextMenuEl.removeAttribute('data-active-index');
}

function showContextMenu(note, clientX, clientY) {
    const menu = ensureContextMenu();
    hideContextMenu();

    const items = [];

    // helper to create menu item with icon + keyboard support
    function createMenuItem(label, icon, onActivate, danger = false) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'context-item';
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', '-1');
        item.style.width = '100%';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.textAlign = 'left';
        item.style.padding = '8px 10px';
        item.style.border = 'none';
        item.style.background = 'transparent';
        item.style.color = danger ? 'var(--danger-color, #ff6b6b)' : 'var(--text-primary)';
        item.style.cursor = 'pointer';
        item.style.fontSize = '13px';

        const iconEl = document.createElement('span');
        iconEl.className = 'context-icon';
        iconEl.style.width = '18px';
        iconEl.style.display = 'inline-grid';
        iconEl.style.placeItems = 'center';
        iconEl.innerHTML = icon || '';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;

        item.appendChild(iconEl);
        item.appendChild(labelEl);

        item.addEventListener('click', e => {
            e.stopPropagation();
            onActivate();
        });

        // keyboard activation
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate();
            }
        });

        return item;
    }

    // Pin / Unpin entry (inline SVGs used for crisp icons)
    const pinLabel = note?.pinned ? 'Unpin' : 'Pin';
    const pinSvg = note?.pinned
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c.55 0 1 .45 1 1v6.59l3.3 3.29c.63.63.18 1.71-.7 1.71H13v6c0 .55-.45 1-1 1s-1-.45-1-1v-6H8.4c-.88 0-1.33-1.08-.7-1.71L11 9.59V3c0-.55.45-1 1-1z"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v7l3 3h-6l3-3V2z"/><path d="M11 13v8"/></svg>`;

    const pinItem = createMenuItem(pinLabel, pinSvg, () => {
        if (window.desktopNotes?.setNotePinned) {
            window.desktopNotes.setNotePinned(note.id, !note.pinned)
                .then(updated => {
                    // update local state if backend returns updated note
                    if (updated && updated.id) {
                        state.notes = state.notes.map(n => (n.id === updated.id ? updated : n));
                        // resort so pinned notes stay at top
                        state.notes.sort((a, b) => {
                            const pa = Number(Boolean(a.pinned));
                            const pb = Number(Boolean(b.pinned));
                            if (pb !== pa) return pb - pa;
                            const ua = Number(a.updated_at ?? 0);
                            const ub = Number(b.updated_at ?? 0);
                            if (ub !== ua) return ub - ua;
                            return (b.id ?? 0) - (a.id ?? 0);
                        });
                        renderNotes();
                    }
                })
                .catch(err => console.error('Failed to toggle pinned', err));
        }
        hideContextMenu();
    });

    // Delete entry (use small SVG for trash)
    const trashSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    const delItem = createMenuItem('Delete', trashSvg, () => {
        if (window.desktopNotes?.deleteNote) {
            window.desktopNotes.deleteNote(note.id).then(result => {
                if (result && result.success) {
                    // remove immediately from UI
                    state.notes = state.notes.filter(n => n.id !== note.id);
                    renderNotes();
                }
            }).catch(err => console.error('Failed to delete note', err));
        }
        hideContextMenu();
    }, true);

    items.push(pinItem, delItem);
    items.forEach(it => menu.appendChild(it));

    // Position with edge collision handling
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.style.display = 'block'; // need to display to measure
    // place near requested point, then adjust if it overflows
    let x = Math.max(8, clientX);
    let y = Math.max(8, clientY);
    const rect = menu.getBoundingClientRect();
    const menuW = rect.width || 160;
    const menuH = rect.height || (items.length * 40);
    if (x + menuW + 8 > viewportW) {
        x = Math.max(8, viewportW - menuW - 8);
    }
    if (y + menuH + 8 > viewportH) {
        y = Math.max(8, viewportH - menuH - 8);
    }
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // Focus management and keyboard navigation
    let activeIndex = 0;
    function setActive(i) {
        activeIndex = i;
        const children = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        children.forEach((c, idx) => {
            c.tabIndex = idx === i ? 0 : -1;
            if (idx === i) {
                c.focus();
                c.classList.add('focused');
            } else {
                c.classList.remove('focused');
            }
        });
        menu.setAttribute('data-active-index', String(activeIndex));
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            hideContextMenu();
            cleanup();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((activeIndex + 1) % items.length);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((activeIndex - 1 + items.length) % items.length);
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const el = menu.querySelectorAll('[role="menuitem"]')[activeIndex];
            el && el.click();
        }
    }

    function cleanup() {
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKeyDown);
    }

    const onDocClick = () => {
        hideContextMenu();
        cleanup();
    };

    setTimeout(() => document.addEventListener('click', onDocClick), 0);
    document.addEventListener('keydown', onKeyDown);

    // Set initial active
    setActive(0);
}

function handleNotesPayload(payload) {
    if (!Array.isArray(payload)) {
        return;
    }
    // Keep pinned notes on top, then by updated_at desc, then id desc
    state.notes = payload
        .map(note => ({
            ...note,
            theme_color: normalizeHex(note.theme_color ?? DEFAULT_COLOR),
            opacity: typeof note.opacity === 'number' ? note.opacity : DEFAULT_OPACITY,
        }))
        .sort((a, b) => {
            const pa = Number(Boolean(a.pinned));
            const pb = Number(Boolean(b.pinned));
            if (pb !== pa) return pb - pa; // pinned first
            const ua = Number(a.updated_at ?? 0);
            const ub = Number(b.updated_at ?? 0);
            if (ub !== ua) return ub - ua;
            return (b.id ?? 0) - (a.id ?? 0);
        });

    renderNotes();
}

function bootstrapNotes() {
    if (!window.desktopNotes?.getAllNotes) {
        renderEmptyState();
        return;
    }

    window.desktopNotes
        .getAllNotes()
        .then(handleNotesPayload)
        .catch(error => {
            console.error('Failed to load notes', error);
            renderEmptyState();
        });
}

function subscribeToStreams() {
    if (window.desktopNotes?.onNotesUpdated) {
        window.desktopNotes.onNotesUpdated(handleNotesPayload);
    }
}

function applyShortcutHint() {
    if (!shortcutHintEl || !window.desktopNotes?.getGlobalShortcut) {
        return;
    }

    window.desktopNotes
        .getGlobalShortcut()
        .then(value => {
            if (!value) {
                shortcutHintEl.textContent = '';
                return;
            }
            state.shortcut = value;
            shortcutHintEl.textContent = `Toggle visibility: ${value}`;
        })
        .catch(() => {
            shortcutHintEl.textContent = '';
        });
}

function focusNote(noteId) {
    if (!window.desktopNotes?.focusNoteWindow && !window.desktopNotes?.openNoteWindow) {
        return;
    }
    if (window.desktopNotes?.focusNoteWindow) {
        window.desktopNotes
            .focusNoteWindow(noteId)
            .catch(() => {
                if (window.desktopNotes?.openNoteWindow) {
                    window.desktopNotes.openNoteWindow(noteId).catch(error => {
                        console.error('Failed to open note window', error);
                    });
                }
            });
        return;
    }
    // Fallback if focus is not available
    window.desktopNotes.openNoteWindow(noteId).catch(error => {
        console.error('Failed to open note window', error);
    });
}

function createNote() {
    if (!window.desktopNotes?.createNote) {
        return;
    }

    window.desktopNotes
        .createNote({
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            opacity: DEFAULT_OPACITY,
            theme_color: DEFAULT_COLOR,
            font_family: DEFAULT_FONT,
        })
        .then(created => {
            if (created?.id) {
                focusNote(created.id);
            }
        })
        .catch(error => {
            console.error('Failed to create note', error);
        });
}

function deleteNote(noteId) {
    if (!window.desktopNotes?.deleteNote) {
        return;
    }
    window.desktopNotes
        .deleteNote(noteId)
        .catch(error => console.error('Failed to delete note', error));
}

function hideMainMenu() {
    if (!window.desktopNotes?.hideDashboard) {
        window.close();
        return;
    }
    window.desktopNotes.hideDashboard().catch(error => {
        console.error('Failed to hide main menu', error);
    });
}

function registerUiHandlers() {
    addNoteBtn?.addEventListener('click', event => {
        event.stopPropagation();
        createNote();
    });

    hideMainMenuBtn?.addEventListener('click', event => {
        event.stopPropagation();
        hideMainMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideMainMenu();
        }
    });
}

function initDragZones() {
    if (!mainMenuEl) {
        return;
    }

    mainMenuEl.addEventListener('mousedown', () => {
        mainMenuEl.classList.add('dragging');
    });

    window.addEventListener('mouseup', () => {
        mainMenuEl?.classList.remove('dragging');
    });
}

function init() {
    registerUiHandlers();
    subscribeToStreams();
    bootstrapNotes();
    applyShortcutHint();
    initDragZones();
}

init();
