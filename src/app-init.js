import path from 'node:path';
import { app, globalShortcut } from 'electron';
import { initializeDatabase, getAllNotes, getNoteById, createNote, updateNoteBounds } from './utils/database.js';
import { setupWindowStateStore, getVisibleNoteIds, removeNote, setNoteVisibility } from './utils/window-state.js';
import { mainMenuWindow, noteWindows, createMainMenuWindow, createNoteWindow, showMainMenu, broadcastNoteUpdate, toggleAllWindows } from './window-manager.js';
import { setupIpcHandlers } from './ipc-handlers.js';

export function registerGlobalShortcut() {
    globalShortcut.unregisterAll();
    const accelerator = process.platform === 'darwin' ? 'Cmd+\\' : 'Ctrl+\\';
    const registered = globalShortcut.register(accelerator, () => {
        toggleAllWindows();
    });
    if (!registered) {
        console.warn(`Failed to register global shortcut: ${accelerator}`);
    }
}

app.whenReady().then(() => {
    app.setAppUserModelId('com.sohzm.desktopnotes');
    const userDataPath = path.join(app.getPath('userData'), 'notes');
    initializeDatabase(userDataPath);
    setupWindowStateStore(userDataPath);
    setupIpcHandlers();
    createMainMenuWindow({ visible: true });
    registerGlobalShortcut();
    const existingNotes = getAllNotes();
    const visibleNoteIds = getVisibleNoteIds();
    const existingNoteIds = new Set(existingNotes.map(note => note.id));
    for (const id of visibleNoteIds) {
        if (!existingNoteIds.has(id)) {
            removeNote(id);
        }
    }
    existingNotes.forEach(note => {
        if (visibleNoteIds.has(note.id)) {
            createNoteWindow(note);
        } else {
            setNoteVisibility(note.id, false);
        }
    });
    app.on('activate', () => {
        showMainMenu();
    });
});

app.on('browser-window-created', (_event, window) => {
    window.setMenu(null);
    window.setMenuBarVisibility(false);
    window.setSkipTaskbar(true);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
