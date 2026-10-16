
// ================================
// OOXX V2.0 遊戲邏輯
// ================================

// 取得 HTML 元素
const rpsScreen = document.getElementById("rps-screen");
const gameScreen = document.getElementById("game-screen");

const rpsTitle = document.getElementById("rps-title");
const rpsDescription = document.getElementById("rps-description");
const rpsChoices = document.getElementById("rps-choices");
const handoff = document.getElementById("handoff");
const rpsResult = document.getElementById("rps-result");

const handO = document.getElementById("hand-o");
const handX = document.getElementById("hand-x");
const rpsOutcome = document.getElementById("rps-outcome");
const rpsNext = document.getElementById("rps-next");

const readyBtn = document.getElementById("ready-btn");
const restartBtn = document.getElementById("restart-btn");
const resetBtn = document.getElementById("reset-btn");

const statusText = document.getElementById("status");
const cells = [...document.querySelectorAll(".cell")];

const scoreO = document.getElementById("score-o");
const scoreX = document.getElementById("score-x");

const gestureButtons = document.querySelectorAll(".gesture");

// ================================
// 遊戲狀態
// ================================

const STATES = {
  RPS_O: "rps_o",
  HANDOFF: "handoff",
  RPS_X: "rps_x",
  RPS_RESULT: "rps_result",
  PLAYING: "playing",
  GAME_OVER: "game_over"
};

let gameState = STATES.RPS_O;

let choiceO = null;
let choiceX = null;
let rpsWinner = null;

let board = Array(9).fill("");
let currentPlayer = null;

// ================================
// 比分儲存
// ================================

const STORAGE_KEY = "ooxx-scores-v1";

function loadScores() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return {
      O: Number.isSafeInteger(saved?.O) && saved.O >= 0
        ? saved.O : 0,
      X: Number.isSafeInteger(saved?.X) && saved.X >= 0
        ? saved.X : 0
    };
  } catch {
    return { O: 0, X: 0 };
  }
}

let scores = loadScores();

function saveScores() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // 無法儲存時仍可正常遊戲
  }
}

function renderScores() {
  scoreO.textContent = scores.O;
  scoreX.textContent = scores.X;
}

// ================================
// 猜拳規則
// ================================

const gestures = {
  rock: "✊",
  scissors: "✌️",
  paper: "✋"
};

function determineRpsWinner(o, x) {
  if (o === x) return null;

  const oWins =
    (o === "rock" && x === "scissors") ||
    (o === "scissors" && x === "paper") ||
    (o === "paper" && x === "rock");

  return oWins ? "O" : "X";
}

// ================================
// 顯示猜拳畫面
// ================================

function showRpsScreen() {
  rpsScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");

  rpsChoices.classList.remove("hidden");
  handoff.classList.add("hidden");
  rpsResult.classList.add("hidden");

  rpsTitle.textContent = "先來猜拳吧！";
  rpsDescription.textContent = "玩家 O，請選擇你的手勢";
}

// ================================
// 猜拳選擇
// ================================

function selectGesture(choice) {

  if (gameState === STATES.RPS_O) {

    choiceO = choice;
    gameState = STATES.HANDOFF;

    rpsChoices.classList.add("hidden");
    handoff.classList.remove("hidden");

    rpsTitle.textContent = "換玩家 X 囉！";
    rpsDescription.textContent = "請把手機交給玩家 X";

    return;
  }

  if (gameState === STATES.RPS_X) {

    choiceX = choice;
    gameState = STATES.RPS_RESULT;

    showRpsResult();
  }
}

// 玩家 X 準備完成
readyBtn.addEventListener("click", () => {
  if (gameState !== STATES.HANDOFF) return;

  gameState = STATES.RPS_X;

  handoff.classList.add("hidden");
  rpsChoices.classList.remove("hidden");

  rpsTitle.textContent = "玩家 X 的回合";
  rpsDescription.textContent = "請選擇你的手勢 ♡";
});

// 猜拳按鈕事件
gestureButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectGesture(button.dataset.choice);
  });
});

// ================================
// 公布猜拳結果
// ================================

function showRpsResult() {

  rpsWinner = determineRpsWinner(choiceO, choiceX);

  rpsChoices.classList.add("hidden");
  handoff.classList.add("hidden");
  rpsResult.classList.remove("hidden");

  handO.textContent = gestures[choiceO];
  handX.textContent = gestures[choiceX];

  rpsTitle.textContent = "猜拳結果出爐！";
  rpsDescription.textContent = "看看誰贏了吧 ♡";

  if (rpsWinner === null) {
    rpsOutcome.textContent = "平手！再猜一次 ♡";
    rpsNext.textContent = "重新猜拳 ↻";
  } else {
    rpsOutcome.textContent = `玩家 ${rpsWinner} 贏啦！🎉`;
    rpsNext.textContent = "開始下棋 →";
  }
}

// 猜拳結果下一步
rpsNext.addEventListener("click", () => {

  if (gameState !== STATES.RPS_RESULT) return;

  if (rpsWinner === null) {
    startNewRound();
  } else {
    startOoxx();
  }
});

// ================================
// OOXX 勝利條件
// ================================

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function findWinningLine(player) {
  return winningLines.find(line =>
    line.every(index => board[index] === player)
  );
}

// ================================
// 開始 OOXX
// ================================

function startOoxx() {

  if (!rpsWinner) return;

  gameState = STATES.PLAYING;
  currentPlayer = rpsWinner;

  board = Array(9).fill("");

  rpsScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  statusText.textContent =
    `猜拳贏家 ${currentPlayer} 先下棋！`;

  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.className = "cell";
    cell.setAttribute(
      "aria-label",
      `第${index + 1}格，空白`
    );
  });
}

// ================================
// OOXX 下棋
// ================================

function playOoxx(event) {

  if (gameState !== STATES.PLAYING) return;

  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  if (board[index] !== "") return;

  board[index] = currentPlayer;

  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());
  cell.disabled = true;
  cell.setAttribute(
    "aria-label",
    `第${index + 1}格，${currentPlayer}`
  );

  const winningLine = findWinningLine(currentPlayer);

  // 有人獲勝
  if (winningLine) {

    gameState = STATES.GAME_OVER;

    scores[currentPlayer]++;
    saveScores();
    renderScores();

    winningLine.forEach(i => {
      cells[i].classList.add("win");
    });

    statusText.textContent =
      `玩家 ${currentPlayer} 贏啦！🎉`;

    disableBoard();
    return;
  }

  // 平手
  if (board.every(value => value !== "")) {

    gameState = STATES.GAME_OVER;

    statusText.textContent =
      "平手！下局再加油 ♡";

    disableBoard();
    return;
  }

  // 換人
  currentPlayer =
    currentPlayer === "O" ? "X" : "O";

  statusText.textContent =
    `輪到玩家 ${currentPlayer} 囉！`;
}

function disableBoard() {
  cells.forEach(cell => {
    cell.disabled = true;
  });
}

// 綁定棋盤
cells.forEach(cell => {
  cell.addEventListener("click", playOoxx);
});

// ================================
// 重新開始
// ================================

function startNewRound() {

  choiceO = null;
  choiceX = null;
  rpsWinner = null;

  board = Array(9).fill("");
  currentPlayer = null;

  gameState = STATES.RPS_O;

  showRpsScreen();
}

// 再玩一局：保留比分
restartBtn.addEventListener("click", () => {
  startNewRound();
});

// 重置比分
resetBtn.addEventListener("click", () => {

  const confirmed = confirm(
    "確定要清除所有比分嗎？"
  );

  if (!confirmed) return;

  scores = { O: 0, X: 0 };

  saveScores();
  renderScores();
  startNewRound();
});

// ================================
// 初始化
// ================================

renderScores();
startNewRound();
