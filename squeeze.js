const squeezeDesigns = [
  { threshold: 0,   name: "もちもちピンク",   type: "color", color: "#ffe3d9" },
  { threshold: 100, name: "ぷるぷるイエロー", type: "color", color: "#fff2b8" },
  { threshold: 200, name: "ふわふわブルー",   type: "color", color: "#cfe8f5" },
  { threshold: 300, name: "むにゅむにゅグリーン", type: "color", color: "#d9f0c8" },
  { threshold: 400, name: "とろとろパープル", type: "color", color: "#e6d9f5" },
  { threshold: 500, name: "ねこ",   type: "animal", emoji: "🐱", color: "#f5e0d0" },
  { threshold: 600, name: "うさぎ", type: "animal", emoji: "🐰", color: "#fde4ec" },
  { threshold: 700, name: "いぬ",   type: "animal", emoji: "🐶", color: "#f0e0cc" },
  { threshold: 800, name: "ひよこ", type: "animal", emoji: "🐥", color: "#fff6d0" },
  { threshold: 900, name: "ぱんだ", type: "animal", emoji: "🐼", color: "#f5f5f5" }
];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function getTodayString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

let dailyCount = Number(localStorage.getItem("dailyCount")) || 0;
let lastPlayedDate = localStorage.getItem("lastPlayedDate") || "";
let streakCount = Number(localStorage.getItem("streakCount")) || 0;

if (lastPlayedDate !== getTodayString()) {
  dailyCount = 0;

  if (lastPlayedDate === getYesterdayString()) {
    streakCount++;
  } else if (lastPlayedDate !== "") {
    streakCount = 1;
  } else {
    streakCount = 1;
  }

  lastPlayedDate = getTodayString();
  localStorage.setItem("dailyCount", dailyCount);
  localStorage.setItem("lastPlayedDate", lastPlayedDate);
  localStorage.setItem("streakCount", streakCount);
}

const dailyCounterEl = document.getElementById("daily-counter");
dailyCounterEl.textContent = dailyCount;
document.getElementById("streak-counter").textContent = streakCount;



let squeezeCount = Number(localStorage.getItem("squeezeCount")) || 0;
let clickTimestamps = [];   // 直近のクリック時刻を記録しておく配列
let comboCount = 0;         // 現在の連打数
let activeDesignIndex = Number(localStorage.getItem("activeDesignIndex")) || 0;

const squeezeEl = document.getElementById("squeeze");
const counterEl = document.getElementById("counter");

// 今のカウントで到達している最高レベルを計算する
function getCurrentLevelIndex() {
  let index = 0;
  squeezeDesigns.forEach((design, i) => {
    if (squeezeCount >= design.threshold) index = i;
  });
  return index;
}

// スクイーズを押したときの処理
  squeezeEl.addEventListener("click", () => {
  squeezeCount++;
  localStorage.setItem("squeezeCount", squeezeCount);
  counterEl.textContent = squeezeCount;

  dailyCount++;
  localStorage.setItem("dailyCount", dailyCount);
  dailyCounterEl.textContent = dailyCount;

  // 連打判定
  const now = Date.now();
  clickTimestamps.push(now);
  // 1秒(1000ミリ秒)より前のクリック記録は、もう「連打」に含めないので取り除く
  clickTimestamps = clickTimestamps.filter(time => now - time < 1000);
  comboCount = clickTimestamps.length;

  squeezeEl.classList.remove("squish");
  void squeezeEl.offsetWidth;
  squeezeEl.classList.add("squish");

  // 連打中(3回以上)は、震えるエフェクトを追加する
  if (comboCount >= 3) {
    squeezeEl.classList.add("combo-shake");
  } else {
    squeezeEl.classList.remove("combo-shake");
  }

  playRandomSound(comboCount);
  checkUnlock();
  renderStatus();
});

// ランダムな効果音を鳴らす(連打数が多いほど、音が高くなる)
// ランダムな効果音を鳴らす(連打数が多いほど、音が高くなる)
function playRandomSound(comboCount) {
  const types = ["プニッ", "キュッ", "モチッ"];
  const type = types[Math.floor(Math.random() * types.length)];

  // 新しく作らず、ページ全体で1つのaudioCtxを使う
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  let startFreq, endFreq, duration;
  if (type === "プニッ") { startFreq = 300; endFreq = 650; duration = 0.15; }
  else if (type === "キュッ") { startFreq = 600; endFreq = 950; duration = 0.1; }
  else { startFreq = 250; endFreq = 420; duration = 0.25; }

  const pitchBoost = 1 + Math.min(comboCount, 10) * 0.05;
  startFreq *= pitchBoost;
  endFreq *= pitchBoost;

  osc.type = "sine";
  osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}


// 新しいレベルが解放されたか確認する
function checkUnlock() {
  squeezeDesigns.forEach((design, index) => {
    if (squeezeCount === design.threshold && index !== 0) {
      alert(`🎉 新しいすくいーず「${design.name}」を手に入れた!`);
      activeDesignIndex = index;   // 解放と同時に、見た目もそのスキンに切り替える
      localStorage.setItem("activeDesignIndex", activeDesignIndex);
    }
  });
}

function renderStatus() {
  const levelIndex = getCurrentLevelIndex();
  const currentDesign = squeezeDesigns[levelIndex];
  const nextDesign = squeezeDesigns[levelIndex + 1];

  document.getElementById("level-title").textContent = `Lv.${levelIndex + 1} ${currentDesign.name}`;
  document.getElementById("unlocked-count").textContent = levelIndex + 1;

  if (nextDesign) {
    const range = nextDesign.threshold - currentDesign.threshold;
    const progress = squeezeCount - currentDesign.threshold;
    const percent = Math.floor((progress / range) * 100);

    document.getElementById("progress-text").textContent = `${nextDesign.name}まであと:${nextDesign.threshold - squeezeCount}回`;
    document.getElementById("progress-percent").textContent = `${percent}%`;
    document.getElementById("progress-bar-fill").style.width = percent + "%";
  } else {
    document.getElementById("progress-text").textContent = "すべてのすくいーずを手に入れた!";
    document.getElementById("progress-percent").textContent = "100%";
    document.getElementById("progress-bar-fill").style.width = "100%";
  }

  applyDesign(activeDesignIndex);
}

// 選んだデザインを、実際にスクイーズへ反映する
function applyDesign(index) {
  const design = squeezeDesigns[index];
  squeezeEl.style.background = design.color;

  const faceParts = squeezeEl.querySelectorAll(".highlight, .cheek, .eye, .mouth");
  const animalEmoji = document.getElementById("animal-emoji");

  if (design.type === "animal") {
    // 動物の場合、自作の顔パーツを隠し、絵文字を表示する
    faceParts.forEach(part => part.style.display = "none");
    animalEmoji.textContent = design.emoji;
    animalEmoji.style.display = "block";
  } else {
    // 無地の場合、自作の顔パーツを表示し、絵文字を隠す
    faceParts.forEach(part => part.style.display = "");
    animalEmoji.style.display = "none";
  }
}
  // 見た目(選択中のスキン)を反映する
  squeezeEl.style.background = squeezeDesigns[activeDesignIndex].color;


// 図鑑モーダルを開く
document.getElementById("open-collection-btn").addEventListener("click", () => {
  renderCollection();
  document.getElementById("collection-modal").classList.add("active");
});

document.getElementById("close-collection-btn").addEventListener("click", () => {
  document.getElementById("collection-modal").classList.remove("active");
});

// 図鑑の中身を表示する
function renderCollection() {
  const grid = document.getElementById("collection-grid");
  grid.innerHTML = "";

  squeezeDesigns.forEach((design, index) => {
    const unlocked = squeezeCount >= design.threshold;

    const item = document.createElement("div");
    item.className = "collection-item" + (unlocked ? "" : " locked") + (index === activeDesignIndex ? " active-item" : "");

    const previewContent = design.type === "animal" ? design.emoji : "";

    item.innerHTML = `
      <div class="shape-preview" style="background:${unlocked ? design.color : '#ccc'}; font-size:28px; display:flex; align-items:center; justify-content:center;">${unlocked ? previewContent : ""}</div>
      <div class="name">${unlocked ? design.name : "???(" + design.threshold + "回)"}</div>
    `;

    if (unlocked) {
      item.addEventListener("click", () => {
        activeDesignIndex = index;
        localStorage.setItem("activeDesignIndex", activeDesignIndex);
        renderStatus();
        renderCollection();
      });
    }

    grid.appendChild(item);
  });
}

// 初期表示
counterEl.textContent = squeezeCount;
renderStatus();

// 今日の気分で、解放済みの中からランダムに1つ選ぶ
document.getElementById("mood-pick-btn").addEventListener("click", () => {
  const unlockedIndexes = [];
  squeezeDesigns.forEach((design, index) => {
    if (squeezeCount >= design.threshold) unlockedIndexes.push(index);
  });

  const randomIndex = unlockedIndexes[Math.floor(Math.random() * unlockedIndexes.length)];
  activeDesignIndex = randomIndex;
  localStorage.setItem("activeDesignIndex", activeDesignIndex);

  applyDesign(activeDesignIndex);
  alert(`今日の気分は「${squeezeDesigns[randomIndex].name}」になりました!`);
});