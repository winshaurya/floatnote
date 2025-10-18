export const DEFAULT_COLOR = '#2B2B2B';
export const DEFAULT_OPACITY = 0.92;
export const DEFAULT_FONT = 'BBH Sans Hegartly';

export function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

export function clampOpacity(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return DEFAULT_OPACITY;
    }
    return Math.min(1, Math.max(0.1, numeric));
}

export function normalizeHex(color) {
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

export function hexToRgb(hex) {
    const sanitized = normalizeHex(hex).replace('#', '');
    const intVal = Number.parseInt(sanitized, 16);
    return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255,
    };
}

export function hexToRgba(hex, alpha = 1) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getReadableTextColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const toLinear = channel => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return luminance > 0.55 ? '#111113' : '#F7F8FA';
}

export function applySurfaceStyles(noteSurface, noteContent, modalContent, note) {
    if (!noteSurface) {
        return;
    }
    const color = normalizeHex(note?.theme_color ?? DEFAULT_COLOR);
    const opacity = clampOpacity(note?.opacity ?? DEFAULT_OPACITY);
    const theme = note?.theme ?? 'glass';
    const readable = getReadableTextColor(color);

    // Remove existing theme classes
    noteSurface.classList.remove('glass', 'matte', 'none');
    noteSurface.classList.add(theme);

    if (theme === 'glass') {
        // Fluid glass effect handled entirely by CSS
    } else if (theme === 'matte') {
        noteSurface.style.setProperty('--solid-background', hexToRgba(color, opacity));
        noteSurface.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`;
    } else if (theme === 'none') {
        noteSurface.style.backgroundColor = 'transparent';
        noteSurface.style.boxShadow = 'none';
    }

    noteSurface.style.color = readable;

    document.body.style.backgroundColor = 'transparent';
    document.body.style.color = readable;

    if (noteContent) {
        noteContent.style.color = readable;
        noteContent.style.setProperty('--placeholder-color', hexToRgba(color, 0.22));
    }

    // Update modal background based on theme
    if (modalContent) {
        modalContent.classList.remove('glass', 'matte', 'none');
        modalContent.classList.add(theme);
        if (theme === 'matte') {
            modalContent.style.setProperty('--modal-background', hexToRgba(color, 0.9));
        }
    }
}

export function applyFont(noteContent, fontFamily) {
    const resolved = fontFamily && typeof fontFamily === 'string' ? fontFamily : DEFAULT_FONT;
    if (noteContent) {
        noteContent.style.fontFamily = resolved;
    }
    document.body.style.fontFamily = resolved;
}

export function applyNote(noteSurface, noteContent, modalContent, note) {
    if (!note) {
        return;
    }

    if (noteContent) {
        const nextValue = note.content ?? '';
        if (noteContent.value !== nextValue) {
            noteContent.value = nextValue;
        }
        if (typeof note.font_size === 'number') {
            noteContent.style.fontSize = `${note.font_size}px`;
        }
    }

    applySurfaceStyles(noteSurface, noteContent, modalContent, note);
    applyFont(noteContent, note.font_family ?? DEFAULT_FONT);
}
