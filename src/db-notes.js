import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import {
    DEFAULT_FONT,
    DEFAULT_FONT_SIZE,
    DEFAULT_COLOR,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MIN_WIDTH,
    MIN_HEIGHT,
    clampOpacity,
    clampDimension,
    normalizeFontFamily,
    clampFontSize,
    normalizeColor,
    normalizeTheme,
    touchUpdatedAt,
    mapNoteRow,
} from './db-utils.js';
import { ensureSchema, setDbInstance } from './db-migration.js';

let dbInstance = null;
let sqliteFilePath = null;

export function initializeDatabase(userDataPath) {
    if (dbInstance) {
        return dbInstance;
    }
    if (!userDataPath) {
        throw new Error('userDataPath is required to initialize the database');
    }
    fs.mkdirSync(userDataPath, { recursive: true });
    sqliteFilePath = path.join(userDataPath, 'desktop-notes.sqlite');
    dbInstance = new Database(sqliteFilePath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    setDbInstance(dbInstance);
    ensureSchema();
    return dbInstance;
}

export function ensureDatabase() {
    if (!dbInstance) {
        throw new Error('Database has not been initialized');
    }
}

export function getAllNotes() {
    ensureDatabase();
    const stmt = dbInstance.prepare(`
        SELECT *
        FROM notes
        ORDER BY pinned DESC, updated_at DESC, id DESC
    `);
    return stmt.all().map(mapNoteRow);
}

export function getNoteById(noteId) {
    ensureDatabase();
    const stmt = dbInstance.prepare('SELECT * FROM notes WHERE id = ?');
    return mapNoteRow(stmt.get(noteId));
}

export function createNote(overrides = {}) {
    ensureDatabase();
    const insert = dbInstance.prepare(`
        INSERT INTO notes (content, pos_x, pos_y, width, height, opacity, theme_color, font_family, font_size, theme, pinned)
        VALUES (@content, @pos_x, @pos_y, @width, @height, @opacity, @theme_color, @font_family, @font_size, @theme, @pinned)
    `);
    const params = {
        content: typeof overrides.content === 'string' ? overrides.content : '',
        pos_x: Number.isFinite(overrides.pos_x) ? Math.round(overrides.pos_x) : 120,
        pos_y: Number.isFinite(overrides.pos_y) ? Math.round(overrides.pos_y) : 120,
        width: clampDimension(overrides.width, DEFAULT_WIDTH, MIN_WIDTH),
        height: clampDimension(overrides.height, DEFAULT_HEIGHT, MIN_HEIGHT),
        opacity: clampOpacity(overrides.opacity ?? 0.92),
        theme_color: normalizeColor(overrides.theme_color ?? DEFAULT_COLOR),
        font_family: normalizeFontFamily(overrides.font_family ?? DEFAULT_FONT),
        font_size: clampFontSize(overrides.font_size ?? DEFAULT_FONT_SIZE),
        theme: normalizeTheme(overrides.theme ?? 'glass'),
        pinned: Number(Boolean(overrides.pinned)),
    };
    const result = insert.run(params);
    return getNoteById(result.lastInsertRowid);
}

export function updateNoteContent(noteId, content) {
    ensureDatabase();
    dbInstance
        .prepare(`
            UPDATE notes
            SET content = @content, updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            content: typeof content === 'string' ? content : '',
        });
    return getNoteById(noteId);
}

export function updateNoteBounds(noteId, { pos_x, pos_y, width, height }) {
    ensureDatabase();
    const current = getNoteById(noteId);
    if (!current) {
        return null;
    }
    const nextWidth = width !== undefined ? clampDimension(width, current.width, MIN_WIDTH) : current.width;
    const nextHeight = height !== undefined ? clampDimension(height, current.height, MIN_HEIGHT) : current.height;
    dbInstance
        .prepare(`
            UPDATE notes
            SET
                pos_x = COALESCE(@pos_x, pos_x),
                pos_y = COALESCE(@pos_y, pos_y),
                width = @width,
                height = @height,
                updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            pos_x: Number.isFinite(pos_x) ? Math.round(pos_x) : undefined,
            pos_y: Number.isFinite(pos_y) ? Math.round(pos_y) : undefined,
            width: nextWidth,
            height: nextHeight,
        });
    return getNoteById(noteId);
}

export function updateNoteThemeColor(noteId, themeColor) {
    ensureDatabase();
    dbInstance
        .prepare(`
            UPDATE notes
            SET theme_color = @theme_color, updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            theme_color: normalizeColor(themeColor),
        });
    return getNoteById(noteId);
}

export function updateNoteTheme(noteId, theme) {
    ensureDatabase();
    dbInstance
        .prepare(`
            UPDATE notes
            SET theme = @theme, updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            theme: normalizeTheme(theme),
        });
    return getNoteById(noteId);
}

export function updateNoteOpacity(noteId, opacity) {
    ensureDatabase();
    dbInstance
        .prepare(`
            UPDATE notes
            SET opacity = @opacity, updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            opacity: clampOpacity(opacity),
        });
    return getNoteById(noteId);
}

export function updateNoteFont(noteId, fontFamily) {
    ensureDatabase();
    dbInstance
        .prepare(`
            UPDATE notes
            SET font_family = @font_family, updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            font_family: normalizeFontFamily(fontFamily),
        });
    return getNoteById(noteId);
}

export function updateNoteFontSize(noteId, fontSize) {
    ensureDatabase();
    dbInstance
        .prepare(`
            UPDATE notes
            SET font_size = @font_size, updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            font_size: clampFontSize(fontSize),
        });
    return getNoteById(noteId);
}

export function updateNotePinned(noteId, pinned) {
    ensureDatabase();
    dbInstance
        .prepare(`
            UPDATE notes
            SET pinned = @pinned, updated_at = strftime('%s','now')
            WHERE id = @id
        `)
        .run({
            id: noteId,
            pinned: pinned ? 1 : 0,
        });
    return getNoteById(noteId);
}

export function deleteNote(noteId) {
    ensureDatabase();
    const result = dbInstance.prepare('DELETE FROM notes WHERE id = ?').run(noteId);
    return result.changes > 0;
}

export function getDatabasePath() {
    return sqliteFilePath;
}
