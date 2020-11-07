document.querySelectorAll('video').forEach(v => {
    v.defaultPlaybackRate = settings.speed;
    v.playbackRate = settings.speed;
    v.play();
});
