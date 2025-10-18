export const SCHEMA_VERSION = 1;

export const NOTE_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT DEFAULT '',
    pos_x INTEGER DEFAULT 120,
    pos_y INTEGER DEFAULT 120,
    width INTEGER DEFAULT 320,
    height INTEGER DEFAULT 320,
    opacity REAL DEFAULT 0.92,
    theme_color TEXT DEFAULT '#2B2B2B',
    font_family TEXT DEFAULT 'BBH Sans Hegartly',
    font_size INTEGER DEFAULT 15,
    theme TEXT DEFAULT 'glass',
    created_at INTEGER DEFAULT (strftime('%s','now')),
    updated_at INTEGER DEFAULT (strftime('%s','now'))
)
`;

export const MIGRATION_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL,
    applied_at INTEGER DEFAULT (strftime('%s','now'))
)
`;

export const DEFAULT_FONT = 'BBH Sans Hegartly';
export const DEFAULT_FONT_SIZE = 15;
export const DEFAULT_COLOR = '#2B2B2B';
export const DEFAULT_WIDTH = 320;
export const DEFAULT_HEIGHT = 320;
export const MIN_WIDTH = 80;
export const MIN_HEIGHT = 80;

export function clampOpacity(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return 0.92;
    }
    return Math.min(1, Math.max(0.1, numeric));
}

export function clampDimension(value, fallback, minValue) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }
    return Math.max(minValue, Math.round(numeric));
}

export function normalizeFontFamily(font) {
    if (typeof font !== 'string') {
        return DEFAULT_FONT;
    }
    const trimmed = font.trim();
    if (!trimmed) {
        return DEFAULT_FONT;
    }
    return trimmed.slice(0, 120);
}

export function clampFontSize(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return DEFAULT_FONT_SIZE;
    }
    return Math.min(48, Math.max(10, Math.round(numeric)));
}

export function normalizeColor(color) {
    if (typeof color !== 'string') {
        return DEFAULT_COLOR;
    }
    const trimmed = color.trim();
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(trimmed)) {
        return DEFAULT_COLOR;
    }
    return trimmed.toUpperCase();
}

export function normalizeTheme(theme) {
    const validThemes = ['none', 'glass', 'matte'];
    if (typeof theme === 'string' && validThemes.includes(theme)) {
        return theme;
    }
    return 'glass';
}

export function mapNoteRow(row) {
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        content: row.content ?? '',
        pos_x: Number.isFinite(row.pos_x) ? row.pos_x : 120,
        pos_y: Number.isFinite(row.pos_y) ? row.pos_y : 120,
        width: Number.isFinite(row.width) ? row.width : DEFAULT_WIDTH,
        height: Number.isFinite(row.height) ? row.height : DEFAULT_HEIGHT,
        opacity: typeof row.opacity === 'number' ? clampOpacity(row.opacity) : 0.92,
        theme_color: row.theme_color ?? DEFAULT_COLOR,
        font_family: row.font_family ?? DEFAULT_FONT,
        font_size: Number.isFinite(row.font_size) ? row.font_size : DEFAULT_FONT_SIZE,
        theme: normalizeTheme(row.theme),
        // normalize pinned flag (0/1 in DB) to boolean
        pinned: !!row.pinned,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

export function touchUpdatedAt() {
    return Math.floor(Date.now() / 1000);
}
