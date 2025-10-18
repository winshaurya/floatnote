import { DEFAULT_COLOR, DEFAULT_OPACITY, DEFAULT_FONT, ensureArray, clampOpacity, normalizeHex, hexToRgb, hexToRgba, getReadableTextColor, applySurfaceStyles, applyFont, applyNote } from './note-ui.js';

const noteSurface = document.getElementById('note-surface');
const noteContent = document.getElementById('note-content');
const dragHandle = document.getElementById('drag-handle');
const settingsBtn = document.getElementById('settings-btn');
const closeBtn = document.getElementById('close-btn');

const settingsModal = document.getElementById('settings-modal');
const modalContent = settingsModal?.querySelector('.modal-content');
const modalColorPicker = document.getElementById('modal-color-picker');
const modalFontPicker = document.getElementById('modal-font-picker');
const modalOpacity = document.getElementById('modal-opacity');
const modalFontSize = document.getElementById('modal-font-size');
const themeOptions = document.querySelectorAll('.theme-option');
const modalShowMainMenuBtn = document.getElementById('modal-show-main-menu');
const modalDuplicateBtn = document.getElementById('modal-duplicate');
const modalDeleteBtn = document.getElementById('modal-delete');
const modalSaveBtn = document.getElementById('modal-save');
const modalCloseBtn = document.getElementById('modal-close');

let activeNote = null;
let contentDebounce = null;
let forcedDrag = false;
let dragActive = false;
let dragOffset = { x: 0, y: 0 };

// Swipe variables for settings modal
let isSwiping = false;
let swipeStartY = 0;
let swipeCurrentY = 0;

function applyActiveNote(note) {
    activeNote = note ? { ...note } : null;
    if (!activeNote) {
        return;
    }

    applyNote(noteSurface, noteContent, modalContent, activeNote);
}

function flushContentUpdate(value) {
    if (!activeNote?.id || !window.desktopNotes?.updateNoteContent) {
        return;
    }
    window.desktopNotes
        .updateNoteContent(activeNote.id, value ?? '')
        .catch(error => console.error('Failed to update note content', error));
}

function handleContentChange(event) {
    if (!activeNote) {
        return;
    }
    const value = typeof event.target.value === 'string' ? event.target.value : '';
    activeNote.content = value;
    clearTimeout(contentDebounce);
    contentDebounce = setTimeout(() => flushContentUpdate(value), 180);
}

function handleColorChange(event) {
    if (!activeNote?.id || !window.desktopNotes?.updateNoteThemeColor) {
        return;
    }
    const color = normalizeHex(event.target.value);
    activeNote.theme_color = color;
    applySurfaceStyles(noteSurface, noteContent, modalContent, activeNote);
    window.desktopNotes
        .updateNoteThemeColor(activeNote.id, color)
        .catch(error => console.error('Failed to update note color', error));
}

function handleFontChange(event) {
    if (!activeNote?.id || !window.desktopNotes?.updateNoteFont) {
        return;
    }
    const font = typeof event.target.value === 'string' && event.target.value.trim().length > 0
        ? event.target.value.trim()
        : DEFAULT_FONT;
    activeNote.font_family = font;
    applyFont(noteContent, font);
    window.desktopNotes
        .updateNoteFont(activeNote.id, font)
        .catch(error => console.error('Failed to update note font', error));
}

function handleDuplicate() {
    if (!activeNote?.id || !window.desktopNotes?.duplicateNote) {
        return;
    }
    window.desktopNotes
        .duplicateNote(activeNote.id)
        .catch(error => console.error('Failed to duplicate note', error));
}

function handleDelete() {
    if (!activeNote?.id || !window.desktopNotes?.deleteNote) {
        return;
    }
    window.desktopNotes
        .deleteNote(activeNote.id)
        .catch(error => console.error('Failed to delete note', error));
}

function handleClose() {
    window.close();
}

function showModal() {
    if (!settingsModal) {
        return;
    }
    settingsModal.classList.add('show');
    // Populate modal with current values
    if (modalColorPicker && activeNote) {
        modalColorPicker.value = normalizeHex(activeNote.theme_color);
    }
    if (modalFontPicker && activeNote) {
        modalFontPicker.value = activeNote.font_family ?? DEFAULT_FONT;
    }
    if (modalFontSize && activeNote) {
        modalFontSize.value = activeNote.font_size ?? 15;
    }
    if (modalOpacity && activeNote) {
        modalOpacity.value = activeNote.opacity ?? DEFAULT_OPACITY;
    }
    if (themeOptions && activeNote) {
        themeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.theme === (activeNote.theme ?? 'glass'));
        });
    }
}

function hideModal() {
    if (!settingsModal) {
        return;
    }
    settingsModal.classList.remove('show');
    // Reset swipe transform
    if (modalContent) {
        modalContent.style.transform = '';
    }
    isSwiping = false;
}

function handleModalColorChange(event) {
    const color = normalizeHex(event.target.value);
    if (modalColorPicker) {
        modalColorPicker.value = color;
    }
    if (activeNote) {
        activeNote.theme_color = color;
        applySurfaceStyles(noteSurface, noteContent, modalContent, activeNote);
    }
}

function handleModalFontChange(event) {
    const font = event.target.value;
    if (modalFontPicker) {
        modalFontPicker.value = font;
    }
    if (activeNote) {
        activeNote.font_family = font;
        applyFont(noteContent, font);
    }
}

function handleModalOpacityChange(event) {
    const opacity = parseFloat(event.target.value);
    if (modalOpacity) {
        modalOpacity.value = opacity;
    }
    if (activeNote) {
        activeNote.opacity = opacity;
        applySurfaceStyles(noteSurface, noteContent, modalContent, activeNote);
    }
}

function handleModalFontSizeChange(event) {
    const fontSize = parseInt(event.target.value, 10);
    if (modalFontSize) {
        modalFontSize.value = fontSize;
    }
    if (activeNote && noteContent) {
        activeNote.font_size = fontSize;
        noteContent.style.fontSize = `${fontSize}px`;
    }
}

function handleThemeChange(event) {
    const theme = event.target.dataset.theme;
    if (!theme) {
        return;
    }
    themeOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.theme === theme);
    });
}

function handleModalSave() {
    if (!activeNote?.id) {
        return;
    }

    const newColor = modalColorPicker?.value ? normalizeHex(modalColorPicker.value) : activeNote.theme_color;
    const newFont = modalFontPicker?.value || activeNote.font_family;
    const newFontSize = parseInt(modalFontSize?.value, 10) || activeNote.font_size || 15;
    const newOpacity = parseFloat(modalOpacity?.value) || activeNote.opacity;
    const newTheme = Array.from(themeOptions).find(option => option.classList.contains('selected'))?.dataset.theme || activeNote.theme;

    // Update activeNote
    activeNote.theme_color = newColor;
    activeNote.font_family = newFont;
    activeNote.font_size = newFontSize;
    activeNote.opacity = newOpacity;
    activeNote.theme = newTheme;

    // Apply changes
    applySurfaceStyles(noteSurface, noteContent, modalContent, activeNote);
    applyFont(noteContent, newFont);
    if (noteContent) {
        noteContent.style.fontSize = `${newFontSize}px`;
    }

    // Persist changes
    if (window.desktopNotes?.updateNoteThemeColor) {
        window.desktopNotes.updateNoteThemeColor(activeNote.id, newColor).catch(error => console.error('Failed to update note color', error));
    }
    if (window.desktopNotes?.updateNoteFont) {
        window.desktopNotes.updateNoteFont(activeNote.id, newFont).catch(error => console.error('Failed to update note font', error));
    }
    if (window.desktopNotes?.updateNoteFontSize) {
        window.desktopNotes.updateNoteFontSize(activeNote.id, newFontSize).catch(error => console.error('Failed to update note font size', error));
    }
    if (window.desktopNotes?.updateNoteOpacity) {
        window.desktopNotes.updateNoteOpacity(activeNote.id, newOpacity).catch(error => console.error('Failed to update note opacity', error));
    }
    if (window.desktopNotes?.updateNoteTheme) {
        window.desktopNotes.updateNoteTheme(activeNote.id, newTheme).catch(error => console.error('Failed to update note theme', error));
    }

    hideModal();
}

function handleModalDuplicate() {
    handleDuplicate();
    hideModal();
}

function handleModalDelete() {
    handleDelete();
    hideModal();
}

function handleModalShowMainMenu() {
    if (!window.desktopNotes?.showDashboard) {
        return;
    }
    window.desktopNotes.showDashboard().catch(error => console.error('Failed to show main menu', error));
    hideModal();
}

function handleSwipeStart(event) {
    if (!modalContent || !settingsModal?.classList.contains('show')) return;
    isSwiping = true;
    swipeStartY = event.clientY;
    swipeCurrentY = event.clientY;
    modalContent.style.transition = 'none'; // Disable transition during drag
}

function handleSwipeMove(event) {
    if (!isSwiping || !modalContent) return;
    swipeCurrentY = event.clientY;
    const deltaY = swipeCurrentY - swipeStartY;
    if (deltaY > 0) { // Only allow downward swipe
        const translateY = Math.min(deltaY, 200); // Limit the drag
        modalContent.style.transform = `translateY(${translateY}px)`;
    }
}

function handleSwipeEnd() {
    if (!isSwiping || !modalContent) return;
    isSwiping = false;
    modalContent.style.transition = ''; // Re-enable transition
    const deltaY = swipeCurrentY - swipeStartY;
    if (deltaY > 100) { // If dragged down more than 100px, close
        hideModal();
    } else {
        modalContent.style.transform = ''; // Snap back
    }
}

function engageForcedDrag() {
    if (forcedDrag || !noteSurface) {
        return;
    }
    forcedDrag = true;
    noteSurface.classList.add('force-drag');
    document.body.classList.add('force-drag');
    if (noteContent) {
        noteContent.blur();
    }
    if (activeNote?.id && window.desktopNotes?.focusNoteWindow) {
        window.desktopNotes.focusNoteWindow(activeNote.id).catch(() => {});
    }
}

function releaseForcedDrag() {
    if (!forcedDrag || !noteSurface) {
        return;
    }
    forcedDrag = false;
    noteSurface.classList.remove('force-drag');
    document.body.classList.remove('force-drag');
}

function bindDrag() {
    if (!dragHandle || !noteSurface) {
        return;
    }

    let isDragging = false;
    let startX, startY, startWinX, startWinY;

    dragHandle.addEventListener('pointerdown', async event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();

        isDragging = true;
        startX = event.screenX;
        startY = event.screenY;
        [startWinX, startWinY] = await window.desktopNotes.getWindowPosition().catch(() => [0, 0]);

        // Engage forced drag for better UX
        engageForcedDrag();

        if (activeNote?.id && window.desktopNotes?.setNoteResizable) {
            window.desktopNotes.setNoteResizable(activeNote.id, false).catch(() => {});
        }
    });

    window.addEventListener('pointermove', event => {
        if (!isDragging) return;

        const deltaX = event.screenX - startX;
        const deltaY = event.screenY - startY;
        window.desktopNotes.setWindowPosition(startWinX + deltaX, startWinY + deltaY).catch(() => {});
    });

    window.addEventListener('pointerup', () => {
        if (isDragging) {
            isDragging = false;
            releaseForcedDrag();
            if (activeNote?.id && window.desktopNotes?.setNoteResizable) {
                window.desktopNotes.setNoteResizable(activeNote.id, true).catch(() => {});
            }
        }
    });

    window.addEventListener('pointercancel', () => {
        if (isDragging) {
            isDragging = false;
            releaseForcedDrag();
            if (activeNote?.id && window.desktopNotes?.setNoteResizable) {
                window.desktopNotes.setNoteResizable(activeNote.id, true).catch(() => {});
            }
        }
    });

    noteContent?.addEventListener('focus', () => {
        releaseForcedDrag();
    });

    noteContent?.addEventListener('blur', () => {
        releaseForcedDrag();
    });
}

function subscribeToIpc() {
    if (!window.desktopNotes) {
        return;
    }

    if (window.desktopNotes.onNoteData) {
        window.desktopNotes.onNoteData(note => {
            if (activeNote?.id === note?.id || !activeNote) {
                applyActiveNote(note);
            }
        });
    }

    if (window.desktopNotes.onNoteDeleted) {
        window.desktopNotes.onNoteDeleted(noteId => {
            if (activeNote?.id === noteId) {
                window.close();
            }
        });
    }
}

function registerUiHandlers() {
    noteContent?.addEventListener('input', handleContentChange);
    settingsBtn?.addEventListener('click', showModal);
    closeBtn?.addEventListener('click', handleClose);

    // Modal handlers
    modalColorPicker?.addEventListener('input', handleModalColorChange);
    modalFontPicker?.addEventListener('change', handleModalFontChange);
    modalOpacity?.addEventListener('input', handleModalOpacityChange);
    modalFontSize?.addEventListener('input', handleModalFontSizeChange);
    themeOptions?.forEach(option => option.addEventListener('click', handleThemeChange));
    modalShowMainMenuBtn?.addEventListener('click', handleModalShowMainMenu);
    modalDuplicateBtn?.addEventListener('click', handleModalDuplicate);
    modalDeleteBtn?.addEventListener('click', handleModalDelete);
    modalSaveBtn?.addEventListener('click', handleModalSave);
    modalCloseBtn?.addEventListener('click', hideModal);
    settingsModal?.addEventListener('click', event => {
        if (event.target === settingsModal) {
            hideModal();
        }
    });

    // Swipe handlers for modal content
    if (modalContent) {
        modalContent.addEventListener('pointerdown', handleSwipeStart);
        window.addEventListener('pointermove', handleSwipeMove);
        window.addEventListener('pointerup', handleSwipeEnd);
        window.addEventListener('pointercancel', handleSwipeEnd);
    }

    window.addEventListener('blur', () => {
        releaseForcedDrag();
    });

    // Keyboard shortcuts for font size
    window.addEventListener('keydown', event => {
        if (!activeNote?.id) return;
        if (event.ctrlKey && !event.shiftKey && !event.altKey) {
            if (event.key === '=' || event.key === '+') {
                // Ctrl + = or Ctrl + +
                event.preventDefault();
                const nextSize = Math.min((activeNote.font_size || 15) + 1, 48);
                if (window.desktopNotes?.updateNoteFontSize) {
                    window.desktopNotes.updateNoteFontSize(activeNote.id, nextSize).then(() => {
                        if (noteContent) noteContent.style.fontSize = `${nextSize}px`;
                    });
                }
            } else if (event.key === '-' || event.key === '_') {
                // Ctrl + -
                event.preventDefault();
                const nextSize = Math.max((activeNote.font_size || 15) - 1, 10);
                if (window.desktopNotes?.updateNoteFontSize) {
                    window.desktopNotes.updateNoteFontSize(activeNote.id, nextSize).then(() => {
                        if (noteContent) noteContent.style.fontSize = `${nextSize}px`;
                    });
                }
            }
        }
    });
}

function init() {
    registerUiHandlers();
    bindDrag();
    subscribeToIpc();
}

init();
