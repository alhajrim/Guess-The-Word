var WORDS = {
  easy: [
    {w:"CAT",c:"Animals"},{w:"DOG",c:"Animals"},{w:"SUN",c:"Nature"},
    {w:"TREE",c:"Nature"},{w:"FISH",c:"Animals"},{w:"BOOK",c:"Objects"},
    {w:"CAKE",c:"Food"},{w:"BIRD",c:"Animals"},{w:"STAR",c:"Nature"},
    {w:"RAIN",c:"Nature"},{w:"FROG",c:"Animals"},{w:"MILK",c:"Food"},
    {w:"DOOR",c:"Objects"},{w:"LAMP",c:"Objects"},{w:"DRUM",c:"Music"}
  ],
  medium: [
    {w:"JUNGLE",c:"Nature"},{w:"CASTLE",c:"Places"},{w:"PLANET",c:"Science"},
    {w:"BRIDGE",c:"Places"},{w:"SPIDER",c:"Animals"},{w:"MARKET",c:"Places"},
    {w:"WINTER",c:"Seasons"},{w:"GARDEN",c:"Nature"},{w:"BUTTER",c:"Food"},
    {w:"FOREST",c:"Nature"},{w:"ROCKET",c:"Science"},{w:"CANDLE",c:"Objects"},
    {w:"ISLAND",c:"Places"},{w:"VIOLIN",c:"Music"},{w:"COPPER",c:"Science"}
  ],
  hard: [
    {w:"ECLIPSE",c:"Science"},{w:"PHANTOM",c:"Mystery"},{w:"CHIMNEY",c:"Objects"},
    {w:"DROUGHT",c:"Nature"},{w:"LEOPARD",c:"Animals"},{w:"QUANTUM",c:"Science"},
    {w:"VOLTAGE",c:"Science"},{w:"HARBOUR",c:"Places"},{w:"SWAGGER",c:"Language"},
    {w:"GLIMPSE",c:"Language"},{w:"WARTHOG",c:"Animals"},{w:"CRYSTAL",c:"Nature"},
    {w:"PILGRIM",c:"History"},{w:"TYPHOON",c:"Nature"},{w:"SERPENT",c:"Animals"}
  ]
};

var CFG = {
  easy:   {time:90, maxWrong:6, base:500},
  medium: {time:60, maxWrong:5, base:500},
  hard:   {time:40, maxWrong:4, base:500}
};

var KEYS = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];

var g = {
  diff:"easy", word:"", cat:"", revealed:[], correct:[], wrong:[],
  wrongCount:0, hintsUsed:0, score:0, timeLeft:0, totalTime:0,
  timer:null, over:false, usedWords:[]
};

function getBest(diff) {
  return parseInt(localStorage.getItem("gtw_best_" + diff) || "0");
}

function saveBest(diff, score) {
  if (score > getBest(diff)) {
    localStorage.setItem("gtw_best_" + diff, score);
  }
}

function show(id) {
  document.querySelectorAll(".screen").forEach(function(s){ s.classList.remove("active"); });
  document.getElementById(id).classList.add("active");
}

function goMenu() {
  clearInterval(g.timer);
  refreshStats();
  show("s-menu");
}

function refreshStats() {
  var diffs = ["easy","medium","hard"];
  var anyData = false;
  diffs.forEach(function(d) {
    var best = getBest(d);
    var lastRaw = localStorage.getItem("gtw_last_" + d);
    if (!best && !lastRaw) return;
    anyData = true;
    var row = document.getElementById("stat-" + d);
    row.style.display = "flex";
    var label = d.charAt(0).toUpperCase() + d.slice(1);
    var bestTxt = best > 0 ? best : "—";
    var lastScore = "—", lastInfo = "—";
    if (lastRaw) {
      try {
        var p = JSON.parse(lastRaw);
        lastScore = p.score;
        lastInfo = p.word + " · " + (p.won ? "Won" : "Lost");
      } catch(e) {}
    }
    row.innerHTML =
      "<span class=\"stat-diff-label " + d + "\">" + label + "</span>" +
      "<div class=\"stat-block\">" +
        "<span class=\"stat-block-label\">Best</span>" +
        "<span class=\"stat-block-val best\">" + bestTxt + "</span>" +
      "</div>" +
      "<div class=\"stat-block\">" +
        "<span class=\"stat-block-label\">Last Round</span>" +
        "<span class=\"stat-block-val last\">" + lastScore + "</span>" +
        "<span class=\"stat-block-sub\">" + lastInfo + "</span>" +
      "</div>";
  });
  if (anyData) document.getElementById("stats-card").style.display = "block";
}

function saveLastRound(won, score, word, diff) {
  localStorage.setItem("gtw_last_" + diff, JSON.stringify({won:won, score:score, word:word}));
}

function pickDiff(d) {
  g.diff = d;
  document.querySelectorAll(".diff-btn").forEach(function(b){ b.classList.remove("active"); });
  document.querySelector("[data-d='" + d + "']").classList.add("active");
}

function startGame() {
  clearInterval(g.timer);

  var pool = WORDS[g.diff];
  var avail = pool.filter(function(p){ return g.usedWords.indexOf(p.w) === -1; });
  var pick = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : pool[Math.floor(Math.random() * pool.length)];
  g.usedWords = g.usedWords.concat([pick.w]).slice(-5);

  g.word = pick.w; g.cat = pick.c;
  g.revealed = Array(pick.w.length).fill(false);
  g.correct = []; g.wrong = [];
  g.wrongCount = 0; g.hintsUsed = 0;
  g.score = CFG[g.diff].base;
  g.timeLeft = CFG[g.diff].time;
  g.totalTime = CFG[g.diff].time;
  g.over = false;

  buildKeyboard();
  drawWord();
  drawTried();
  drawHints();
  updateHUD();
  setMsg("","");

  document.getElementById("cat-tag").textContent = pick.c;
  document.getElementById("diff-tag").textContent = g.diff.charAt(0).toUpperCase() + g.diff.slice(1);
  document.getElementById("guess-input").value = "";
  document.getElementById("guess-input").className = "guess-box";

  show("s-game");
  document.getElementById("guess-input").focus();
  runTimer();
}

function runTimer() {
  drawTimerUI();
  g.timer = setInterval(function(){
    if (g.over) return;
    g.timeLeft--;
    drawTimerUI();
    if (g.timeLeft <= 0) { clearInterval(g.timer); endGame(false, "Time's up!"); }
  }, 1000);
}

function drawTimerUI() {
  var el  = document.getElementById("timer-val");
  var bar = document.getElementById("timer-fill");
  bar.style.width = ((g.timeLeft / g.totalTime) * 100) + "%";
  el.textContent = g.timeLeft;
  el.className = "hud-val";
  if (g.timeLeft <= 10) { el.classList.add("urgent"); bar.style.background = "var(--red)"; }
  else if (g.timeLeft <= g.totalTime * 0.4) { el.classList.add("warn"); bar.style.background = "var(--yellow)"; }
  else { bar.style.background = "var(--accent)"; }
}

function drawWord() {
  var row = document.getElementById("word-row");
  row.innerHTML = "";
  for (var i = 0; i < g.word.length; i++) {
    var tile = document.createElement("div");
    if (g.word[i] === " ") {
      tile.style.width = "1rem";
    } else {
      tile.className = "tile " + (g.revealed[i] ? "found" : "blank");
      if (g.revealed[i]) tile.textContent = g.word[i];
    }
    row.appendChild(tile);
  }
}

function revealTile(idx, type) {
  var tiles = document.getElementById("word-row").children;
  if (tiles[idx]) { tiles[idx].className = "tile " + type; tiles[idx].textContent = g.word[idx]; }
}

function drawTried() {
  var row = document.getElementById("tried-row");
  row.innerHTML = "";
  g.correct.concat(g.wrong).sort().forEach(function(l){
    var tag = document.createElement("span");
    tag.className = "tried-tag " + (g.correct.indexOf(l) !== -1 ? "ok" : "bad");
    tag.textContent = l;
    row.appendChild(tag);
  });
}

function buildKeyboard() {
  var kb = document.getElementById("keyboard");
  kb.innerHTML = "";
  KEYS.forEach(function(row){
    var rowEl = document.createElement("div");
    rowEl.className = "key-row";
    row.split("").forEach(function(letter){
      var k = document.createElement("button");
      k.id = "k-" + letter;
      k.className = "key";
      k.textContent = letter;
      k.onclick = (function(l){ return function(){ guessLetter(l); }; })(letter);
      rowEl.appendChild(k);
    });
    kb.appendChild(rowEl);
  });
}

function colorKey(letter, cls) {
  var k = document.getElementById("k-" + letter);
  if (k) k.className = "key " + cls;
}

function updateHUD() {
  document.getElementById("score-val").textContent = Math.max(0, g.score);
  document.getElementById("wrong-val").textContent = g.wrongCount + "/" + CFG[g.diff].maxWrong;
}

function drawHints() {
  var dots = document.getElementById("hint-dots");
  dots.innerHTML = "";
  for (var i = 0; i < 3; i++) {
    var d = document.createElement("div");
    d.className = "hdot" + (i < g.hintsUsed ? " used" : "");
    dots.appendChild(d);
  }
  var left = 3 - g.hintsUsed;
  document.getElementById("hint-note").textContent = left + " hint" + (left !== 1 ? "s" : "") + " left · −50 pts each";
  document.getElementById("hint-btn").disabled = left <= 0;
}

function useHint() {
  if (g.over || g.hintsUsed >= 3) return;
  var options = [];
  for (var i = 0; i < g.word.length; i++) {
    if (g.word[i] !== " " && !g.revealed[i]) options.push(i);
  }
  if (options.length === 0) { setMsg("No more letters to reveal!", "info"); return; }

  var idx = options[Math.floor(Math.random() * options.length)];
  var letter = g.word[idx];

  for (var j = 0; j < g.word.length; j++) {
    if (g.word[j] === letter) { g.revealed[j] = true; revealTile(j, "hinted"); }
  }

  if (g.correct.indexOf(letter) === -1) g.correct.push(letter);
  colorKey(letter, "correct");
  g.hintsUsed++;
  g.score = Math.max(0, g.score - 50);
  g.timeLeft = Math.max(1, g.timeLeft - 5);
  drawHints(); drawTried(); updateHUD(); drawTimerUI();
  setMsg("Hint: \"" + letter + "\" revealed — −50 pts & −5 seconds", "hint");
  if (checkWin()) endGame(true);
}

function onKey(e) {
  if (e.key === "Enter") { e.preventDefault(); submitGuess(); }
}

function submitGuess() {
  if (g.over) return;
  var input = document.getElementById("guess-input");
  var val = input.value.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!val) return;
  input.value = "";
  if (val.length === 1) { guessLetter(val); } else { guessWord(val); }
  input.focus();
}

function guessLetter(letter) {
  if (g.over) return;
  if (g.correct.indexOf(letter) !== -1 || g.wrong.indexOf(letter) !== -1) {
    setMsg('"' + letter + '" was already guessed', "info"); return;
  }
  if (g.word.indexOf(letter) !== -1) {
    var count = 0;
    for (var i = 0; i < g.word.length; i++) {
      if (g.word[i] === letter) { g.revealed[i] = true; revealTile(i, "found"); count++; }
    }
    g.correct.push(letter);
    colorKey(letter, "correct");
    setMsg("Correct! \"" + letter + "\" — " + count + (count > 1 ? " letters" : " letter") + " revealed", "ok");
    flashBox("glow");
    drawTried(); updateHUD();
    if (checkWin()) endGame(true);
  } else {
    g.wrong.push(letter); g.wrongCount++;
    g.score = Math.max(0, g.score - 40);
    colorKey(letter, "wrong");
    setMsg("Wrong! \"" + letter + "\" is not in the word — −40 pts", "bad");
    flashBox("shake");
    drawTried(); updateHUD();
    if (g.wrongCount >= CFG[g.diff].maxWrong) endGame(false, "Too many wrong guesses!");
  }
}

function guessWord(word) {
  if (word === g.word) {
    for (var i = 0; i < g.word.length; i++) { g.revealed[i] = true; revealTile(i, "found"); }
    setMsg("You got it! Perfect guess!", "ok");
    endGame(true);
  } else {
    g.wrongCount++; g.score = Math.max(0, g.score - 40);
    setMsg('"' + word + '" is not the word — −40 pts', "bad");
    flashBox("shake"); updateHUD();
    if (g.wrongCount >= CFG[g.diff].maxWrong) endGame(false, "Too many wrong guesses!");
  }
}

function checkWin() {
  for (var i = 0; i < g.word.length; i++) {
    if (g.word[i] !== " " && !g.revealed[i]) return false;
  }
  return true;
}

function endGame(won, reason) {
  g.over = true;
  clearInterval(g.timer);
  if (won) {
    var timeBonus    = g.timeLeft * 3;
    var wrongPenalty = g.wrongCount * 40;
    var hintPenalty  = g.hintsUsed * 50;
    var final = Math.max(0, g.score + timeBonus);
    var newBest = final > getBest(g.diff);
    saveBest(g.diff, final);
    saveLastRound(true, final, g.word, g.diff);

    document.getElementById("win-word").textContent = g.word;
    document.getElementById("r-base").textContent   = CFG[g.diff].base;
    document.getElementById("r-time").textContent   = "+" + timeBonus;
    document.getElementById("r-wrong").textContent  = wrongPenalty > 0 ? "−" + wrongPenalty : "0";
    document.getElementById("r-hints").textContent  = hintPenalty  > 0 ? "−" + hintPenalty  : "0";
    document.getElementById("r-final").textContent  = final;
    document.getElementById("r-hs").textContent     = getBest(g.diff);
    document.getElementById("new-hs").className     = "new-hs" + (newBest ? " show" : "");
    setTimeout(function(){ show("s-win"); }, 600);
  } else {
    var finalScore = Math.max(0, g.score);
    saveBest(g.diff, finalScore);
    saveLastRound(false, finalScore, g.word, g.diff);
    for (var i = 0; i < g.word.length; i++) {
      if (!g.revealed[i] && g.word[i] !== " ") revealTile(i, "revealed");
      g.revealed[i] = true;
    }
    document.getElementById("lose-word").textContent = g.word;
    document.getElementById("l-final").textContent  = finalScore;
    document.getElementById("l-hs").textContent     = getBest(g.diff);
    if (reason) setMsg(reason, "bad");
    setTimeout(function(){ show("s-lose"); }, 900);
  }
}

function quitToMenu() { clearInterval(g.timer); goMenu(); }

function setMsg(text, type) {
  var el = document.getElementById("feedback");
  el.textContent = text;
  el.className = "feedback-line " + (type || "");
}

function flashBox(cls) {
  var input = document.getElementById("guess-input");
  input.classList.add(cls);
  setTimeout(function(){ input.classList.remove(cls); }, 400);
}

function openHelp()  { document.getElementById("overlay").classList.add("open"); }
function closeHelp() { document.getElementById("overlay").classList.remove("open"); }
function overlayClick(e) { if (e.target === document.getElementById("overlay")) closeHelp(); }

document.addEventListener("keydown", function(e){
  var gameOn = document.getElementById("s-game").classList.contains("active");
  if (!gameOn) return;
  var input = document.getElementById("guess-input");
  if (document.activeElement !== input && /^[a-zA-Z]$/.test(e.key)) input.focus();
});

refreshStats();
