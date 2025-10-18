import { ipcMain, BrowserWindow } from 'electron';
import { getAllNotes, getNoteById, createNote, updateNoteContent, updateNoteBounds, updateNoteThemeColor, updateNoteTheme, updateNoteOpacity, updateNoteFont, updateNoteFontSize, updateNotePinned, deleteNote } from './utils/database.js';
import { noteWindows, mainMenuWindow, allWindowsHidden, sendNotesSnapshot, broadcastNoteUpdate, notifyNoteDeleted, createNoteWindow, duplicateNote, showMainMenu, toggleAllWindows, clampBoundsToScreen, applyAlwaysOnTop } from './window-manager.js';

export function setupIpcHandlers() {
    ipcMain.handle('notes:getAll', () => getAllNotes());
    ipcMain.handle('notes:create', (_event, overrides = {}) => {
        const note = createNote(overrides);
        createNoteWindow(note);
        broadcastNoteUpdate(note);
        return note;
    });
    ipcMain.handle('notes:duplicate', (_event, noteId) => duplicateNote(noteId));
    ipcMain.handle('notes:delete', (_event, noteId) => {
        const deleted = deleteNote(noteId);
        if (deleted) {
            notifyNoteDeleted(noteId);
        }
        return { success: deleted };
    });
    ipcMain.handle('notes:updateContent', (_event, payload) => {
        const { id, content } = payload ?? {};
        if (!id) {
            return null;
        }
        const updatedNote = updateNoteContent(id, content ?? '');
        broadcastNoteUpdate(updatedNote);
        return updatedNote;
    });
    ipcMain.handle('notes:updateBounds', (_event, payload) => {
        const { id, bounds } = payload ?? {};
        if (!id || !bounds) {
            return null;
        }
        const win = noteWindows.get(id);
        const clamped = clampBoundsToScreen(bounds);
        if (win && !win.isDestroyed()) {
            win.setBounds({
                x: clamped.x,
                y: clamped.y,
                width: clamped.width,
                height: clamped.height,
            });
        }
        const updatedNote = updateNoteBounds(id, clamped);
        broadcastNoteUpdate(updatedNote);
        return updatedNote;
    });
    ipcMain.handle('notes:updateThemeColor', (_event, payload) => {
        const { id, themeColor } = payload ?? {};
        if (!id) {
            return null;
        }
        const updatedNote = updateNoteThemeColor(id, themeColor);
        broadcastNoteUpdate(updatedNote);
        return updatedNote;
    });
    ipcMain.handle('notes:updateTheme', (_event, payload) => {
        const { id, theme } = payload ?? {};
        if (!id) {
            return null;
        }
        const updatedNote = updateNoteTheme(id, theme);
        broadcastNoteUpdate(updatedNote);
        return updatedNote;
    });
    ipcMain.handle('notes:updateOpacity', (_event, payload) => {
        const { id, opacity } = payload ?? {};
        if (!id) {
            return null;
        }
        const updatedNote = updateNoteOpacity(id, opacity);
        broadcastNoteUpdate(updatedNote);
        return updatedNote;
    });
    ipcMain.handle('notes:updateFont', (_event, payload) => {
        const { id, fontFamily } = payload ?? {};
        if (!id) {
            return null;
        }
        const updatedNote = updateNoteFont(id, fontFamily);
        broadcastNoteUpdate(updatedNote);
        return updatedNote;
    });
    ipcMain.handle('notes:updateFontSize', (_event, payload) => {
        const { id, fontSize } = payload ?? {};
        if (!id) {
            return null;
        }
        const updatedNote = updateNoteFontSize(id, fontSize);
        broadcastNoteUpdate(updatedNote);
        return updatedNote;
    });

    ipcMain.handle('notes:setPinned', (_event, payload) => {
        const { id, pinned } = payload ?? {};
        if (!id) {
            return null;
        }
        try {
            const updatedNote = updateNotePinned(id, pinned);
            broadcastNoteUpdate(updatedNote);
            return updatedNote;
        } catch (err) {
            console.error('Failed to set pinned state', err);
            return null;
        }
    });
    ipcMain.handle('notes:setResizable', (_event, payload) => {
        const { id, resizable } = payload ?? {};
        if (!id) {
            return { success: false };
        }
        const win = noteWindows.get(id);
        if (!win || win.isDestroyed()) {
            return { success: false };
        }
        try {
            win.setResizable(Boolean(resizable));
            return { success: true };
        } catch (err) {
            console.error('Failed to set resizable on note window', err);
            return { success: false };
        }
    });
    ipcMain.handle('notes:openWindow', (_event, noteId) => {
        const note = getNoteById(noteId);
        if (note) {
            createNoteWindow(note);
        }
        return note;
    });
    ipcMain.handle('notes:focusWindow', (_event, noteId) => {
        const win = noteWindows.get(noteId);
        if (win && !win.isDestroyed()) {
            if (!win.isVisible()) {
                win.showInactive();
            }
            win.focus();
            applyAlwaysOnTop(win);
            return { success: true };
        }
        const note = getNoteById(noteId);
        if (note) {
            createNoteWindow(note);
            return { success: true };
        }
        return { success: false };
    });
    ipcMain.handle('app:toggle-windows', () => {
        toggleAllWindows();
        return { hidden: allWindowsHidden };
    });
    ipcMain.handle('app:show-dashboard', () => ({ success: showMainMenu() }));
    ipcMain.handle('app:hide-dashboard', () => {
        if (mainMenuWindow && !mainMenuWindow.isDestroyed()) {
            mainMenuWindow.hide();
            return { success: true };
        }
        return { success: false };
    });
    ipcMain.handle('app:get-shortcut', () => (process.platform === 'darwin' ? 'Cmd+\\' : 'Ctrl+\\'));

    // Window position helpers for renderer drag support
    ipcMain.handle('window:get-position', event => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (!win) return [0, 0];
            return win.getPosition();
        } catch (err) {
            console.error('Failed to get window position', err);
            return [0, 0];
        }
    });

    ipcMain.handle('window:set-position', (event, x, y) => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (!win) return { success: false };
            win.setPosition(Number(x) || 0, Number(y) || 0);
            return { success: true };
        } catch (err) {
            console.error('Failed to set window position', err);
            return { success: false };
        }
    });
}
