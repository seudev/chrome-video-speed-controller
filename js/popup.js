const SPEED_PRECISION = 2;
const DEFAULT_SETTINGS = {
    step: 0.1,
    speed: 1,
    predefinedSpeeds: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 16],
};

document.addEventListener('DOMContentLoaded', () => {

    chrome.storage.sync.get(['step', 'speed', 'predefinedSpeeds'], settings => {
        const {
            step = DEFAULT_SETTINGS.step,
            speed = DEFAULT_SETTINGS.speed,
            predefinedSpeeds = DEFAULT_SETTINGS.predefinedSpeeds
        } = settings;

        setSpeed(speed);
        setStep(step);
        createPredefinedSpeedList(predefinedSpeeds);
    });

    chrome.storage.sync.onChanged.addListener(c => {
        if (c.predefinedSpeeds != null) {
            createPredefinedSpeedList(c.predefinedSpeeds.newValue);
        }
    });

    document.querySelector('#input-step').addEventListener('change', e => {
        const step = parseFloat(e.target.value);
        setStep(step);
    });

    document.querySelector('#video-speed').addEventListener('change', e => {
        const speed = parseFloat(e.target.value);
        setSpeed(speed);
    });

    document.querySelector('#increase-speed').addEventListener('click', () => incrementSpeed(1));
    document.querySelector('#decrease-speed').addEventListener('click', () => incrementSpeed(-1));
    document.querySelector('#reset-speed').addEventListener('click', () => setSpeed(DEFAULT_SETTINGS.speed));
    document.querySelector('#reset-step').addEventListener('click', () => setStep(DEFAULT_SETTINGS.step));
    document.querySelector('#reset-all-settings').addEventListener('click', resetAllSettings);
    document.querySelector('#add-custom-predefined-speed').addEventListener('click', addCustomPredefinedSpeed);
});

const incrementSpeed = x => {
    chrome.storage.sync.get(['step', 'speed'], settings => {
        const {
            step = DEFAULT_SETTINGS.step,
            speed = DEFAULT_SETTINGS.speed,
        } = settings;

        setSpeed(speed + (step * x));
    });
};

const setSpeed = value => {
    let speed = parseFloat(value);
    if ((speed <= 0) || isNaN(speed)) {
        speed = DEFAULT_SETTINGS.speed;
    }
    document.querySelector('#video-speed').value = speed.toFixed(SPEED_PRECISION);

    const settings = { speed };
    chrome.storage.sync.set(settings);
    handlePage(settings);
};

const setStep = value => {
    let step = value;
    if ((step <= 0) || isNaN(step)) {
        step = DEFAULT_SETTINGS.step;
    }
    document.querySelector('#video-speed').setAttribute('step', step);
    document.querySelector('#input-step').value = step;
    chrome.storage.sync.set({ step });
};

const resetAllSettings = () => {
    chrome.storage.sync.set(DEFAULT_SETTINGS);

    setSpeed(DEFAULT_SETTINGS.speed);
    setStep(DEFAULT_SETTINGS.step);
    createPredefinedSpeedList(DEFAULT_SETTINGS.predefinedSpeeds);
    clearCustomPredefinedSpeedInput();
};

const createPredefinedSpeedList = predefinedSpeeds => {
    document.querySelector('#predefined-speed-list').textContent = '';
    predefinedSpeeds.sort((x, y) => x - y).forEach(addPredefinedSpeed);
};

const addPredefinedSpeed = speed => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = `${speed.toFixed(SPEED_PRECISION)}x`;
    button.setAttribute("type", "button");
    button.setAttribute("title", "Left click set the video speed or right click remove this button.");
    button.addEventListener('click', () => setSpeed(speed));
    button.addEventListener('contextmenu', e => removePredefinedSpeed(e, speed));
    li.appendChild(button);
    document.querySelector('#predefined-speed-list').appendChild(li);
};

const removePredefinedSpeed = (event, speed) => {
    event.preventDefault();

    chrome.storage.sync.get('predefinedSpeeds', ({ predefinedSpeeds = DEFAULT_SETTINGS.predefinedSpeeds }) => {
        chrome.storage.sync.set({ predefinedSpeeds: predefinedSpeeds.filter(s => s != speed) });
    });
};

const addCustomPredefinedSpeed = () => {
    const speed = parseFloat(document.querySelector('#custom-predefined-speed-input').value);
    if (speed) {
        chrome.storage.sync.get('predefinedSpeeds', ({ predefinedSpeeds = [] }) => {
            if (!predefinedSpeeds.includes(speed)) {
                chrome.storage.sync.set({ predefinedSpeeds: [...predefinedSpeeds, speed] });
            }
        });
    }
    clearCustomPredefinedSpeedInput();
}

const clearCustomPredefinedSpeedInput = () => {
    document.querySelector('#custom-predefined-speed-input').value = "";
};

const handlePage = settings => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.executeScript(tabs[0].id, { code: `var settings = ${JSON.stringify(settings)};` }, () => {
            chrome.tabs.executeScript(tabs[0].id, { file: 'js/page-handler.js' });
        });
    });
};
