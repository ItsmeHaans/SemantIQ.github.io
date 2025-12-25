/* ======================
GAME STATE
====================== */
const BOARD_SIZE = 6;

function dailySeed() {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = (hash << 5) - hash + today.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

const secretIndex = dailySeed() % ANIMALS.length;

const game_state = {
    secret: ANIMALS[secretIndex],
    finished: false
};

/* ======================
HEAT LOGIC
====================== */
function map_distance_to_heat(distance) {
    const MAX_RANK = ANIMALS.length; // Ensure MAX_RANK is defined
    const ratio = distance / MAX_RANK;
    if (distance === 0) return "found";
    if (ratio <= 0.01) return "burn";
    if (ratio <= 0.03) return "hot";
    if (ratio <= 0.07) return "warm";
    if (ratio <= 0.15) return "normal";
    if (ratio <= 0.30) return "windy";
    if (ratio <= 0.60) return "cold";
    return "freezing";
}

/* ======================
UI ELEMENTS
====================== */
const board = document.querySelector(".board");
let boxes = Array.from(document.querySelectorAll(".box"));
let currentBox = 0;
let isChecking = false;

// HINT BUTTON LOGIC
// HINT BUTTON LOGIC - REVEAL WORD
const hintBtn = document.querySelector('img[src="assets/hint.png"]');
hintBtn.style.cursor = "pointer";

hintBtn.onclick = () => {
    const secretWord = game_state.secret.word.toUpperCase();

    // You can use a simple alert
    alert(`The secret word is: ${secretWord}`);

    // Optional: Log it to console for debugging
    console.log("Secret revealed:", secretWord);
};

/* ======================
CREATE & SHIFT BOARD
====================== */
function createNewBox() {
    const box = document.createElement("input");
    box.className = "box slide-in";
    box.readOnly = true;
    return box;
}

function shiftBoard() {
    const first = boxes[0];
    first.classList.add("slide-out");

    setTimeout(() => {
        board.removeChild(first);
        boxes.shift();

        const newBox = createNewBox();
        board.appendChild(newBox);
        boxes.push(newBox);

        currentBox = boxes.length - 1;
    }, 300);
}

/* ======================
KEYBOARD LAYOUT
====================== */
const rows = {
    row1: "QWERTYUIOP".split(""),
    row2: "ASDFGHJKL".split(""),
    row3: ["ENTER", "SPACE", ..."ZXCVBNM", "⌫"]
};

// Create a container for the 4th row if it doesn't exist in HTML
let row4 = document.getElementById("row4");
if (!row4) {
    row4 = document.createElement("div");
    row4.id = "row4";
    row4.className = "row";
    document.querySelector(".keyboard").appendChild(row4);
}

Object.keys(rows).forEach(rowId => {
    const rowElement = document.getElementById(rowId);
    rows[rowId].forEach(k => {
        const key = document.createElement("div");
        key.className = "key";
        key.textContent = k;
        if (["ENTER", "⌫", "SPACE"].includes(k)) key.classList.add("wide");
        key.onclick = () => handleInput(k);
        rowElement.appendChild(key);
    });
});

/* ======================
INPUT HANDLER
====================== */
function handleInput(key) {
    if (isChecking || game_state.finished) return;

    let box = boxes[currentBox];

    // Prevent editing if the box was already submitted
    if (box.classList.contains("submitted")) return;

    if (key === "⌫" || key === "BACKSPACE") {
        box.value = box.value.slice(0, -1);
        return;
    }

    if (key === "ENTER") {
        if (!box.value.trim()) return;
        submitGuess(box.value.trim().toLowerCase(), box);
        return;
    }

    if (/^[A-Z]$/.test(key)) {
        box.value += key;
        return;
    }

    if (key === "SPACE") {
        // Only add space if there's text and no trailing space already
        if (box.value.length > 0 && !box.value.endsWith(" ")) {
            box.value += " ";
        }
    }
}

/* ======================
PHYSICAL KEYBOARD
====================== */
window.addEventListener("keydown", e => {
    if (isChecking || game_state.finished) return;
    if (e.key === "Backspace") handleInput("BACKSPACE");
    else if (e.key === "Enter") handleInput("ENTER");
    else if (e.key === " ") {
        e.preventDefault(); // Prevent page scroll
        handleInput("SPACE");
    }
    else if (/^[a-zA-Z]$/.test(e.key)) handleInput(e.key.toUpperCase());
});

/* ======================
GUESS LOGIC
====================== */
async function submitGuess(word, box) {
    isChecking = true;
    box.classList.add("checking");

    await sleep(700);

    const item = ANIMALS.find(a => a.word === word);
    if (!item) {
        showNotFound();
        box.classList.remove("checking");
        isChecking = false;
        return;
    }

    // Mark as submitted so it can't be typed in again
    box.classList.add("submitted");

    const secret = game_state.secret;
    const distance = Math.abs(item.rank - secret.rank);
    const heat = map_distance_to_heat(distance);
    const win = word === secret.word;

    applyHeat(box, win ? "found" : heat);

    if (win) {
        game_state.finished = true;
        isChecking = false;
        return;
    }

    if (currentBox === BOARD_SIZE - 1) {
        shiftBoard();
    } else {
        currentBox++;
    }

    isChecking = false;
}

/* ======================
VISUAL EFFECTS
====================== */
function applyHeat(box, heat) {
    box.classList.remove("checking");
    box.classList.add(heat);
    spawnEffect(box, heat);
}

function spawnEffect(box, heat) {
    box.style.position = "relative";
    let count = 0;
    if (heat === "warm") count = 2;
    if (heat === "hot") count = 4;
    if (heat === "burn") count = 6;

    for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        if (["warm", "hot", "burn"].includes(heat)) el.className = "fire";
        else if (["windy", "cold", "freezing"].includes(heat)) el.className = "snow";
        else el.className = "leaf";

        el.style.left = Math.random() * 80 + "%";
        box.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }
}

/* ======================
UTILS
====================== */
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function showNotFound() {
    const toast = document.getElementById("toast");
    toast.innerHTML = `<b>Word not found</b><small>or maybe I forgot to add it</small>`;
    toast.classList.remove("hide");
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");
    }, 2000);
}