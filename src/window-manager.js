import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { getAllNotes, getNoteById, createNote, updateNoteBounds } from './utils/database.js';
import { setMainMenuVisibility, setNoteVisibility, removeNote } from './utils/window-state.js';

export const MAIN_MENU_DIMENSION = 320;
export const DEFAULT_NOTE_WIDTH = 320;
export const DEFAULT_NOTE_HEIGHT = 320;
export const MIN_NOTE_WIDTH = 40;
export const MIN_NOTE_HEIGHT = 40;

export let mainMenuWindow = null;
export const noteWindows = new Map();
export let allWindowsHidden = false;

export function getPreloadPath() {
    return path.join(process.cwd(), 'src', 'preload.js');
}

export function resolveHtml(fileName) {
    return path.join(process.cwd(), 'src', fileName);
}

export function applyAlwaysOnTop(window) {
    if (!window || window.isDestroyed()) {
        return;
    }
    window.setAlwaysOnTop(true, 'screen-saver');
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    window.setSkipTaskbar(true);
}

export function clampBoundsToScreen(bounds = {}) {
    const displays = screen.getAllDisplays();
    const fallback = screen.getPrimaryDisplay();
    const target =
        displays.find(display => {
            const { x, y, width, height } = display.workArea;
            const withinX = Number.isFinite(bounds.x) && bounds.x >= x && bounds.x <= x + width;
            const withinY = Number.isFinite(bounds.y) && bounds.y >= y && bounds.y <= y + height;
            return withinX && withinY;
        }) ?? fallback;
    const { x: originX, y: originY, width, height } = target.workArea;
    const desiredWidth = Math.max(
        MIN_NOTE_WIDTH,
        Math.round(Number.isFinite(bounds.width) ? bounds.width : DEFAULT_NOTE_WIDTH),
    );
    const desiredHeight = Math.max(
        MIN_NOTE_HEIGHT,
        Math.round(Number.isFinite(bounds.height) ? bounds.height : DEFAULT_NOTE_HEIGHT),
    );
    const clampedWidth = Math.min(desiredWidth, Math.max(MIN_NOTE_WIDTH, width));
    const clampedHeight = Math.min(desiredHeight, Math.max(MIN_NOTE_HEIGHT, height));
    const desiredX = Math.round(Number.isFinite(bounds.x) ? bounds.x : originX + 48);
    const desiredY = Math.round(Number.isFinite(bounds.y) ? bounds.y : originY + 48);
    const maxX = originX + width - clampedWidth;
    const maxY = originY + height - clampedHeight;
    const clampedX = Math.min(Math.max(desiredX, originX), Math.max(originX, maxX));
    const clampedY = Math.min(Math.max(desiredY, originY), Math.max(originY, maxY));
    return {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
    };
}

export function createMainMenuWindow(options = {}) {
    const { visible = true } = options;
    const window = new BrowserWindow({
        width: MAIN_MENU_DIMENSION,
        height: MAIN_MENU_DIMENSION,
        icon: path.join(process.cwd(), 'src', 'assets', 'logo.ico'),
        resizable: false,
        minimizable: false,
        maximizable: false,
        movable: true,
        frame: false,
        transparent: false,
        hasShadow: false,
        skipTaskbar: true,
        show: false,
        alwaysOnTop: true,
        focusable: true,
        backgroundColor: '#18181a',
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false,
        },
    });
    // Keep reference to the created main menu window so other modules can
    // detect and control it (show/hide/toggle). Previously this function
    // returned the window but did not assign the exported `mainMenuWindow`,
    // which caused the global toggle shortcut to miss the main menu.
    mainMenuWindow = window;
    applyAlwaysOnTop(window);
    window.loadFile(resolveHtml('index.html'));
    // Fallback: if globalShortcut fails to register (platform or permissions),
    // allow the main menu window to listen for the accelerator locally and
    // hide itself when the user presses Ctrl+\ (or Cmd+\ on macOS).
    window.webContents.on('before-input-event', (event, input) => {
        try {
            const ctrlOrCmd = input.control || input.meta;
            // input.key may be the literal backslash character or the 'Backslash'
            // key name depending on platform/keyboard. Check both forms and
            // also inspect input.code for robustness.
            if (
                input.type === 'keyDown' &&
                ctrlOrCmd &&
                (input.key === '\\' || input.key === 'Backslash' || input.code === 'Backslash')
            ) {
                event.preventDefault();
                if (!window.isDestroyed() && window.isVisible()) {
                    window.hide();
                }
            }
        } catch (err) {
            // swallow any unexpected errors from input handling
            console.error('Error processing before-input-event for main menu:', err);
        }
    });
    window.once('ready-to-show', () => {
        sendNotesSnapshot(window);
        if (visible) {
            window.showInactive();
        }
    });
    window.on('show', () => {
        applyAlwaysOnTop(window);
        setMainMenuVisibility(true);
        allWindowsHidden = false;
        sendNotesSnapshot(window);
    });
    window.on('hide', () => {
        setMainMenuVisibility(false);
    });
    window.on('focus', () => applyAlwaysOnTop(window));
    window.on('blur', () => applyAlwaysOnTop(window));
    window.on('closed', () => {
        if (mainMenuWindow === window) {
            mainMenuWindow = null;
        }
        setMainMenuVisibility(false);
    });
    return window;
}

export function createNoteWindow(note) {
    if (!note) {
        return null;
    }
    const existing = noteWindows.get(note.id);
    if (existing && !existing.isDestroyed()) {
        existing.showInactive();
        existing.focus();
        existing.webContents.send('note:data', note);
        setNoteVisibility(note.id, true);
        allWindowsHidden = false;
        return existing;
    }
    const bounds = clampBoundsToScreen({
        x: note.pos_x,
        y: note.pos_y,
        width: note.width,
        height: note.height,
    });
    const window = new BrowserWindow({
        title: 'Desktop Note',
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        minWidth: MIN_NOTE_WIDTH,
        minHeight: MIN_NOTE_HEIGHT,
        resizable: true,
        movable: true,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        closable: true,
        frame: false,
        transparent: true,
        hasShadow: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        acceptFirstMouse: true,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false,
        },
    });
    applyAlwaysOnTop(window);
    window.setMenuBarVisibility(false);
    window.loadFile(resolveHtml('note.html'));
    window.webContents.once('did-finish-load', () => {
        window.webContents.send('note:data', note);
    });
    noteWindows.set(note.id, window);
    setNoteVisibility(note.id, true);
    allWindowsHidden = false;
    let boundsDebounce = null;
    const schedulePersistBounds = () => {
        clearTimeout(boundsDebounce);
        boundsDebounce = setTimeout(() => persistBounds(window, note.id), 160);
    };
    window.on('show', () => {
        setNoteVisibility(note.id, true);
        allWindowsHidden = false;
    });
    window.on('move', schedulePersistBounds);
    window.on('resize', schedulePersistBounds);
    window.on('focus', () => applyAlwaysOnTop(window));
    window.on('blur', () => applyAlwaysOnTop(window));
    window.on('closed', () => {
        noteWindows.delete(note.id);
        setNoteVisibility(note.id, false);
    });
    return window;
}

export function persistBounds(window, noteId) {
    if (!window || window.isDestroyed()) {
        return;
    }
    const [x, y] = window.getPosition();
    const [width, height] = window.getSize();
    const clamped = clampBoundsToScreen({ x, y, width, height });
    const updatedNote = updateNoteBounds(noteId, {
        pos_x: clamped.x,
        pos_y: clamped.y,
        width: clamped.width,
        height: clamped.height,
    });
    broadcastNoteUpdate(updatedNote);
}

export function sendNotesSnapshot(targetWindow = mainMenuWindow) {
    if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.webContents.send('notes:updated', getAllNotes());
    }
}

export function broadcastNoteUpdate(note) {
    if (!note) {
        return;
    }
    const noteWindow = noteWindows.get(note.id);
    if (noteWindow && !noteWindow.isDestroyed()) {
        noteWindow.webContents.send('note:data', note);
    }
    sendNotesSnapshot();
}

export function notifyNoteDeleted(noteId) {
    const noteWindow = noteWindows.get(noteId);
    if (noteWindow && !noteWindow.isDestroyed()) {
        noteWindow.webContents.send('note:deleted', noteId);
        setTimeout(() => {
            if (!noteWindow.isDestroyed()) {
                noteWindow.close();
            }
        }, 80);
    }
    noteWindows.delete(noteId);
    setNoteVisibility(noteId, false);
    removeNote(noteId);
    sendNotesSnapshot();
}

export function managedWindows() {
    const windows = [];
    if (mainMenuWindow && !mainMenuWindow.isDestroyed()) {
        windows.push(mainMenuWindow);
    }
    for (const win of noteWindows.values()) {
        if (win && !win.isDestroyed()) {
            windows.push(win);
        }
    }
    return windows;
}

export function toggleAllWindows() {
    const windows = managedWindows();
    if (windows.length === 0) {
        return;
    }
    const notes = windows.filter(w => w !== mainMenuWindow);
    const mainMenuVisible = mainMenuWindow && !mainMenuWindow.isDestroyed() && mainMenuWindow.isVisible();
    if (allWindowsHidden) {
        // Show notes
        notes.forEach(win => {
            if (!win || win.isDestroyed()) {
                return;
            }
            if (!win.isVisible()) {
                if (process.platform === 'darwin') {
                    win.show();
                } else {
                    win.showInactive();
                }
            }
            applyAlwaysOnTop(win);
        });
        // Don't show overlay if it was hidden
        allWindowsHidden = false;
    } else {
        // Hide all
        windows.forEach(win => {
            if (!win || win.isDestroyed()) {
                return;
            }
            win.hide();
        });
        allWindowsHidden = true;
    }
}

export function showMainMenu() {
    if (!mainMenuWindow || mainMenuWindow.isDestroyed()) {
        mainMenuWindow = createMainMenuWindow({ visible: true });
        return true;
    }
    mainMenuWindow.showInactive();
    mainMenuWindow.focus();
    applyAlwaysOnTop(mainMenuWindow);
    sendNotesSnapshot(mainMenuWindow);
    allWindowsHidden = false;
    return true;
}

export function duplicateNote(noteId) {
    const source = getNoteById(noteId);
    if (!source) {
        return null;
    }
    const duplicate = createNote({
        content: source.content,
        pos_x: (source.pos_x ?? 120) + 36,
        pos_y: (source.pos_y ?? 120) + 36,
        width: source.width,
        height: source.height,
        opacity: source.opacity,
        theme_color: source.theme_color,
        font_family: source.font_family,
        theme: source.theme,
    });
    const clampedBounds = clampBoundsToScreen({
        x: duplicate.pos_x,
        y: duplicate.pos_y,
        width: duplicate.width,
        height: duplicate.height,
    });
    updateNoteBounds(duplicate.id, clampedBounds);
    const hydrated = getNoteById(duplicate.id);
    createNoteWindow(hydrated);
    broadcastNoteUpdate(hydrated);
    return hydrated;
}
