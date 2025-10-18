import fs from 'node:fs';
import path from 'node:path';

let storePath = null;
let store = {
    mainMenuVisible: true,
    noteVisibility: {},
};

function defaultStore() {
    return {
        mainMenuVisible: true,
        noteVisibility: {},
    };
}

function normaliseStore(raw) {
    if (!raw || typeof raw !== 'object') {
        return defaultStore();
    }

    const mainMenuVisible = typeof raw.mainMenuVisible === 'boolean' ? raw.mainMenuVisible : true;
    const noteVisibility = {};

    if (raw.noteVisibility && typeof raw.noteVisibility === 'object') {
        for (const [key, visible] of Object.entries(raw.noteVisibility)) {
            const id = Number(key);
            if (Number.isFinite(id) && visible) {
                noteVisibility[id] = true;
            }
        }
    }

    return {
        mainMenuVisible,
        noteVisibility,
    };
}

function readStore() {
    if (!storePath) {
        return defaultStore();
    }

    if (!fs.existsSync(storePath)) {
        return defaultStore();
    }

    try {
        const raw = fs.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw);
        return normaliseStore(parsed);
    } catch (error) {
        console.warn('[window-state] Failed to read persisted state, using defaults:', error);
        return defaultStore();
    }
}

function persist() {
    if (!storePath) {
        return;
    }

    try {
        fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    } catch (error) {
        console.error('[window-state] Failed to persist state:', error);
    }
}

export function setupWindowStateStore(baseDir) {
    if (!baseDir) {
        throw new Error('Base directory is required to initialise window state store');
    }

    storePath = path.join(baseDir, 'window-state.json');
    store = readStore();
    persist();
}

export function getVisibleNoteIds() {
    return new Set(
        Object.keys(store.noteVisibility)
            .map(key => Number(key))
            .filter(id => Number.isFinite(id) && store.noteVisibility[id]),
    );
}

export function wasMainMenuVisible() {
    return !!store.mainMenuVisible;
}

export function setMainMenuVisibility(visible) {
    store.mainMenuVisible = !!visible;
    persist();
}

export function setNoteVisibility(noteId, visible) {
    const id = Number(noteId);
    if (!Number.isFinite(id)) {
        return;
    }

    if (visible) {
        store.noteVisibility[id] = true;
    } else {
        delete store.noteVisibility[id];
    }
    persist();
}

export function removeNote(noteId) {
    const id = Number(noteId);
    if (!Number.isFinite(id)) {
        return;
    }
    delete store.noteVisibility[id];
    persist();
}
