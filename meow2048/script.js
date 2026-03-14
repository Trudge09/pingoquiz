/* ===== Meow2048 게임 로직 ===== */

// 고양이 단계 매핑
const CAT_MAP = {
  2:    { emoji: "🐣", name: "아기 고양이" },
  4:    { emoji: "🐱", name: "작은 고양이" },
  8:    { emoji: "😸", name: "장난꾸러기 고양이" },
  16:   { emoji: "😴", name: "졸린 고양이" },
  32:   { emoji: "😺", name: "통통 고양이" },
  64:   { emoji: "🙀", name: "왕 고양이" },
  128:  { emoji: "😻", name: "마법 고양이" },
  256:  { emoji: "🌙", name: "우주 고양이" },
  512:  { emoji: "⭐", name: "전설 고양이" },
  1024: { emoji: "🌟", name: "신화 고양이" },
  2048: { emoji: "👑", name: "고양이 신" },
};

// 게임 상태
let grid = [];        // 4x4 배열, 0이면 빈칸
let score = 0;
let bestScore = parseInt(localStorage.getItem("meow2048-best") || "0", 10);
let gameOver = false;
let won = false;
let wonAcknowledged = false;
let isMoving = false;

// DOM 요소
const tileLayer = document.getElementById("tile-layer");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const gameOverOverlay = document.getElementById("game-over-overlay");
const winOverlay = document.getElementById("win-overlay");
const finalScoreText = document.getElementById("final-score-text");

// 초기화
function init() {
  grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  score = 0;
  gameOver = false;
  won = false;
  wonAcknowledged = false;
  isMoving = false;
  gameOverOverlay.classList.remove("active");
  winOverlay.classList.remove("active");
  addRandomTile();
  addRandomTile();
  updateUI();
}

// 빈 셀 찾기
function getEmptyCells() {
  const cells = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 0) cells.push([r, c]);
  return cells;
}

// 랜덤 타일 추가
function addRandomTile() {
  const empty = getEmptyCells();
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  // 새 타일 위치 기록 (애니메이션용)
  addRandomTile._lastNew = [r, c];
}

// 한 줄 슬라이드 & 합치기 (왼쪽 방향 기준)
function slideLine(line) {
  const tiles = line.filter(v => v !== 0);
  const result = [];
  let gained = 0;
  let mergedPositions = [];

  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      result.push(merged);
      gained += merged;
      mergedPositions.push(result.length - 1);
      i++; // 다음 타일 건너뛰기
    } else {
      result.push(tiles[i]);
    }
  }

  while (result.length < 4) result.push(0);
  return { result, gained, mergedPositions };
}

// 그리드 이동
function move(direction) {
  if (gameOver || isMoving) return;
  isMoving = true;

  let totalGained = 0;
  let moved = false;
  const mergedCells = []; // 합쳐진 셀 좌표

  for (let i = 0; i < 4; i++) {
    let line = [];

    // 방향에 따라 라인 추출
    switch (direction) {
      case "left":
        line = [grid[i][0], grid[i][1], grid[i][2], grid[i][3]];
        break;
      case "right":
        line = [grid[i][3], grid[i][2], grid[i][1], grid[i][0]];
        break;
      case "up":
        line = [grid[0][i], grid[1][i], grid[2][i], grid[3][i]];
        break;
      case "down":
        line = [grid[3][i], grid[2][i], grid[1][i], grid[0][i]];
        break;
    }

    const { result, gained, mergedPositions } = slideLine(line);
    totalGained += gained;

    // 결과를 그리드에 배치
    for (let j = 0; j < 4; j++) {
      let r, c;
      switch (direction) {
        case "left":  r = i; c = j; break;
        case "right": r = i; c = 3 - j; break;
        case "up":    r = j; c = i; break;
        case "down":  r = 3 - j; c = i; break;
      }

      if (grid[r][c] !== result[j]) moved = true;
      grid[r][c] = result[j];

      if (mergedPositions.includes(j)) {
        mergedCells.push([r, c]);
      }
    }
  }

  if (!moved) {
    isMoving = false;
    return;
  }

  score += totalGained;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("meow2048-best", String(bestScore));
  }

  addRandomTile();
  updateUI(addRandomTile._lastNew, mergedCells);

  // 2048 달성 확인
  if (!wonAcknowledged) {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (grid[r][c] === 2048) {
          won = true;
          winOverlay.classList.add("active");
        }
  }

  // 게임오버 확인
  if (isGameOver()) {
    gameOver = true;
    finalScoreText.textContent = "최종 점수: " + score;
    gameOverOverlay.classList.add("active");
  }

  setTimeout(() => { isMoving = false; }, 120);
}

// 게임오버 판정
function isGameOver() {
  if (getEmptyCells().length > 0) return false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      if (c < 3 && v === grid[r][c + 1]) return false;
      if (r < 3 && v === grid[r + 1][c]) return false;
    }
  }
  return true;
}

// UI 업데이트 (타일 렌더링)
function updateUI(newCell, mergedCells) {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;

  // 보드 크기 계산
  const boardEl = document.getElementById("board");
  const boardRect = boardEl.getBoundingClientRect();
  const padding = 10;
  const gap = 10;
  const cellSize = (boardRect.width - padding * 2 - gap * 3) / 4;

  tileLayer.innerHTML = "";

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c];
      if (val === 0) continue;

      const cat = CAT_MAP[val] || { emoji: "🐱" };

      const tile = document.createElement("div");
      tile.className = "tile tile-" + val;

      // 새 타일 애니메이션
      if (newCell && newCell[0] === r && newCell[1] === c) {
        tile.classList.add("tile-new");
      }
      // 합쳐진 타일 애니메이션
      if (mergedCells) {
        for (const mc of mergedCells) {
          if (mc[0] === r && mc[1] === c) {
            tile.classList.add("tile-merged");
            break;
          }
        }
      }

      tile.style.width = cellSize + "px";
      tile.style.height = cellSize + "px";
      tile.style.top = (padding + r * (cellSize + gap)) + "px";
      tile.style.left = (padding + c * (cellSize + gap)) + "px";

      tile.innerHTML =
        '<span class="tile-emoji">' + cat.emoji + '</span>' +
        '<span class="tile-value">' + val + '</span>';

      tileLayer.appendChild(tile);
    }
  }
}

// ===== 이벤트 리스너 =====

// 키보드
document.addEventListener("keydown", function (e) {
  switch (e.key) {
    case "ArrowUp":    e.preventDefault(); move("up"); break;
    case "ArrowDown":  e.preventDefault(); move("down"); break;
    case "ArrowLeft":  e.preventDefault(); move("left"); break;
    case "ArrowRight": e.preventDefault(); move("right"); break;
  }
});

// 터치 스와이프
let touchStartX = 0, touchStartY = 0;
document.addEventListener("touchstart", function (e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", function (e) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (Math.max(absDx, absDy) < 30) return;

  if (absDx > absDy) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
}, { passive: true });

// 페이지 스크롤 방지 (모바일 스와이프 시)
document.addEventListener("touchmove", function (e) {
  e.preventDefault();
}, { passive: false });

// 버튼 이벤트
document.getElementById("restart-btn").addEventListener("click", init);
document.getElementById("gameover-restart-btn").addEventListener("click", init);
document.getElementById("replay-btn").addEventListener("click", init);
document.getElementById("continue-btn").addEventListener("click", function () {
  won = false;
  wonAcknowledged = true;
  winOverlay.classList.remove("active");
});

// 윈도우 리사이즈 시 타일 재렌더링
window.addEventListener("resize", function () { updateUI(); });

// 게임 시작!
init();
