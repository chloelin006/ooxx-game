
// ============================================
// OOXX V4.1｜AI 對戰完整遊戲
// ============================================

// 取得 HTML 元素
const $ = id => document.getElementById(id);

const screens = [
  "home-screen",
  "rps-screen",
  "result-screen",
  "game-screen"
];

const cells = [...document.querySelectorAll(".cell")];
const difficultyButtons = [
  ...document.querySelectorAll(".difficulty-card")
];

// 遊戲狀態
let difficulty = "normal";
let phase = "home";
let board = Array(9).fill("");
let currentPlayer = "O";
let rpsWinner = null;
let aiTimer = null;

// 儲存比分的名稱
const STORAGE_KEY = "ooxx-v41-scores";

// 手勢資訊
const hands = {
  rock: { symbol: "✊", name: "石頭" },
  scissors: { symbol: "✌️", name: "剪刀" },
  paper: { symbol: "✋", name: "布" }
};

// 八種獲勝連線
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

// ============================================
// 畫面切換
// ============================================

function showScreen(id) {
  screens.forEach(screenId => {
    $(screenId).classList.toggle(
      "hidden",
      screenId !== id
    );
  });
}

function clearAITimer() {
  if (aiTimer !== null) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
}

function showHome() {
  clearAITimer();
  phase = "home";
  showScreen("home-screen");
}

// ============================================
// 比分紀錄
// ============================================

function loadScores() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(scores)
    );
  } catch {
    // 無法儲存時，仍可正常遊戲
  }
}

function renderScores() {
  $("score-o").textContent = scores.O;
  $("score-x").textContent = scores.X;
}

// ============================================
// 選擇 AI 難度
// ============================================

difficultyButtons.forEach(button => {
  button.addEventListener("click", () => {
    difficulty = button.dataset.level;

    difficultyButtons.forEach(item => {
      const selected = item === button;

      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
  });
});

$("start-btn").addEventListener("click", startRps);

$("rps-back-btn").addEventListener("click", showHome);

$("change-level-btn").addEventListener("click", showHome);

// ============================================
// 猜拳系統
// ============================================

function randomHand() {
  const options = ["rock", "scissors", "paper"];
  return options[Math.floor(Math.random() * options.length)];
}

function determineRpsWinner(playerHand, aiHand) {
  if (playerHand === aiHand) {
    return null;
  }

  const playerWins =
    (playerHand === "rock" && aiHand === "scissors") ||
    (playerHand === "scissors" && aiHand === "paper") ||
    (playerHand === "paper" && aiHand === "rock");

  return playerWins ? "O" : "X";
}

function startRps() {
  clearAITimer();

  phase = "rps";
  rpsWinner = null;

  $("rps-message").innerHTML =
    "猜拳決定誰先下棋<br>贏家可以優先出手！";

  showScreen("rps-screen");
}

// 玩家選擇石頭、剪刀或布
document.querySelectorAll("[data-hand]").forEach(button => {
  button.addEventListener("click", () => {
    if (phase !== "rps") return;

    phase = "rps-result";

    const playerHand = button.dataset.hand;
    const aiHand = randomHand();

    rpsWinner = determineRpsWinner(playerHand, aiHand);

    $("player-hand").textContent = hands[playerHand].symbol;
    $("player-hand-name").textContent = hands[playerHand].name;

    $("ai-hand").textContent = hands[aiHand].symbol;
    $("ai-hand-name").textContent = hands[aiHand].name;

    if (rpsWinner === "O") {
      $("outcome-decoration").textContent = "✦";
      $("rps-outcome").textContent = "你贏了！";
      $("outcome-description").textContent =
        "你獲得先手，可以先下棋囉！";
      $("rps-next-btn").textContent = "開始下棋 →";

    } else if (rpsWinner === "X") {
      $("outcome-decoration").textContent = "◇";
      $("rps-outcome").textContent = "電腦贏了！";
      $("outcome-description").textContent =
        "這局由電腦先下棋，準備迎接挑戰！";
      $("rps-next-btn").textContent = "開始下棋 →";

    } else {
      $("outcome-decoration").textContent = "♡";
      $("rps-outcome").textContent = "平手！";
      $("outcome-description").textContent =
        "你們出了相同的手勢，再猜一次吧！";
      $("rps-next-btn").textContent = "重新猜拳 ↻";
    }

    showScreen("result-screen");
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

// ============================================
// OOXX 勝負判斷
// ============================================

function getWinningLine(state, player) {
  return winningLines.find(line =>
    line.every(index => state[index] === player)
  ) || null;
}

function getResult(state) {
  const oLine = getWinningLine(state, "O");

  if (oLine) {
    return { winner: "O", line: oLine };
  }

  const xLine = getWinningLine(state, "X");

  if (xLine) {
    return { winner: "X", line: xLine };
  }

  if (state.every(cell => cell !== "")) {
    return { winner: "draw", line: null };
  }

  return null;
}

// ============================================
// 開始 OOXX
// ============================================

function startGame() {
  clearAITimer();

  board = Array(9).fill("");
  currentPlayer = rpsWinner;
  phase = "playing";

  const levelNames = {
    easy: "簡單難度",
    normal: "普通難度",
    hard: "困難難度"
  };

  $("level-display").textContent = levelNames[difficulty];

  // 遊戲開始時隱藏重玩按鈕
  $("restart-btn").classList.add("hidden");

  renderScores();
  renderBoard();
  showScreen("game-screen");

  if (currentPlayer === "O") {
    $("game-status").textContent = "輪到你下棋囉！";
  } else {
    $("game-status").textContent = "電腦先下棋...";
    scheduleAIMove();
  }
}

// ============================================
// 棋盤顯示
// ============================================

function renderBoard() {
  const result = getResult(board);

  cells.forEach((cell, index) => {
    const value = board[index];

    cell.textContent = value;
    cell.className = "cell";

    if (value === "O") {
      cell.classList.add("o");
    } else if (value === "X") {
      cell.classList.add("x");
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

// ============================================
// 玩家下棋
// ============================================

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
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    return;
  }
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
    $("game-status").textContent = "電腦思考中...";
    scheduleAIMove();
  } else {
    $("game-status").textContent = "輪到你下棋囉！";
  }
}

// ============================================
// AI 下棋控制
// ============================================

function scheduleAIMove() {
  clearAITimer();

  aiTimer = setTimeout(() => {
    aiTimer = null;

    if (phase !== "playing") return;
    if (currentPlayer !== "X") return;

    const move = getAIMove(board, difficulty);

    if (move !== null) {
      makeMove(move, "X");
    }
  }, 550);
}

function getEmptyCells(state) {
  return state
    .map((value, index) => value === "" ? index : null)
    .filter(index => index !== null);
}

function randomMove(state) {
  const options = getEmptyCells(state);

  if (options.length === 0) return null;

  return options[Math.floor(Math.random() * options.length)];
}

// ============================================
// 普通 AI：優先進攻與防守
// ============================================

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
  // 1. 電腦能獲勝就先獲勝
  const win = findImmediateWin(state, "X");
  if (win !== null) return win;

  // 2. 阻擋玩家即將連線
  const block = findImmediateWin(state, "O");
  if (block !== null) return block;

  // 3. 其餘情況隨機選擇
  return randomMove(state);
}

// ============================================
// 困難 AI：Minimax 演算法
// ============================================

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

  if (options.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves = [];

  for (const index of options) {
    const copy = [...state];
    copy[index] = "X";

    const score = minimax(copy, "O", 1);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [index];
    } else if (score === bestScore) {
      bestMoves.push(index);
    }
  }

  // 同樣最佳的走法中隨機選一個
  return bestMoves[
    Math.floor(Math.random() * bestMoves.length)
  ];
}

function getAIMove(state, level) {
  if (level === "easy") {
    return randomMove(state);
  }

  if (level === "normal") {
    return normalMove(state);
  }

  return hardMove(state);
}

// ============================================
// 遊戲結束
// ============================================

function finishGame(result) {
  clearAITimer();
  phase = "finished";

  if (result.winner === "O") {
    scores.O++;
    $("game-status").textContent = "你贏了！恭喜 ♡";

  } else if (result.winner === "X") {
    scores.X++;
    $("game-status").textContent =
      "這次電腦贏了，再挑戰一次吧！";

  } else {
    $("game-status").textContent =
      "平手！這是一場精彩的對決。";
  }

  saveScores();
  renderScores();
  renderBoard();

  $("restart-btn").classList.remove("hidden");
}

// ============================================
// 再玩一局
// ============================================

$("restart-btn").addEventListener("click", () => {
  if (phase !== "finished") return;

  // 保留比分，重新猜拳
  startRps();
});

// ============================================
// 重置比分
// ============================================

$("reset-btn").addEventListener("click", () => {
  const confirmed = confirm(
    "確定要清除玩家與電腦的累積比分嗎？"
  );

  if (!confirmed) return;

  scores = { O: 0, X: 0 };

  saveScores();
  renderScores();

  // 清除比分後重新猜拳
  startRps();
});

// ============================================
// 初始化
// ============================================

renderScores();
showHome();
