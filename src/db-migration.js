import {
    DEFAULT_FONT,
    DEFAULT_FONT_SIZE,
    DEFAULT_COLOR,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
} from './db-utils.js';

let dbInstance = null;

export function ensureSchema() {
    const hasNotesTable = dbInstance
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notes'")
        .get();

    if (!hasNotesTable) {
        createFreshNotesTable();
    } else {
        migrateNotesTable();
    }

    // Drop legacy tables (todos) if they still exist.
    dbInstance.exec('DROP TABLE IF EXISTS todos');
}

export function createFreshNotesTable() {
    dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT DEFAULT '',
            pos_x INTEGER DEFAULT 120,
            pos_y INTEGER DEFAULT 120,
            width INTEGER DEFAULT ${DEFAULT_WIDTH},
            height INTEGER DEFAULT ${DEFAULT_HEIGHT},
            opacity REAL DEFAULT 0.92,
            theme_color TEXT DEFAULT '${DEFAULT_COLOR}',
            font_family TEXT DEFAULT '${DEFAULT_FONT}',
            font_size INTEGER DEFAULT ${DEFAULT_FONT_SIZE},
            theme TEXT DEFAULT 'glass',
            pinned INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            updated_at INTEGER DEFAULT (strftime('%s','now'))
        )
    `);
}

export function migrateNotesTable() {
    const columns = dbInstance.prepare('PRAGMA table_info(notes)').all();
    const columnNames = new Set(columns.map(col => col.name));

    // ensure pinned column exists for older databases (safe ALTER)
    if (!columnNames.has('pinned')) {
        try {
            dbInstance.exec("ALTER TABLE notes ADD COLUMN pinned INTEGER DEFAULT 0");
            columnNames.add('pinned');
        } catch (err) {
            // best-effort: if alter fails, continue - other migration logic may recreate table
            console.warn('Failed to add pinned column during migration', err);
        }
    }

    const needsMigration =
        columnNames.has('note_type') ||
        columnNames.has('todo_count') ||
        columnNames.has('completed_count') ||
        !columnNames.has('theme_color') ||
        !columnNames.has('font_family') ||
        !columnNames.has('font_size') ||
        !columnNames.has('theme');

    if (!needsMigration) {
        return;
    }

    dbInstance.exec('BEGIN TRANSACTION');
    try {
        dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS notes_temp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT DEFAULT '',
                pos_x INTEGER DEFAULT 120,
                pos_y INTEGER DEFAULT 120,
                width INTEGER DEFAULT ${DEFAULT_WIDTH},
                height INTEGER DEFAULT ${DEFAULT_HEIGHT},
                opacity REAL DEFAULT 0.92,
                theme_color TEXT DEFAULT '${DEFAULT_COLOR}',
                font_family TEXT DEFAULT '${DEFAULT_FONT}',
                font_size INTEGER DEFAULT ${DEFAULT_FONT_SIZE},
                theme TEXT DEFAULT 'glass',
                created_at INTEGER DEFAULT (strftime('%s','now')),
                updated_at INTEGER DEFAULT (strftime('%s','now'))
            )
        `);

        const availableColumns = columns.reduce((acc, col) => {
            acc[col.name] = true;
            return acc;
        }, {});

        const selectColumns = [
            'id',
            availableColumns.content ? 'content' : "'' AS content",
            availableColumns.pos_x ? 'pos_x' : '120 AS pos_x',
            availableColumns.pos_y ? 'pos_y' : '120 AS pos_y',
            availableColumns.width ? 'width' : `${DEFAULT_WIDTH} AS width`,
            availableColumns.height ? 'height' : `${DEFAULT_HEIGHT} AS height`,
            availableColumns.opacity ? 'opacity' : '0.92 AS opacity',
            availableColumns.theme_color ? 'theme_color' : `'${DEFAULT_COLOR}' AS theme_color`,
            availableColumns.font_family ? 'font_family' : `'${DEFAULT_FONT}' AS font_family`,
            availableColumns.font_size ? 'font_size' : `${DEFAULT_FONT_SIZE} AS font_size`,
            availableColumns.theme ? 'theme' : "'glass' AS theme",
            // handle pinned column migration (default to 0 if missing)
            availableColumns.pinned ? 'pinned' : '0 AS pinned',
            availableColumns.created_at ? 'created_at' : "strftime('%s','now') AS created_at",
            availableColumns.updated_at ? 'updated_at' : "strftime('%s','now') AS updated_at",
        ].join(', ');

        dbInstance.exec(`
            INSERT INTO notes_temp (id, content, pos_x, pos_y, width, height, opacity, theme_color, font_family, font_size, theme, created_at, updated_at)
            SELECT ${selectColumns}
            FROM notes
        `);

        dbInstance.exec('DROP TABLE notes');
        dbInstance.exec('ALTER TABLE notes_temp RENAME TO notes');
        dbInstance.exec('COMMIT');
    } catch (error) {
        dbInstance.exec('ROLLBACK');
        throw error;
    }
}

export function setDbInstance(db) {
    dbInstance = db;
}
