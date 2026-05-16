/* ========================================
   Pomodoro Focus — Core JavaScript
   Timer + Music Player + Stats Tracker
   ========================================= */

const state = {
    timer: {
        mode: 'work',
        timeLeft: 25 * 60,
        isRunning: false,
        workDuration: 25,
        breakDuration: 5
    },
    music: {
        playlist: [],
        currentTrack: 0,
        isPlaying: false,
        volume: 50
    },
    stats: {
        sessionsCompleted: 0,
        totalFocusTime: 0
    }
};

let audioPlayer;

// Tab system
function showTab(tabId) {
    // Hide all sections
    document.querySelectorAll('.timer-section, .settings-section, .music-section, .stats-section').forEach(function(el) {
        el.classList.add('hidden');
    });
    // Show target
    var target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');
    // Update button active states
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        var val = btn.getAttribute('data-tab');
        btn.classList.toggle('active', tabId.indexOf(val) !== -1);
    });
}

// Timer functions
function updateTimerDisplay() {
    var minutes = Math.floor(state.timer.timeLeft / 60);
    var seconds = state.timer.timeLeft % 60;
    var display = document.getElementById('timerDisplay');
    if (display) {
        display.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }
}

function updateModeDisplay() {
    var modeEl = document.getElementById('timerMode');
    if (modeEl) {
        modeEl.textContent = state.timer.mode.toUpperCase();
        if (state.timer.mode === 'break') {
            modeEl.className = 'timer-mode break-mode';
        } else {
            modeEl.className = 'timer-mode';
        }
    }
}

function setStateTimer(mode) {
    state.timer.mode = mode;
    var dur = mode === 'work' ? state.timer.workDuration : state.timer.breakDuration;
    state.timer.timeLeft = dur * 60;
    updateTimerDisplay();
    updateModeDisplay();
}

function startTimer() {
    if (!state.timer.isRunning) {
        state.timer.isRunning = true;
        document.getElementById('btnIcon').textContent = '\u23F8';
        document.getElementById('btnText').textContent = 'Pause';
        runTimer();
    }
}

function runTimer() {
    if (!state.timer.isRunning) return;
    state.timer.timeLeft--;
    updateTimerDisplay();
    if (state.timer.timeLeft <= 0) {
        state.stats.sessionsCompleted++;
        if (state.timer.mode === 'work') {
            state.stats.totalFocusTime += state.timer.workDuration * 60;
        }
        state.timer.mode = state.timer.mode === 'work' ? 'break' : 'work';
        setStateTimer(state.timer.mode);
    }
    setTimeout(runTimer, 1000);
}

function pauseTimer() {
    state.timer.isRunning = false;
    document.getElementById('btnIcon').textContent = '\u25B6';
    document.getElementById('btnText').textContent = 'Start';
}

toggleTimer = function() {
    if (state.timer.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
};

function resetTimer() {
    state.timer.isRunning = false;
    setStateTimer('work');
    document.getElementById('btnIcon').textContent = '\u25B6';
    document.getElementById('btnText').textContent = 'Start';
}

function skipSession() {
    if (state.timer.mode === 'work') {
        setStateTimer('break');
        startTimer();
    } else if (state.timer.mode === 'break') {
        setStateTimer('work');
        startTimer();
    }
}

// Stats functions
toggleStats = function() {
    // Switch to the Analytics tab
    showTab('analyticsSection');
};

function updateStatsDisplay() {
    var sessionsEl = document.getElementById('sessionsCompleted');
    var focusEl = document.getElementById('focusTime');
    if (sessionsEl) sessionsEl.textContent = state.stats.sessionsCompleted;
    if (focusEl) {
        var h = Math.floor(state.stats.totalFocusTime / 3600);
        var m = Math.floor((state.stats.totalFocusTime % 3600) / 60);
        focusEl.textContent = h + 'h ' + m + 'm';
    }
}

function resetStats() {
    state.stats.sessionsCompleted = 0;
    state.stats.totalFocusTime = 0;
    updateStatsDisplay();
}

// Music functions
function initMusic() {
    audioPlayer = document.getElementById('audioPlayer');
    if (!audioPlayer) {
        console.warn('No audio element found');
        return;
    }
    audioPlayer.volume = state.music.volume / 100;
    audioPlayer.addEventListener('ended', function() {
        if (state.music.playlist.length > 0) {
            var n = (state.music.currentTrack + 1) % state.music.playlist.length;
            playTrack(n);
        }
    });

    // Update playbar as music plays
    audioPlayer.addEventListener('timeupdate', function() {
        updateProgress();
    });

    // Set duration once metadata loads
    audioPlayer.addEventListener('loadedmetadata', function() {
        document.getElementById('durationTime').textContent = formatTime(audioPlayer.duration);
    });
}

function loadAudioFile(file) {
    var url = URL.createObjectURL(file);
    state.music.playlist.push({
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: url
    });
    updatePlaylist();
    if (state.music.playlist.length === 1) {
        playTrack(0);
    }
}

function playTrack(idx) {
    if (idx < 0 || idx >= state.music.playlist.length) return;
    state.music.currentTrack = idx;
    var track = state.music.playlist[idx];
    audioPlayer.src = track.url;
    audioPlayer.volume = state.music.volume / 100;
    audioPlayer.play().catch(function() {});
    state.music.isPlaying = true;
    updateNowPlaying();
    updatePlayIcon();
}

function toggleMusic() {
    if (!audioPlayer) return;
    if (state.music.playlist.length === 0) {
        document.getElementById('audioInput').click();
        return;
    }
    if (!state.music.isPlaying) {
        audioPlayer.play().catch(function() {});
        state.music.isPlaying = true;
    } else {
        audioPlayer.pause();
        state.music.isPlaying = false;
    }
    updatePlayIcon();
}

function updatePlayIcon() {
    var btn = document.getElementById('playPauseBtn');
    if (btn) btn.textContent = state.music.isPlaying ? '\u23F8' : '\u25B6';
}

function prevTrack() {
    if (state.music.playlist.length > 0) {
        var n = (state.music.currentTrack - 1 + state.music.playlist.length) % state.music.playlist.length;
        playTrack(n);
    }
}

function nextTrack() {
    if (state.music.playlist.length > 0) {
        var n = (state.music.currentTrack + 1) % state.music.playlist.length;
        playTrack(n);
    }
}

function setVolume(value) {
    state.music.volume = parseInt(value);
    if (audioPlayer) audioPlayer.volume = parseInt(value) / 100;
}

function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function updateProgress() {
    if (!audioPlayer) return;
    var current = audioPlayer.currentTime;
    var total = audioPlayer.duration || 0;
    
    document.getElementById('currentTime').textContent = formatTime(current);
    
    if (total > 0) {
        var pct = (current / total) * 100;
        document.getElementById('progressSlider').value = pct;
    }
}

function seekTrack(value) {
    if (!audioPlayer) return;
    var total = audioPlayer.duration || 0;
    var seekTo = (value / 100) * total;
    audioPlayer.currentTime = seekTo;
}

function updateNowPlaying() {
    var el = document.getElementById('nowPlaying');
    if (el && state.music.playlist[state.music.currentTrack]) {
        el.textContent = state.music.playlist[state.music.currentTrack].name;
    }
}

function updatePlaylist() {
    var el = document.getElementById('playlist');
    if (!el) return;
    el.innerHTML = '';
    state.music.playlist.forEach(function(track, i) {
        var div = document.createElement('div');
        div.className = 'playlist-item' + (i === state.music.currentTrack ? ' active' : '');
        div.innerHTML = '<span class="track-icon">🎵</span>' +
            '<span class="track-info">' +
            '<span class="track-name">' + track.name + '</span>' +
            '</span>';
        div.onclick = function() { playTrack(i); };
        el.appendChild(div);
    });
    updateNowPlaying();
}

// -----------------------------------------------------------------
// Load the remote playlist (files that live on the server in /assets)
function loadRemotePlaylist() {
    fetch('assets/playlist.json')
        .then(r => r.ok ? r.json() : Promise.reject('Playlist not found'))
        .then(list => {
            // Append each remote track to the existing playlist array
            list.forEach(track => {
                state.music.playlist.push({
                    name: track.name || 'Untitled',
                    url: track.url
                });
            });
            updatePlaylist(); // refresh UI
            // Auto-play the first remote track if playlist is empty and we have tracks
            if (state.music.playlist.length > 0 && !state.music.isPlaying) {
                playTrack(0);
            }
        })
        .catch(err => console.warn('Could not load remote playlist:', err));
}

// Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        // DEBUG: set background to see if script runs
        document.body.style.background = '#ffe6e6';

        // Init music player
        initMusic();

        // ------------- Load remote playlist (MP3 files in /assets) -------------
        loadRemotePlaylist();

    // Handle file input for music
    var audioInput = document.getElementById('audioInput');
    if (audioInput) {
        audioInput.addEventListener('change', function(e) {
            var files = e.target.files;
            for (var i = 0; i < files.length; i++) {
                loadAudioFile(files[i]);
            }
        });
    }

    // Initialize timer
    setStateTimer('work');
    updateModeDisplay();
    updateTimerDisplay();
    updateStatsDisplay();
    updatePlaylist();

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var tabName = btn.getAttribute('data-tab');
            if (tabName === 'analytics') updateStatsDisplay();
            showTab(tabName + 'Section');
        });
    });

    // Start with timer tab
    showTab('timerSection');

    // Listen for duration changes
    var workInput = document.getElementById('workMinutes');
    var breakInput = document.getElementById('breakMinutes');
    if (workInput) {
        workInput.addEventListener('change', function() {
            state.timer.workDuration = parseInt(this.value) || 25;
            setStateTimer(state.timer.mode);
        });
    }
    if (breakInput) {
        breakInput.addEventListener('change', function() {
            state.timer.breakDuration = parseInt(this.value) || 5;
            setStateTimer(state.timer.mode);
        });
    }
});
