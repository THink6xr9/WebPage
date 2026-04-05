import { playlist } from '../../data/playlist.js';

// Elements to be injected (Sidebar, Button, Audio)
// NOTE: music-player-bar is expected to be present in DOM (injected by configurator)
const PLAYER_HTML = `
  <button class="music-playlist-btn locked initial-hidden" id="playlistBtn" aria-label="Open Playlist">☰</button>
  <div class="music-playlist-panel" id="playlistPanel">
    <div class="playlist-static-icon">☰</div>
    <button class="playlist-back-btn" id="playlistBackBtn" aria-label="Close Playlist">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
    </button>
    <div class="playlist-header">Playlist</div>
    <div class="playlist-list" id="playlistList"></div>
  </div>
  <audio id="musicAudio"></audio>
`;

export function initMusicPlayer() {
    try {
        document.body.insertAdjacentHTML("beforeend", PLAYER_HTML);
        setupMusicPlayer();
    } catch (err) {
        console.error("Failed to load music player", err);
    }
}

function setupMusicPlayer() {
    // Elements expected from Configurator (Bar)
    const musicPlayerBar = document.getElementById("musicPlayerBar");
    const trackName = document.getElementById("trackName");
    const playPauseBtnBar = document.getElementById("playPauseBtnBar");
    const prevBtnBar = document.getElementById("prevBtnBar");
    const nextBtnBar = document.getElementById("nextBtnBar");

    // Elements injected by MusicPlayer
    const audio = document.getElementById("musicAudio");
    const playlistBtn = document.getElementById("playlistBtn");
    const playlistPanel = document.getElementById("playlistPanel");
    const playlistList = document.getElementById("playlistList");
    const playlistBackBtn = document.getElementById("playlistBackBtn");

    if (!musicPlayerBar || !audio || !trackName || !playlistBtn || !playlistPanel || !playlistList || !playlistBackBtn) {
        console.warn("Music Player elements missing. Ensure Configurator is loaded first.");
        return;
    }

    let currentTrackIndex = 0;
    let isPlaying = false;
    let isPlaylistUnlocked = false;
    let autoHideTimeout = null;

    // Auto-hide timer functions
    function startAutoHideTimer() {
        clearTimeout(autoHideTimeout);
        autoHideTimeout = setTimeout(() => {
            // Hide button and re-lock
            playlistBtn.classList.add("locked");
            isPlaylistUnlocked = false;
            // Also close panel if open
            closePlaylist();
        }, 60000); // 1 minute
    }

    function stopAutoHideTimer() {
        clearTimeout(autoHideTimeout);
    }

    // Audio event listeners for timer
    audio.addEventListener("play", () => {
        stopAutoHideTimer();
        // Ensure button is visible when playing
        if (!isPlaylistUnlocked || playlistBtn.classList.contains("initial-hidden")) {
            isPlaylistUnlocked = true;
            playlistBtn.classList.remove("locked");
            playlistBtn.classList.remove("initial-hidden");
        }
    });

    audio.addEventListener("pause", () => {
        startAutoHideTimer();
    });

    audio.addEventListener("ended", () => {
        // Note: 'ended' usually triggers next track auto-play, so this might be redundant if the next track starts immediately. 
        // But if playback stops at end of playlist (if loop is off), this handles it.
        // However, our current 'ended' listener auto-advances. 
        // We'll leave it here as a fallback or for pause-like state.
        startAutoHideTimer();
    });

    // Load initial track
    loadTrack(currentTrackIndex);

    // Open playlist panel
    playlistBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!isPlaylistUnlocked) return;

        playlistPanel.classList.add("show");
        playlistBtn.classList.add("hidden");
        document.body.classList.add("sidebar-open");
        renderPlaylist();
    });

    // Close playlist panel (Back Button)
    playlistBackBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closePlaylist();
    });

    // Close panel on outside click
    document.addEventListener("click", (e) => {
        if (playlistPanel.classList.contains("show") && !playlistPanel.contains(e.target) && !playlistBtn.contains(e.target)) {
            closePlaylist();
        }
    });

    function closePlaylist() {
        playlistPanel.classList.remove("show");
        playlistBtn.classList.remove("hidden");
        document.body.classList.remove("sidebar-open");
    }

    // Play/Pause button
    playPauseBtnBar.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isPlaying) {
            audio.pause();
            playPauseBtnBar.textContent = "▶";
            musicPlayerBar.classList.remove("playing");
        } else {
            audio.play().catch(err => {
                console.error("Audio playback failed:", err);
            });
            playPauseBtnBar.textContent = "⏸";
            musicPlayerBar.classList.add("playing");

            // Unlock playlist on first play
            if (!isPlaylistUnlocked || playlistBtn.classList.contains("initial-hidden")) {
                isPlaylistUnlocked = true;
                playlistBtn.classList.remove("locked");
                playlistBtn.classList.remove("initial-hidden");
            }
        }
        isPlaying = !isPlaying;
    });

    // Previous button
    prevBtnBar.addEventListener("click", (e) => {
        e.stopPropagation();
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) {
            audio.play().catch(e => console.error("Play failed", e));
        }
        renderPlaylist(); // re-render to update active class
    });

    // Next button
    nextBtnBar.addEventListener("click", (e) => {
        e.stopPropagation();
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) {
            audio.play().catch(e => console.error("Play failed", e));
        }
        renderPlaylist();
    });

    // Auto-advance to next track when current ends
    audio.addEventListener("ended", () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        audio.play().catch(e => console.error("Auto-advance play failed", e));
        renderPlaylist();
    });

    // Load track helper function
    function loadTrack(index) {
        const track = playlist[index];
        if (!track) return;

        audio.src = track.src;
        trackName.textContent = "♫ " + track.title;

        // NOTE: We don't change isPlaying here, we respect current state
        if (isPlaying) {
            // If we were playing, verify UI shows pause icon (playing state)
            playPauseBtnBar.textContent = "⏸";
        } else {
            playPauseBtnBar.textContent = "▶";
        }
    }

    // Render playlist items
    function renderPlaylist() {
        playlistList.innerHTML = "";
        playlist.forEach((track, index) => {
            const item = document.createElement("div");
            item.className = `playlist-item ${index === currentTrackIndex ? 'active' : ''}`;

            // Title Span
            const titleSpan = document.createElement("span");
            titleSpan.className = "playlist-item-title";
            titleSpan.textContent = track.title;
            item.appendChild(titleSpan);

            // YouTube Link
            if (track.youtubeLink) {
                const ytLink = document.createElement("a");
                ytLink.href = track.youtubeLink;
                ytLink.target = "_blank";
                ytLink.className = "playlist-yt-link";
                ytLink.title = "Watch on YouTube";
                // Simple YouTube Play Icon SVG
                ytLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>`;

                ytLink.addEventListener("click", (e) => {
                    e.stopPropagation(); // Setup link to not trigger track play
                });
                item.appendChild(ytLink);
            }

            item.addEventListener("click", (e) => {
                e.stopPropagation();
                currentTrackIndex = index;
                loadTrack(currentTrackIndex);

                // Always play when selecting from playlist
                audio.play().then(() => {
                    isPlaying = true;
                    playPauseBtnBar.textContent = "⏸";
                    musicPlayerBar.classList.add("playing");
                    renderPlaylist(); // Update active state

                    // Unlock if needed
                    if (!isPlaylistUnlocked) {
                        isPlaylistUnlocked = true;
                        playlistBtn.classList.remove("locked");
                        playlistBtn.classList.remove("initial-hidden");
                    }
                }).catch(err => console.error("Playlist selection play failed:", err));

                // REMOVED: playlistPanel.classList.remove("show"); -> Keep open
            });
            playlistList.appendChild(item);
        });
    }
}
