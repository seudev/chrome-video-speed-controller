let nextId = 1;
const cleanups = {};
const timeouts = {};

const findBestContainerParent = video => {
    let node = video.parentNode;
    let addEventListeners = false;

    if (location.host.includes("facebook")) {
        addEventListeners = true;
        while (node.parentNode.classList.contains("k4urcfbm")) {
            node = node.parentNode;
        }
    } else if (location.host.includes("vimeo")) {
        addEventListeners = true;
        node = video.closest(".js-player") || video.parentNode;
    }
    return { node, addEventListeners };
};

const executeCleanup = video => {
    const ref = video.getAttribute("seudev-vsc");
    const cleanup = cleanups[ref];
    if (typeof cleanup === "function") {
        delete cleanups[ref];
        cleanup();
    }
};

const calculateMultiplier = e => {
    const multiplier = e.altKey ? 1 : 5;
    return e.wheelDelta > 0 ? multiplier : (multiplier * -1);
};

const createVsc = video => {
    executeCleanup(video);

    const id = `seudev-vsc-${nextId++}`;
    const ref = `#${id}`;
    video.setAttribute("seudev-vsc", ref);

    const containerParent = findBestContainerParent(video);

    const vscContainer = document.createElement("div");
    vscContainer.id = id;
    vscContainer.className = "seudev-vsc";
    containerParent.node.prepend(vscContainer);

    const rateDisplay = document.createElement("span");
    rateDisplay.className = "seudev-vsc-rate-display";
    vscContainer.appendChild(rateDisplay);

    const rateInput = document.createElement("input");
    rateInput.type = "range";
    rateInput.min = 0.1;
    rateInput.max = 16;
    rateInput.step = 0.05;
    rateInput.value = video.playbackRate;
    vscContainer.appendChild(rateInput);

    const resetRateButton = document.createElement("button");
    resetRateButton.className = "seudev-vsc-reset-rate";
    resetRateButton.type = "buttton";
    resetRateButton.textContent = "R";
    vscContainer.appendChild(resetRateButton);

    const tooltipWrapper = document.createElement("div");
    tooltipWrapper.className = "seudev-vsc-tooltip-wrapper";
    vscContainer.appendChild(tooltipWrapper);

    const homePageLink = document.createElement("a");
    homePageLink.href = "https://github.com/seudev/chrome-video-speed-controller";
    homePageLink.target = "_blank";
    homePageLink.innerHTML = `<img class="seudev" src="${chrome.extension.getURL("img/seudev-negative-icon-64px-61px.png")}">`;
    tooltipWrapper.appendChild(homePageLink);

    const tooltip = document.createElement("div");
    tooltip.className = "seudev-vsc-tooltip";
    tooltip.innerHTML = '<p>Made with <span class="heart">&#10084;</span> by <a target="_blank" href="https://github.com/seudev/chrome-video-speed-controller">Seudev</a>!</p>';
    tooltipWrapper.appendChild(tooltip);

    const hideController = (timeout = 2000) => {
        clearTimeout(timeouts[ref]);
        timeouts[ref] = setTimeout(() => vscContainer.classList.remove("seudev-vsc-active"), timeout);
    }

    const showController = () => {
        vscContainer.classList.add("seudev-vsc-active");
        hideController();
    };

    const resetRate = () => {
        showController();
        video.playbackRate = 1;
    };

    const handleMouseButtonClick = e => {
        const middleButton = 1;

        if (e.button === middleButton) {
            resetRate();
        }
    };

    const setRateDisplay = rate => {
        showController();
        rateDisplay.textContent = `${rate.toFixed(2)}x`;
    };
    setRateDisplay(video.playbackRate);

    const incrementRate = multiplier => {
        showController();

        const value = parseFloat(rateInput.value);
        const step = parseFloat(rateInput.step);
        const min = parseFloat(rateInput.min);
        const max = parseFloat(rateInput.max);
        const newValue = (value + (step * multiplier));

        if (newValue < min) {
            video.playbackRate = min;
        } else if (newValue > max) {
            video.playbackRate = max;
        } else {
            video.playbackRate = newValue;
        }
    };

    const onRateInputChange = e => {
        e.preventDefault();
        e.stopPropagation();

        const value = parseFloat(rateInput.value);
        setRateDisplay(value);
        video.playbackRate = value;
    };

    const onContainerClick = e => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onMouseout = () => {
        hideController(0);
    };

    const onRateChange = () => {
        setRateDisplay(video.playbackRate);
        rateInput.value = video.playbackRate;
    };

    const onContainerMouseWheel = e => {
        e.preventDefault();
        e.stopPropagation();
        const multiplier = calculateMultiplier(e);
        incrementRate(multiplier);
    };

    const onVideoMouseWheel = e => {
        if (e.shiftKey) {
            const multiplier = calculateMultiplier(e);
            incrementRate(multiplier);
        }
    };

    const onResetRateButtonClick = e => {
        e.preventDefault();
        e.stopPropagation();
        resetRate();
    };

    if (containerParent.addEventListeners) {
        vscContainer.parentNode.addEventListener("mousemove", showController);
        vscContainer.parentNode.addEventListener("mouseout", onMouseout);
        vscContainer.parentNode.addEventListener("mousewheel", onVideoMouseWheel);
        vscContainer.parentNode.addEventListener("mousedown", handleMouseButtonClick);
    }

    vscContainer.addEventListener("click", onContainerClick);
    vscContainer.addEventListener("mousewheel", onContainerMouseWheel);
    vscContainer.addEventListener("mousedown", handleMouseButtonClick);

    rateInput.addEventListener("change", onRateInputChange);
    rateInput.addEventListener("input", onRateInputChange);

    resetRateButton.addEventListener("click", onResetRateButtonClick);

    tooltipWrapper.querySelectorAll("a")
        .forEach(a => a.addEventListener("click", e => e.stopPropagation()));

    video.addEventListener("mousemove", showController);
    video.addEventListener("mouseout", onMouseout);
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("mousewheel", onVideoMouseWheel);
    video.addEventListener("mousedown", handleMouseButtonClick);

    const cleanup = () => {
        if (containerParent.addEventListeners) {
            vscContainer.parentNode.removeEventListener("mousemove", showController);
            vscContainer.parentNode.removeEventListener("mouseout", onMouseout);
            vscContainer.parentNode.removeEventListener("mousewheel", onVideoMouseWheel);
            vscContainer.parentNode.removeEventListener("mousedown", handleMouseButtonClick);
        }

        vscContainer.remove();
        video.removeEventListener("mousemove", showController);
        video.removeEventListener("mouseout", onMouseout);
        video.removeEventListener("ratechange", onRateChange);
        video.removeEventListener("mousewheel", onVideoMouseWheel);
        video.removeEventListener("mousedown", handleMouseButtonClick);
    };

    cleanups[ref] = cleanup;
};

document.querySelectorAll("video")
    .forEach(createVsc);

const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
        m.addedNodes.forEach(n => {
            if (n instanceof HTMLElement) {
                if (n.tagName && n.tagName.toLowerCase() === "video") {
                    createVsc(n);
                } else {
                    n.querySelectorAll("video").forEach(createVsc);
                }
            }
        });

        m.removedNodes.forEach(n => {
            if (n instanceof HTMLElement) {
                if (n.tagName && n.tagName.toLowerCase() === "video") {
                    executeCleanup(n);
                } else {
                    n.querySelectorAll("video").forEach(executeCleanup);
                }
            }
        });
    });
});

observer.observe(document.querySelector("html"), { childList: true, subtree: true });
