const { contextBridge, ipcRenderer } = require('electron');

function createSubscription(channel, transformer) {
    return callback => {
        if (typeof callback !== 'function') {
            return () => {};
        }

        const handler = (_event, payload) => {
            try {
                callback(transformer ? transformer(payload) : payload);
            } catch (error) {
                console.error(`Error in ${channel} subscription callback:`, error);
            }
        };

        ipcRenderer.on(channel, handler);
        return () => ipcRenderer.removeListener(channel, handler);
    };
}

contextBridge.exposeInMainWorld('desktopNotes', {
    getAllNotes: () => ipcRenderer.invoke('notes:getAll'),
    createNote: overrides => ipcRenderer.invoke('notes:create', overrides ?? {}),
    duplicateNote: noteId => ipcRenderer.invoke('notes:duplicate', noteId),
    deleteNote: noteId => ipcRenderer.invoke('notes:delete', noteId),
    updateNoteContent: (noteId, content) =>
        ipcRenderer.invoke('notes:updateContent', { id: noteId, content }),
    updateNoteBounds: (noteId, bounds) =>
        ipcRenderer.invoke('notes:updateBounds', { id: noteId, bounds }),
    updateNoteThemeColor: (noteId, themeColor) =>
        ipcRenderer.invoke('notes:updateThemeColor', { id: noteId, themeColor }),
    updateNoteTheme: (noteId, theme) =>
        ipcRenderer.invoke('notes:updateTheme', { id: noteId, theme }),
    updateNoteOpacity: (noteId, opacity) =>
        ipcRenderer.invoke('notes:updateOpacity', { id: noteId, opacity }),
    updateNoteFont: (noteId, fontFamily) =>
        ipcRenderer.invoke('notes:updateFont', { id: noteId, fontFamily }),
    updateNoteFontSize: (noteId, fontSize) =>
        ipcRenderer.invoke('notes:updateFontSize', { id: noteId, fontSize }),
    setNoteResizable: (noteId, resizable) =>
        ipcRenderer.invoke('notes:setResizable', { id: noteId, resizable }),
    openNoteWindow: noteId => ipcRenderer.invoke('notes:openWindow', noteId),
    focusNoteWindow: noteId => ipcRenderer.invoke('notes:focusWindow', noteId),
    toggleAllWindows: () => ipcRenderer.invoke('app:toggle-windows'),
    showDashboard: () => ipcRenderer.invoke('app:show-dashboard'),
    hideDashboard: () => ipcRenderer.invoke('app:hide-dashboard'),
    getGlobalShortcut: () => ipcRenderer.invoke('app:get-shortcut'),

    // Window position helpers for renderer drag support
    getWindowPosition: () => ipcRenderer.invoke('window:get-position'),
    setWindowPosition: (x, y) => ipcRenderer.invoke('window:set-position', x, y),

    // Pin / unpin notes
    setNotePinned: (noteId, pinned) => ipcRenderer.invoke('notes:setPinned', { id: noteId, pinned }),

    onNotesUpdated: createSubscription('notes:updated'),
    onNoteData: createSubscription('note:data'),
    onNoteDeleted: createSubscription('note:deleted'),
});
