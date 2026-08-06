/* ==========================================================================
   script.js
   - Main application logic for Smart Quiz App (vanilla JavaScript)
   - Features:
     - Navigation (Home -> Quiz -> Result)
     - Player name handling and localStorage
     - Subject selection
     - Loading questions from questions.js
     - Option selection and answer checking
     - Per-question timer with SVG progress circle
     - Progress bar and percentage
     - Score calculation and highest-score persistence
     - Result screen and restart/home actions
     - Dark mode toggle with persistence
     - Basic quiz progress persistence (resumable)
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
    questions: [], // references QUESTIONS[subject]
    total: 0,
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    timePerQuestion: 20, // fallback seconds
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
  function savePlayerToStorage(name) {
    localStorage.setItem(LS_PLAYER, name);
  }
  function loadPlayerFromStorage() {
    return localStorage.getItem(LS_PLAYER) || '';
  }
  function saveHighscoreToStorage(value) {
    localStorage.setItem(LS_HIGHSCORE, String(value));
  }
  function loadHighscoreFromStorage() {
    const v = localStorage.getItem(LS_HIGHSCORE);
    return v !== null ? Number(v) : 0;
  }
  function saveThemeToStorage(theme) {
    localStorage.setItem(LS_THEME, theme);
  }
  function loadThemeFromStorage() {
    return localStorage.getItem(LS_THEME) || null;
  }
  function saveProgressToStorage(progressObj) {
    localStorage.setItem(LS_PROGRESS, JSON.stringify(progressObj));
  }
  function loadProgressFromStorage() {
    try {
      const raw = localStorage.getItem(LS_PROGRESS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function clearProgressFromStorage() {
    localStorage.removeItem(LS_PROGRESS);
  }

  // Simple helper to show a page and hide others
  function showPage(page) {
    [homePage, quizPage, resultPage].forEach(p => p.hidden = true);
    page.hidden = false;
    // Keep 'active' class for CSS display toggles if needed
    [homePage, quizPage, resultPage].forEach(p => p.classList.remove('active'));
    page.classList.add('active');
  }

  // Update header highscore display
  function renderHighscore() {
    const high = loadHighscoreFromStorage();
    highscoreEl.textContent = `High Score: ${high || '—'}`;
  }

  // Apply theme from localStorage (or default to light)
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
    // Load saved player name
    const savedName = loadPlayerFromStorage();
    if (savedName) {
      inputName.value = savedName;
    }

    // Load theme
    const savedTheme = loadThemeFromStorage();
    applyTheme(savedTheme || 'light');

    // Render stored highscore
    renderHighscore();

    // Set up event listeners
    attachEventListeners();

    // Prepare timer path (SVG)
    if (timerPath && typeof timerPath.getTotalLength === 'function') {
      // compute path length once
      timerPathLength = timerPath.getTotalLength();
      timerPath.style.strokeDasharray = timerPathLength;
      timerPath.style.strokeDashoffset = timerPathLength;
    }

    // Enable/disable start button based on current inputs
    updateStartButtonState();

    // Check if there's a saved progress and inform developer (we'll ask on start)
    const progress = loadProgressFromStorage();
    if (progress) {
      // we won't auto-restore here; we'll prompt on start if player chooses same subject
      // This log is helpful during development
      // console.log('Found saved progress, will offer resume on start if applicable.', progress);
    }
  }

  // ---------- Event listeners ----------
  function attachEventListeners() {
    // Player name input: save to localStorage on input
    inputName.addEventListener('input', () => {
      const name = inputName.value.trim();
      if (name.length > 0) {
        savePlayerToStorage(name);
      } else {
        // optional: remove stored name when field is cleared
        localStorage.removeItem(LS_PLAYER);
      }
      updateStartButtonState();
    });

    // Subject buttons: toggle active
    subjectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        subjectButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateStartButtonState();
      });
    });

    // Start quiz
    startBtn.addEventListener('click', onStartQuiz);

    // Next question
    nextBtn.addEventListener('click', onNextQuestion);

    // Quit button -> go home (also saves progress)
    quitBtn.addEventListener('click', onQuit);

    // Theme toggle
    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveThemeToStorage(next);
    });

    // Restart and Home on result page
    restartBtn.addEventListener('click', () => {
      // Restart the same quiz from beginning
      startQuiz({ player: state.player, subject: state.subject, restart: true });
    });
    homeBtn.addEventListener('click', () => {
      clearProgressFromStorage();
      showHome();
    });

    // Keyboard accessibility: allow Enter to start if possible
    inputName.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' && !startBtn.disabled) {
        onStartQuiz();
      }
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

    // Save name (again)
    savePlayerToStorage(name);

    // Check for saved progress
    const saved = loadProgressFromStorage();
    if (saved && saved.player === name && saved.subject === subject && saved.currentIndex < saved.total) {
      // Offer resume using a confirm dialog for simplicity
      const resume = confirm('A saved quiz was found for you in this subject. Do you want to resume where you left off? Click OK to resume or Cancel to start a new quiz.');
      if (resume) {
        // restore
        startQuiz({ player: name, subject, resume: true, saved });
        return;
      } else {
        // clear saved progress and start fresh
        clearProgressFromStorage();
      }
    }

    startQuiz({ player: name, subject, restart: true });
  }

  // Start or resume a quiz
  // options: { player, subject, resume, saved, restart }
  function startQuiz(options = {}) {
    // Stop any running timers or timeouts
    clearTimer();
    clearAutoNextTimeout();

    // Reset state
    state.player = options.player;
    state.subject = options.subject;
    state.questions = (window.QUESTIONS && window.QUESTIONS[state.subject]) ? window.QUESTIONS[state.subject].slice() : [];
    state.total = state.questions.length;
    state.score = 0;
    state.correctCount = 0;
    state.wrongCount = 0;

    if (options.resume && options.saved) {
      // restore saved progress: we trust saved object shape
      state.currentIndex = Math.max(0, Math.min(options.saved.currentIndex, state.total - 1));
      state.score = options.saved.score || 0;
      state.correctCount = options.saved.correctCount || 0;
      state.wrongCount = options.saved.wrongCount || 0;
    } else {
      // fresh start
      state.currentIndex = 0;
    }

    // If there are no questions, bail out
    if (state.total === 0) {
      alert('No questions found for selected subject.');
      return;
    }

    // Update UI displays
    playerDisplay.textContent = `Player: ${state.player}`;
    subjectDisplay.textContent = `Subject: ${capitalize(state.subject)}`;

    // Persist progress immediately
    persistProgress();

    // Show quiz page
    showPage(quizPage);

    // Load the first/next question
    loadQuestion();
  }

  // Capitalize helper
  function capitalize(str = '') {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Load current question into UI
  function loadQuestion() {
    // Stop any previous timers or timeouts
    clearTimer();
    clearAutoNextTimeout();

    // Reset next button
    nextBtn.disabled = true;

    const idx = state.currentIndex;
    const qObj = state.questions[idx];
    if (!qObj) {
      // Nothing more - show results
      showResults();
      return;
    }

    // Show question number
    questionNumber.textContent = `Question ${idx + 1} / ${state.total}`;

    // Question text
    questionText.textContent = qObj.question;

    // Render options
    optionsList.innerHTML = '';
    qObj.options.forEach((optText, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.className = 'option';
      button.type = 'button';
      button.setAttribute('data-index', String(i));
      button.textContent = optText;
      // Accessibility
      button.setAttribute('aria-pressed', 'false');

      // click handler
      button.addEventListener('click', () => onSelectOption(i, button));

      li.appendChild(button);
      optionsList.appendChild(li);
    });

    // Update progress bar
    const percent = Math.round((idx / state.total) * 100);
    updateProgress(percent);

    // Prepare timer for question
    remainingTime = (typeof qObj.time === 'number' && qObj.time > 0) ? qObj.time : state.timePerQuestion;
    updateTimerUI(remainingTime);

    // Start timer countdown
    startTimer(remainingTime, qObj.time || state.timePerQuestion);
  }

  // Update progress bar UI
  function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
  }

  // Start timer for current question
  // totalSeconds - the total amount of seconds for the circle calculation (may match remaining)
  function startTimer(initialSeconds, totalSeconds) {
    // Ensure clearing previous timer
    clearTimer();

    let total = totalSeconds || initialSeconds;
    let left = initialSeconds;

    // Update circle initially
    updateTimerPath(left, total);

    // Update time text
    timeText.textContent = String(left).padStart(2, '0');

    timerInterval = setInterval(() => {
      left -= 1;
      if (left < 0) left = 0;
      remainingTime = left;
      updateTimerUI(left);
      updateTimerPath(left, total);

      if (left <= 0) {
        // Time's up: handle automatic answer reveal and move to next question
        clearTimer();
        // Mark as wrong and reveal correct answer
        markNoAnswer();
        // Save progress
        persistProgress();
        // Automatically go to next question after a short delay (1.2s)
        autoNextTimeout = setTimeout(() => {
          advanceToNext();
        }, 1200);
      }
    }, 1000);
  }

  // Update the circular timer path stroke offset
  function updateTimerPath(left, total) {
    if (!timerPath || !timerPathLength) return;
    const ratio = Math.max(0, Math.min(1, left / total));
    const offset = Math.round(timerPathLength * (1 - ratio));
    timerPath.style.strokeDashoffset = offset;
  }

  // Update timer text and accessibility label
  function updateTimerUI(seconds) {
    timeText.textContent = String(seconds).padStart(2, '0');
  }

  // Clear interval timer
  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Clear auto next timeout
  function clearAutoNextTimeout() {
    if (autoNextTimeout) {
      clearTimeout(autoNextTimeout);
      autoNextTimeout = null;
    }
  }

  // Called when user selects an option
  function onSelectOption(selectedIndex, buttonEl) {
    // Ignore if already answered (disable further clicks)
    if (nextBtn.disabled === false) return;

    // Stop timer
    clearTimer();
    clearAutoNextTimeout();

    // Mark selection visually
    qsa('.option').forEach(o => {
      o.classList.remove('selected');
      o.setAttribute('aria-pressed', 'false');
    });
    buttonEl.classList.add('selected');
    buttonEl.setAttribute('aria-pressed', 'true');

    // Check answer and show feedback
    checkAnswer(Number(selectedIndex));

    // Persist progress
    persistProgress();

    // Enable next button
    nextBtn.disabled = false;
  }

  // No answer (time ran out) -> reveal correct choice and mark wrong
  function markNoAnswer() {
    const idx = state.currentIndex;
    const qObj = state.questions[idx];
    // mark correct visually
    const correctIndex = qObj.answer;
    const correctBtn = optionsList.querySelector(`button[data-index="${correctIndex}"]`);
    if (correctBtn) {
      correctBtn.classList.add('correct');
    }
    // count as wrong
    state.wrongCount += 1;
    // Next button remains disabled in case we want to force auto-advance; but we allow manual
    nextBtn.disabled = false;
  }

  // Check answer and update score/state/UI
  function checkAnswer(selectedIndex) {
    const idx = state.currentIndex;
    const qObj = state.questions[idx];
    const correctIndex = qObj.answer;

    // Disable further option clicks by removing event listeners (simple approach: set pointer events none)
    qsa('.option').forEach(opt => opt.style.pointerEvents = 'none');

    if (selectedIndex === correctIndex) {
      // Correct
      const btn = optionsList.querySelector(`button[data-index="${selectedIndex}"]`);
      if (btn) btn.classList.add('correct');

      state.score += 1; // scoring: +1 per correct
      state.correctCount += 1;
    } else {
      // Wrong: mark selected wrong and reveal correct
      const selBtn = optionsList.querySelector(`button[data-index="${selectedIndex}"]`);
      if (selBtn) selBtn.classList.add('wrong');

      const correctBtn = optionsList.querySelector(`button[data-index="${correctIndex}"]`);
      if (correctBtn) correctBtn.classList.add('correct');

      state.wrongCount += 1;
    }

    // Update highscore live if exceeded
    const high = loadHighscoreFromStorage();
    if (state.score > high) {
      saveHighscoreToStorage(state.score);
      renderHighscore();
    }

    // also allow automatic next after short delay
    autoNextTimeout = setTimeout(() => {
      advanceToNext();
    }, 900);
  }

  // Advance to next question or end quiz
  function advanceToNext() {
    // Clear auto-next in case used manually
    clearAutoNextTimeout();

    // prepare next index
    state.currentIndex += 1;

    // If we've reached the end, show results
    if (state.currentIndex >= state.total) {
      // persist final state
      persistProgress(true); // true -> final
      showResults();
      return;
    }

    // persist progress
    persistProgress();

    // Reset option pointer events (so future options clickable)
    qsa('.option').forEach(opt => opt.style.pointerEvents = '');

    // Load next question
    loadQuestion();
  }

  // Handler for Next button (manual)
  function onNextQuestion() {
    // Prevent multiple clicks
    if (nextBtn.disabled) return;

    // Clear any running timers/timeouts
    clearTimer();
    clearAutoNextTimeout();

    // Advance
    advanceToNext();
  }

  // Quit handler: return home and optionally save progress
  function onQuit() {
    const confirmQuit = confirm('Do you want to quit the quiz? Your progress will be saved and you can resume later.');
    if (confirmQuit) {
      // Save progress and go home
      persistProgress();
      showHome();
    }
  }

  // Persist progress to localStorage
  // If finalFlag true, we mark progress as complete and may clear it
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
      // update highscore if needed, clear saved progress
      const storedHigh = loadHighscoreFromStorage();
      if (state.score > storedHigh) saveHighscoreToStorage(state.score);
      clearProgressFromStorage();
    } else {
      saveProgressToStorage(progress);
    }

    // update header highscore (in case changed)
    renderHighscore();
  }

  // Show result page
  function showResults() {
    // Stop timers
    clearTimer();
    clearAutoNextTimeout();

    // Compute final metrics
    const totalQ = state.total;
    const correct = state.correctCount;
    const wrong = state.wrongCount;
    const score = state.score;

    // Performance message based on percentage
    const percent = totalQ ? Math.round((correct / totalQ) * 100) : 0;
    let message = 'Keep learning and try again!';
    if (percent >= 90) message = 'Outstanding! You aced it!';
    else if (percent >= 70) message = 'Great job! Nearly perfect.';
    else if (percent >= 50) message = 'Good effort! Keep practicing.';
    else if (percent >= 30) message = 'Not bad — try again to improve.';

    // Update highscore if needed
    const storedHigh = loadHighscoreFromStorage();
    if (score > storedHigh) {
      saveHighscoreToStorage(score);
      renderHighscore();
    }

    // Populate result UI
    resultPlayer.textContent = state.player || '—';
    resultSubject.textContent = capitalize(state.subject);
    resultTotal.textContent = totalQ;
    resultCorrect.textContent = correct;
    resultWrong.textContent = wrong;
    resultScore.textContent = score;
    resultMessage.textContent = `${message} (${percent}%)`;

    // Clear saved progress now that quiz is complete
    clearProgressFromStorage();

    // Show result page
    showPage(resultPage);
  }

  // Show home page and restore some UI
  function showHome() {
    // Reset start button state
    updateStartButtonState();
    // Show home
    showPage(homePage);
  }

  // On DOM ready, call init
  document.addEventListener('DOMContentLoaded', init);

  // Expose some internals for debugging (optional)
  window.SmartQuiz = {
    getState: () => state,
    persistProgress,
    loadProgressFromStorage,
    clearProgressFromStorage,
  };
})();
