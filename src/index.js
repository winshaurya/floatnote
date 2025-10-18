import { app } from 'electron';
import squirrelStartup from 'electron-squirrel-startup';

if (squirrelStartup) {
    app.quit();
}

import './app-init.js';
