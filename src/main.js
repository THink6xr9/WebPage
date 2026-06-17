/* -----------------------------
   IMPORTS
----------------------------- */
import { initFace } from './features/face/face.js';
import { initConfigurator } from './features/configurator/configurator.js';
import { initMusicPlayer } from './features/musicPlayer/musicPlayer.js';
import { initCatalog } from './features/catalog/catalog.js?v=4';

/* -----------------------------
   INITIALIZATION
----------------------------- */

// Initialize Features
initFace();
initConfigurator();
initMusicPlayer();
initCatalog();
