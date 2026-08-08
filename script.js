/* ==========================================================================
   script.js (updated)
   - Main application logic for Smart Quiz App (vanilla JavaScript)
   - Added: shuffleOptionsInQuestions() to randomize option order per question
     on every NEW quiz start (but NOT when resuming).
   - This ensures the correct answer won't always appear at the same position.
   ========================================================================== */

(function () {
  // ---------- Local Storage keys ----------
  const LS_PLAYER = 'smartquiz_player';
  const LS_HIGHSCORE = 'smartquiz_highscore';
  const LS_THEME = 'smartquiz_theme';
  const LS_PROGRESS = 'smartquiz_progress'; // stores partial quiz state to allow resume

  // ---------- DOM Elements ----------
  const homePage = document.getElementById('home');
  const quizPage = document.getElementById('quiz');
  const resultPage = document.getElementById('result');

  const inputName = document.getElementById('player-name');
  const subjectButtons = Array.from(document.querySelectorAll('.subject-btn'));
  const startBtn = document.getElementById('start-quiz');

  const playerDisplay = document.getElementById('player-display');
  const subjectDisplay = document.getElementById('subject-display');
  const questionNumber = document.getElementById('question-number');
  const questionText = document.getElementById('question-text');
  const optionsList = document.getElementById('options');
  const nextBtn = document.getElementById('next-btn');
  const quitBtn = document.getElementById('quit-btn');

  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');

  const timerPath = document.getElementById('timer-progress');
  const timeText = document.getElementById('time-text');

  const highscoreEl = document.getElementById('highscore');
  const themeToggle = document.getElementById('theme-toggle');

  // Result elements
  const resultPlayer = document.getElementById('result-player');
  const resultSubject = document.getElementById('result-subject');
  const resultTotal = document.getElementById('result-total');
  const resultCorrect = document.getElementById('result-correct');
  const resultWrong = document.getElementById('result-wrong');
  const resultScore = document.getElementById('result-score');
  const resultMessage = document.getElementById('result-message');
  const restartBtn = document.getElementById('restart-btn');
  const homeBtn = document.getElementById('home-btn');

  // ---------- Quiz State ----------
  let state = {
    player: '',
    subject: '',
    questions: [],
    total: 0,
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    timePerQuestion: 20,
  };

  // Timer internals
  let timerInterval = null;
  let remainingTime = 0;
  let timerPathLength = 0;
  let autoNextTimeout = null;

  // ---------- Utility helpers ----------
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  // Save and load helpers
  function savePlayerToStorage(name) { localStorage.setItem(LS_PLAYER, name); }
  function loadPlayerFromStorage() { return localStorage.getItem(LS_PLAYER) || ''; }
  function saveHighscoreToStorage(value) { localStorage.setItem(LS_HIGHSCORE, String(value)); }
  function loadHighscoreFromStorage() { const v = localStorage.getItem(LS_HIGHSCORE); return v !== null ? Number(v) : 0; }
  function saveThemeToStorage(theme) { localStorage.setItem(LS_THEME, theme); }
  function loadThemeFromStorage() { return localStorage.getItem(LS_THEME) || null; }
  function saveProgressToStorage(progressObj) { localStorage.setItem(LS_PROGRESS, JSON.stringify(progressObj)); }
  function loadProgressFromStorage() { try { const raw = localStorage.getItem(LS_PROGRESS); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function clearProgressFromStorage() { localStorage.removeItem(LS_PROGRESS); }

  // Shuffle array in-place (Fisher-Yates)
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // This function creates a deep-ish copy of questions array and shuffles options
  // for each question, updating the answer index accordingly.
  // We return a NEW array (do not modify original QUESTIONS object).
  function shuffleOptionsInQuestions(questions) {
    return questions.map(q => {
      // Copy question object shallowly
      const copy = {
        question: q.question,
        // copy options into array of {text, originalIndex}
        options: q.options.map((opt, idx) => ({ text: opt, origIdx: idx })),
        // We'll set answer later
        answer: 0,
        time: q.time
      };

      // Shuffle options array
      shuffleArray(copy.options);

      // Find where the original correct option moved to, set new answer index
      const origCorrectIdx = q.answer; // original index (0-based)
      const newIndex = copy.options.findIndex(o => o.origIdx === origCorrectIdx);

      // Map options to plain strings and set correct answer index
      copy.answer = newIndex >= 0 ? newIndex : 0;
      copy.options = copy.options.map(o => o.text);

      return copy;
    });
  }

  // Simple helper to show a page and hide others
  function showPage(page) {
    [homePage, quizPage, resultPage].forEach(p => p.hidden = true);
    page.hidden = false;
    [homePage, quizPage, resultPage].forEach(p => p.classList.remove('active'));
    page.classList.add('active');
  }

  // Update header highscore display
  function renderHighscore() {
    const high = loadHighscoreFromStorage();
    highscoreEl.textContent = `High Score: ${high || '—'}`;
  }

  // Apply theme
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      themeToggle.setAttribute('aria-pressed', 'true');
      themeToggle.querySelector('.theme-icon').textContent = '☀️';
    } else {
      document.body.setAttribute('data-theme', 'light');
      themeToggle.setAttribute('aria-pressed', 'false');
      themeToggle.querySelector('.theme-icon').textContent = '🌙';
    }
  }

  // ---------- Initialization ----------
  function init() {
    const savedName = loadPlayerFromStorage();
    if (savedName) inputName.value = savedName;

    const savedTheme = loadThemeFromStorage();
    applyTheme(savedTheme || 'light');

    renderHighscore();
    attachEventListeners();

    if (timerPath && typeof timerPath.getTotalLength === 'function') {
      timerPathLength = timerPath.getTotalLength();
      timerPath.style.strokeDasharray = timerPathLength;
      timerPath.style.strokeDashoffset = timerPathLength;
    }

    updateStartButtonState();
  }

  // ---------- Event listeners ----------
  function attachEventListeners() {
    inputName.addEventListener('input', () => {
      const name = inputName.value.trim();
      if (name.length > 0) savePlayerToStorage(name);
      else localStorage.removeItem(LS_PLAYER);
      updateStartButtonState();
    });

    subjectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        subjectButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateStartButtonState();
      });
    });

    startBtn.addEventListener('click', onStartQuiz);
    nextBtn.addEventListener('click', onNextQuestion);
    quitBtn.addEventListener('click', onQuit);

    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveThemeToStorage(next);
    });

    restartBtn.addEventListener('click', () => {
      // restart should create a brand new quiz (reshuffle options again)
      startQuiz({ player: state.player, subject: state.subject, restart: true });
    });
    homeBtn.addEventListener('click', () => {
      clearProgressFromStorage();
      showHome();
    });

    inputName.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' && !startBtn.disabled) onStartQuiz();
    });
  }

  // Enable Start button only if name and a subject are selected
  function updateStartButtonState() {
    const name = inputName.value.trim();
    const subject = subjectButtons.find(b => b.classList.contains('active'));
    startBtn.disabled = !(name && subject);
  }

  // Handler: Start Quiz button clicked
  function onStartQuiz() {
    const name = inputName.value.trim();
    const subjectBtn = subjectButtons.find(b => b.classList.contains('active'));
    if (!name || !subjectBtn) return;

    const subject = subjectBtn.getAttribute('data-subject');
    savePlayerToStorage(name);

    const saved = loadProgressFromStorage();
    if (saved && saved.player === name && saved.subject === subject && saved.currentIndex < saved.total) {
      const resume = confirm('A saved quiz was found for you in this subject. Do you want to resume where you left off? Click OK to resume or Cancel to start a new quiz.');
      if (resume) {
        startQuiz({ player: name, subject, resume: true, saved });
        return;
      } else {
        clearProgressFromStorage();
      }
    }

    // Start a NEW quiz (restart true) -> options will be shuffled
    startQuiz({ player: name, subject, restart: true });
  }

  // Start or resume a quiz
  // options: { player, subject, resume, saved, restart }
  function startQuiz(options = {}) {
    // Stop any running timers or timeouts
    clearTimer();
    clearAutoNextTimeout();

    // Reset state (we'll overwrite questions below)
    state.player = options.player;
    state.subject = options.subject;

    // Read questions from global QUESTIONS object
    const originalQuestions = (window.QUESTIONS && window.QUESTIONS[state.subject]) ? window.QUESTIONS[state.subject] : [];

    // If starting a NEW quiz (not resuming), we create shuffled-copies of questions with shuffled options.
    // If resuming, we want to keep the saved state as-is (no reshuffle), so we restore original order/options.
    let preparedQuestions = [];
    if (options.resume && options.saved) {
      // Use originalQuestions (copy) without shuffling options, in order to match saved progress
      preparedQuestions = originalQuestions.map(q => ({
        question: q.question,
        options: q.options.slice(),
        answer: q.answer,
        time: q.time
      }));
    } else {
      // Fresh start or restart: shuffle options so answers appear in different positions each time
      preparedQuestions = shuffleOptionsInQuestions(originalQuestions);
      // Optional: you could also shuffle question order if you want:
      // shuffleArray(preparedQuestions);
    }

    state.questions = preparedQuestions;
    state.total = state.questions.length;
    state.score = 0;
    state.correctCount = 0;
    state.wrongCount = 0;

    if (options.resume && options.saved) {
      // restore progress values (but be careful: options weren't shuffled)
      state.currentIndex = Math.max(0, Math.min(options.saved.currentIndex, state.total - 1));
      state.score = options.saved.score || 0;
      state.correctCount = options.saved.correctCount || 0;
      state.wrongCount = options.saved.wrongCount || 0;
    } else {
      // fresh start
      state.currentIndex = 0;
    }

    if (state.total === 0) {
      alert('No questions found for selected subject.');
      return;
    }

    // Update UI displays
    playerDisplay.textContent = `Player: ${state.player}`;
    subjectDisplay.textContent = `Subject: ${capitalize(state.subject)}`;

    // Persist progress immediately (so resume will find it)
    persistProgress();

    // Show quiz page and load first question
    showPage(quizPage);
    loadQuestion();
  }

  // Capitalize helper
  function capitalize(str = '') {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Load current question into UI
  function loadQuestion() {
    // Stop timers
    clearTimer();
    clearAutoNextTimeout();

    // Reset next button
    nextBtn.disabled = true;

    const idx = state.currentIndex;
    const qObj = state.questions[idx];
    if (!qObj) {
      showResults();
      return;
    }

    // Show question number and text
    questionNumber.textContent = `Question ${idx + 1} / ${state.total}`;
    questionText.textContent = qObj.question;

    // Render options (options already shuffled when quiz prepared)
    optionsList.innerHTML = '';
    qObj.options.forEach((optText, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.className = 'option';
      button.type = 'button';
      button.setAttribute('data-index', String(i));
      button.textContent = optText;
      button.setAttribute('aria-pressed', 'false');

      button.addEventListener('click', () => onSelectOption(i, button));

      li.appendChild(button);
      optionsList.appendChild(li);
    });

    // Update progress bar
    const percent = Math.round((idx / state.total) * 100);
    updateProgress(percent);

    // Timer for this question
    remainingTime = (typeof qObj.time === 'number' && qObj.time > 0) ? qObj.time : state.timePerQuestion;
    updateTimerUI(remainingTime);
    startTimer(remainingTime, qObj.time || state.timePerQuestion);
  }

  // Update progress bar UI
  function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
  }

  // Timer functions
  function startTimer(initialSeconds, totalSeconds) {
    clearTimer();

    let total = totalSeconds || initialSeconds;
    let left = initialSeconds;

    updateTimerPath(left, total);
    timeText.textContent = String(left).padStart(2, '0');

    timerInterval = setInterval(() => {
      left -= 1;
      if (left < 0) left = 0;
      remainingTime = left;
      updateTimerUI(left);
      updateTimerPath(left, total);

      if (left <= 0) {
        clearTimer();
        markNoAnswer();
        persistProgress();
        autoNextTimeout = setTimeout(() => {
          advanceToNext();
        }, 1200);
      }
    }, 1000);
  }

  function updateTimerPath(left, total) {
    if (!timerPath || !timerPathLength) return;
    const ratio = Math.max(0, Math.min(1, left / total));
    const offset = Math.round(timerPathLength * (1 - ratio));
    timerPath.style.strokeDashoffset = offset;
  }

  function updateTimerUI(seconds) {
    timeText.textContent = String(seconds).padStart(2, '0');
  }

  function clearTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
  function clearAutoNextTimeout() { if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; } }

  // Option selection
  function onSelectOption(selectedIndex, buttonEl) {
    // Prevent double select
    if (nextBtn.disabled === false) return;

    clearTimer();
    clearAutoNextTimeout();

    // visually mark selected item
    qsa('.option').forEach(o => {
      o.classList.remove('selected');
      o.setAttribute('aria-pressed', 'false');
    });
    buttonEl.classList.add('selected');
    buttonEl.setAttribute('aria-pressed', 'true');

    // check answer and update state
    checkAnswer(Number(selectedIndex));
    persistProgress();
    nextBtn.disabled = false;
  }

  // No answer (time out)
  function markNoAnswer() {
    const idx = state.currentIndex;
    const qObj = state.questions[idx];
    const correctIndex = qObj.answer;
    const correctBtn = optionsList.querySelector(`button[data-index="${correctIndex}"]`);
    if (correctBtn) correctBtn.classList.add('correct');
    state.wrongCount += 1;
    nextBtn.disabled = false;
  }

  // Check selected answer
  function checkAnswer(selectedIndex) {
    const idx = state.currentIndex;
    const qObj = state.questions[idx];
    const correctIndex = qObj.answer;

    // disable further clicks
    qsa('.option').forEach(opt => opt.style.pointerEvents = 'none');

    if (selectedIndex === correctIndex) {
      const btn = optionsList.querySelector(`button[data-index="${selectedIndex}"]`);
      if (btn) btn.classList.add('correct');
      state.score += 1;
      state.correctCount += 1;
    } else {
      const selBtn = optionsList.querySelector(`button[data-index="${selectedIndex}"]`);
      if (selBtn) selBtn.classList.add('wrong');
      const correctBtn = optionsList.querySelector(`button[data-index="${correctIndex}"]`);
      if (correctBtn) correctBtn.classList.add('correct');
      state.wrongCount += 1;
    }

    const high = loadHighscoreFromStorage();
    if (state.score > high) {
      saveHighscoreToStorage(state.score);
      renderHighscore();
    }

    // auto next after short delay
    autoNextTimeout = setTimeout(() => {
      advanceToNext();
    }, 900);
  }

  // Advance to next question or result
  function advanceToNext() {
    clearAutoNextTimeout();
    state.currentIndex += 1;

    if (state.currentIndex >= state.total) {
      persistProgress(true);
      showResults();
      return;
    }

    persistProgress();
    qsa('.option').forEach(opt => opt.style.pointerEvents = '');
    loadQuestion();
  }

  function onNextQuestion() {
    if (nextBtn.disabled) return;
    clearTimer();
    clearAutoNextTimeout();
    advanceToNext();
  }

  function onQuit() {
    const confirmQuit = confirm('Do you want to quit the quiz? Your progress will be saved and you can resume later.');
    if (confirmQuit) {
      persistProgress();
      showHome();
    }
  }

  // Persist progress to localStorage
  function persistProgress(finalFlag = false) {
    const progress = {
      player: state.player,
      subject: state.subject,
      currentIndex: state.currentIndex,
      total: state.total,
      score: state.score,
      correctCount: state.correctCount,
      wrongCount: state.wrongCount,
      timestamp: Date.now()
    };

    if (finalFlag) {
      const storedHigh = loadHighscoreFromStorage();
      if (state.score > storedHigh) saveHighscoreToStorage(state.score);
      clearProgressFromStorage();
    } else {
      saveProgressToStorage(progress);
    }
    renderHighscore();
  }

  // Show results screen
  function showResults() {
    clearTimer();
    clearAutoNextTimeout();

    const totalQ = state.total;
    const correct = state.correctCount;
    const wrong = state.wrongCount;
    const score = state.score;
    const percent = totalQ ? Math.round((correct / totalQ) * 100) : 0;
    let message = 'Keep learning and try again!';
    if (percent >= 90) message = 'Outstanding! You aced it!';
    else if (percent >= 70) message = 'Great job! Nearly perfect.';
    else if (percent >= 50) message = 'Good effort! Keep practicing.';
    else if (percent >= 30) message = 'Not bad — try again to improve.';

    const storedHigh = loadHighscoreFromStorage();
    if (score > storedHigh) {
      saveHighscoreToStorage(score);
      renderHighscore();
    }

    resultPlayer.textContent = state.player || '—';
    resultSubject.textContent = capitalize(state.subject);
    resultTotal.textContent = totalQ;
    resultCorrect.textContent = correct;
    resultWrong.textContent = wrong;
    resultScore.textContent = score;
    resultMessage.textContent = `${message} (${percent}%)`;

    clearProgressFromStorage();
    showPage(resultPage);
  }

  function showHome() {
    updateStartButtonState();
    showPage(homePage);
  }

  document.addEventListener('DOMContentLoaded', init);

  // Optional debug API
  window.SmartQuiz = {
    getState: () => state,
    persistProgress,
    loadProgressFromStorage,
    clearProgressFromStorage,
  };
})();
