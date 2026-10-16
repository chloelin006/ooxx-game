
// ======================================
// OOXX V4.0｜單人 AI 對戰完整版
// ======================================

// HTML 元素
const $ = id => document.getElementById(id);

const homeScreen = $("home-screen");
const rpsScreen = $("rps-screen");
const gameScreen = $("game-screen");

const cells = [...document.querySelectorAll(".cell")];
const difficultyButtons = [...document.querySelectorAll(".difficulty-btn")];

// 遊戲設定
let difficulty = "normal";
let phase = "home";
let board = Array(9).fill("");
let currentPlayer = "O";
let rpsWinner = null;
let aiTimer = null;

const STORAGE_KEY = "ooxx-v4-scores";

// 勝利組合
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

// 猜拳手勢
const hands = {
  rock: "✊",
  scissors: "✌️",
  paper: "✋"
};

// ======================================
// 比分儲存
// ======================================

function loadScores() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return {
      O: Number.isSafeInteger(data?.O) && data.O >= 0
        ? data.O : 0,
      X: Number.isSafeInteger(data?.X) && data.X >= 0
        ? data.X : 0
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
    // 無法儲存時仍可繼續遊戲
  }
}

function renderScores() {
  $("score-o").textContent = scores.O;
  $("score-x").textContent = scores.X;
}

// ======================================
// 共用功能
// ======================================

function showScreen(screen) {
  [homeScreen, rpsScreen, gameScreen].forEach(element => {
    element.classList.toggle("hidden", element !== screen);
  });
}

function clearAITimer() {
  if (aiTimer !== null) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
}

// ======================================
// 難度選擇
// ======================================

difficultyButtons.forEach(button => {
  button.addEventListener("click", () => {
    difficulty = button.dataset.level;

    difficultyButtons.forEach(btn => {
      btn.classList.toggle("selected", btn === button);
    });
  });
});

$("start-btn").addEventListener("click", () => {
  startRps();
});

$("change-level-btn").addEventListener("click", () => {
  clearAITimer();
  phase = "home";
  showScreen(homeScreen);
});

// ======================================
// 猜拳系統
// ======================================

function randomHand() {
  const options = Object.keys(hands);
  return options[Math.floor(Math.random() * options.length)];
}

function determineRpsWinner(player, ai) {
  if (player === ai) return null;

  const playerWins =
    (player === "rock" && ai === "scissors") ||
    (player === "scissors" && ai === "paper") ||
    (player === "paper" && ai === "rock");

  return playerWins ? "O" : "X";
}

function startRps() {
  clearAITimer();

  phase = "rps";
  rpsWinner = null;

  showScreen(rpsScreen);

  $("rps-message").textContent =
    "選擇剪刀、石頭或布，贏家先下棋！";

  $("rps-choices").classList.remove("hidden");
  $("rps-result").classList.add("hidden");
}

// 玩家選擇手勢
document.querySelectorAll("[data-hand]").forEach(button => {
  button.addEventListener("click", () => {
    if (phase !== "rps") return;

    phase = "rps-result";

    const playerHand = button.dataset.hand;
    const aiHand = randomHand();

    rpsWinner = determineRpsWinner(playerHand, aiHand);

    $("player-hand").textContent = hands[playerHand];
    $("ai-hand").textContent = hands[aiHand];

    $("rps-choices").classList.add("hidden");
    $("rps-result").classList.remove("hidden");

    if (rpsWinner === null) {
      $("rps-outcome").textContent = "平手！再猜一次 ♡";
      $("rps-next-btn").textContent = "重新猜拳 ↻";
    } else {
      $("rps-outcome").textContent =
        rpsWinner === "O"
          ? "你贏得先手啦！🎉"
          : "電腦贏得先手！🤖";

      $("rps-next-btn").textContent = "開始下棋 →";
    }
  });
});

$("rps-next-btn").addEventListener("click", () => {
  if (phase !== "rps-result") return;

  if (rpsWinner === null) {
    startRps();
  } else {
    startGame();
  }
});

// ======================================
// OOXX 勝負判斷
// ======================================

function getWinningLine(state, player) {
  return winningLines.find(line =>
    line.every(index => state[index] === player)
  ) || null;
}

function getResult(state) {
  const oLine = getWinningLine(state, "O");
  if (oLine) return { winner: "O", line: oLine };

  const xLine = getWinningLine(state, "X");
  if (xLine) return { winner: "X", line: xLine };

  if (state.every(value => value !== "")) {
    return { winner: "draw", line: null };
  }

  return null;
}

// ======================================
// 開始 OOXX
// ======================================

function startGame() {
  clearAITimer();

  board = Array(9).fill("");
  currentPlayer = rpsWinner;
  phase = "playing";

  showScreen(gameScreen);
  renderScores();
  renderBoard();

  if (currentPlayer === "O") {
    $("game-status").textContent = "輪到你下棋囉！";
  } else {
    $("game-status").textContent = "電腦先下棋 🤖";
    scheduleAIMove();
  }
}

// ======================================
// 棋盤顯示
// ======================================

function renderBoard() {
  const result = getResult(board);

  cells.forEach((cell, index) => {
    const value = board[index];

    cell.textContent = value;
    cell.className = "cell";

    if (value) {
      cell.classList.add(value.toLowerCase());
    }

    if (result?.line?.includes(index)) {
      cell.classList.add("win");
    }

    cell.disabled =
      phase !== "playing" ||
      currentPlayer !== "O" ||
      value !== "";

    cell.setAttribute(
      "aria-label",
      `第${index + 1}格，${value || "空白"}`
    );
  });
}

// ======================================
// 玩家下棋
// ======================================

cells.forEach(cell => {
  cell.addEventListener("click", () => {
    const index = Number(cell.dataset.index);

    if (phase !== "playing") return;
    if (currentPlayer !== "O") return;
    if (board[index] !== "") return;

    makeMove(index, "O");
  });
});

function makeMove(index, player) {
  if (phase !== "playing") return;
  if (currentPlayer !== player) return;
  if (board[index] !== "") return;

  board[index] = player;

  const result = getResult(board);

  if (result) {
    finishGame(result);
    return;
  }

  currentPlayer = player === "O" ? "X" : "O";
  renderBoard();

  if (currentPlayer === "X") {
    $("game-status").textContent = "電腦思考中... 🤖";
    scheduleAIMove();
  } else {
    $("game-status").textContent = "輪到你下棋囉！";
  }
}

// ======================================
// AI 自動下棋
// ======================================

function scheduleAIMove() {
  clearAITimer();

  aiTimer = setTimeout(() => {
    aiTimer = null;

    if (phase !== "playing" || currentPlayer !== "X") {
      return;
    }

    const move = getAIMove(board, difficulty);

    if (move !== null) {
      makeMove(move, "X");
    }
  }, 500);
}

function getEmptyCells(state) {
  return state
    .map((value, index) => value === "" ? index : null)
    .filter(index => index !== null);
}

function randomMove(state) {
  const options = getEmptyCells(state);

  if (!options.length) return null;

  return options[Math.floor(Math.random() * options.length)];
}

// ======================================
// 普通 AI：進攻與防守
// ======================================

function findImmediateWin(state, player) {
  for (const index of getEmptyCells(state)) {
    const copy = [...state];
    copy[index] = player;

    if (getWinningLine(copy, player)) {
      return index;
    }
  }

  return null;
}

function normalMove(state) {
  const win = findImmediateWin(state, "X");
  if (win !== null) return win;

  const block = findImmediateWin(state, "O");
  if (block !== null) return block;

  return randomMove(state);
}

// ======================================
// 困難 AI：Minimax 演算法
// ======================================

function minimax(state, player, depth) {
  const result = getResult(state);

  if (result) {
    if (result.winner === "X") return 10 - depth;
    if (result.winner === "O") return depth - 10;
    return 0;
  }

  const options = getEmptyCells(state);

  if (player === "X") {
    let bestScore = -Infinity;

    for (const index of options) {
      state[index] = "X";

      const score = minimax(state, "O", depth + 1);

      state[index] = "";
      bestScore = Math.max(bestScore, score);
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const index of options) {
    state[index] = "O";

    const score = minimax(state, "X", depth + 1);

    state[index] = "";
    bestScore = Math.min(bestScore, score);
  }

  return bestScore;
}

function hardMove(state) {
  const options = getEmptyCells(state);

  if (!options.length) return null;

  let bestScore = -Infinity;
  let bestMove = options[0];

  for (const index of options) {
    const copy = [...state];
    copy[index] = "X";

    const score = minimax(copy, "O", 1);

    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove;
}

function getAIMove(state, level) {
  if (level === "easy") return randomMove(state);
  if (level === "normal") return normalMove(state);
  return hardMove(state);
}

// ======================================
// 遊戲結束
// ======================================

function finishGame(result) {
  clearAITimer();
  phase = "finished";

  if (result.winner === "O") {
    scores.O++;
    $("game-status").textContent = "你贏啦！太棒了 🎉";
  } else if (result.winner === "X") {
    scores.X++;
    $("game-status").textContent = "電腦贏了！再挑戰一次 🤖";
  } else {
    $("game-status").textContent = "平手！勢均力敵 ♡";
  }

  saveScores();
  renderScores();
  renderBoard();
}

// ======================================
// 再玩一局
// ======================================

$("restart-btn").addEventListener("click", () => {
  startRps();
});

// ======================================
// 重置比分
// ======================================

$("reset-btn").addEventListener("click", () => {
  const confirmed = confirm("確定要清除所有比分嗎？");

  if (!confirmed) return;

  scores = { O: 0, X: 0 };
  saveScores();
  renderScores();
  startRps();
});

// ======================================
// 初始化
// ======================================

renderScores();
showScreen(homeScreen);
