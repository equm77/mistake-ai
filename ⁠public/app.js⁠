let store = JSON.parse(localStorage.getItem('mistake_ai_db')) || {
  mistakes: [],
  settings: { language: 'auto', target: 5 }
};

let currentSelectedFile = null;
let currentVerificationData = null;
let currentAnalysisResult = null;

function saveStore() {
  localStorage.setItem('mistake_ai_db', JSON.stringify(store));
  updateStats();
}

function navTo(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(`view-${viewId}`).classList.add('active');
  const activeNav = document.getElementById(`nav-${viewId}`);
  if (activeNav) activeNav.classList.add('active');

  if (viewId === 'mistakes') renderLibrary();
  if (viewId === 'review') renderReview();
  if (viewId === 'progress') renderProgress();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  currentSelectedFile = file;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('image-preview').src = e.target.result;
    document.getElementById('image-preview-container').classList.remove('hidden');
    const btn = document.getElementById('btn-recognize');
    btn.classList.remove('disabled');
    btn.disabled = false;
  };
  reader.readAsDataURL(file);
}

async function startRecognition() {
  if (!currentSelectedFile) return;

  showLoading('Reading question from image...');
  const formData = new FormData();
  formData.append('image', currentSelectedFile);
  formData.append('subject', document.getElementById('subject-select').value);

  try {
    const res = await fetch('/api/recognize', { method: 'POST', body: formData });
    const data = await res.json();
    hideLoading();

    if (!data.is_clear) {
      alert(data.unclear_message || 'The image is unclear. Please retake the photo with better lighting.');
      return;
    }

    currentVerificationData = data;
    document.getElementById('verify-img').src = document.getElementById('image-preview').src;
    document.getElementById('detected-text').textContent = data.detected_question;
    document.getElementById('verification-step').classList.remove('hidden');
    document.getElementById('upload-form').classList.add('hidden');

  } catch (err) {
    hideLoading();
    alert('Error connecting to server. Please try again.');
  }
}

function resetUpload() {
  currentSelectedFile = null;
  currentVerificationData = null;
  document.getElementById('upload-form').classList.remove('hidden');
  document.getElementById('verification-step').classList.add('hidden');
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('btn-recognize').classList.add('disabled');
  document.getElementById('btn-recognize').disabled = true;
}

async function proceedToFullAnalysis() {
  showLoading('Analyzing mistake patterns & solution strategy...');
  
  const formData = new FormData();
  formData.append('image', currentSelectedFile);
  formData.append('languageSetting', store.settings.language);
  formData.append('confirmedQuestion', currentVerificationData.detected_question);

  try {
    const res = await fetch('/api/analyze', { method: 'POST', body: formData });
    const data = await res.json();
    hideLoading();

    currentAnalysisResult = data;
    document.getElementById('verification-step').classList.add('hidden');

    const resultBox = document.getElementById('analysis-content');
    resultBox.innerHTML = `
      <p><strong>Subject:</strong> ${data.subject || currentVerificationData.detected_subject}</p>
      <p><strong>Topic:</strong> ${data.topic}</p>
      <p><strong>Original Question:</strong> ${data.question_text}</p>
      <p><strong>Student Working:</strong> ${data.student_work || 'None visible'}</p>
      <p><strong>Correct Answer:</strong> ${data.correct_answer}</p>
      <p><strong>Why You Got It Wrong:</strong> ${data.why_wrong}</p>
      <p><strong>Key Knowledge:</strong> ${data.key_knowledge}</p>
      <p><strong>Solving Strategy:</strong> ${data.solving_strategy}</p>
      <p><strong>Common Trap:</strong> ${data.common_trap}</p>
    `;

    document.getElementById('analysis-result').classList.remove('hidden');

  } catch (err) {
    hideLoading();
    alert('Analysis failed. Please try again.');
  }
}

function saveCurrentMistake() {
  const newMistake = {
    id: Date.now().toString(),
    imageData: document.getElementById('image-preview').src,
    analysis: currentAnalysisResult,
    subject: currentAnalysisResult.subject || currentVerificationData.detected_subject,
    topic: currentAnalysisResult.topic,
    dateAdded: new Date().toISOString(),
    status: 'New',
    nextReviewDate: new Date().toISOString(),
    intervalDays: 1
  };

  store.mistakes.push(newMistake);
  saveStore();

  alert('Mistake saved successfully!');
  resetUpload();
  document.getElementById('analysis-result').classList.add('hidden');
  navTo('mistakes');
}

function renderLibrary() {
  const container = document.getElementById('library-list');
  const subFilter = document.getElementById('filter-subject').value;
  const statusFilter = document.getElementById('filter-status').value;

  const filtered = store.mistakes.filter(m => {
    const matchSub = subFilter === 'All' || m.subject === subFilter;
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSub && matchStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding: 20px;">No mistakes found matching filters.</p>';
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="card">
      <div style="display:flex; justify-content:space-between;">
        <strong>${m.subject} - ${m.topic}</strong>
        <span class="sub-tag">${m.status}</span>
      </div>
      <p style="margin:8px 0; font-size:14px;">${m.analysis.question_text}</p>
      <button class="secondary-btn" style="width:100%" onclick="alert('${m.analysis.why_wrong.replace(/'/g, "\\'")}')">View Why Wrong</button>
    </div>
  `).join('');
}

function renderReview() {
  const container = document.getElementById('review-container');
  const now = new Date();
  
  const due = store.mistakes.filter(m => new Date(m.nextReviewDate) <= now && m.status !== 'Mastered');

  if (due.length === 0) {
    container.innerHTML = '<div class="card"><h3>All caught up! 🎉</h3><p>No questions due for review today.</p></div>';
    return;
  }

  const current = due[0];
  container.innerHTML = `
    <div class="card">
      <h3>Review Question</h3>
      <div class="img-preview-small"><img src="${current.imageData}" alt="Question"></div>
      <p><strong>Question:</strong> ${current.analysis.question_text}</p>
      
      <div id="review-answer-box" class="hidden" style="margin-top:12px; border-top:1px solid #ccc; padding-top:8px;">
        <p><strong>Correct Answer:</strong> ${current.analysis.correct_answer}</p>
        <p><strong>Key Explanation:</strong> ${current.analysis.why_wrong}</p>
      </div>

      <div style="margin-top:16px;">
        <button class="secondary-btn" style="width:100%; margin-bottom:8px;" onclick="document.getElementById('review-answer-box').classList.remove('hidden')">Show Explanation</button>
        <div class="btn-row">
          <button class="primary-btn" onclick="processReview('${current.id}', true)">I Got It</button>
          <button class="danger-btn" onclick="processReview('${current.id}', false)">Still Don't Understand</button>
        </div>
      </div>
    </div>
  `;
}

function processReview(id, success) {
  const item = store.mistakes.find(m => m.id === id);
  if (!item) return;

  if (success) {
    item.intervalDays *= 2;
    if (item.intervalDays >= 14) {
      item.status = 'Mastered';
    } else {
      item.status = 'Reviewing';
    }
  } else {
    item.intervalDays = 1;
    item.status = 'Reviewing';
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + item.intervalDays);
  item.nextReviewDate = nextDate.toISOString();

  saveStore();
  renderReview();
}

function updateStats() {
  document.getElementById('stat-total').textContent = store.mistakes.length;
  
  const now = new Date();
  const dueCount = store.mistakes.filter(m => new Date(m.nextReviewDate) <= now && m.status !== 'Mastered').length;
  document.getElementById('stat-review').textContent = dueCount;
  
  const masteredCount = store.mistakes.filter(m => m.status === 'Mastered').length;
  document.getElementById('stat-mastered').textContent = masteredCount;

  const reasons = store.mistakes.map(m => m.analysis.common_trap).filter(Boolean);
  const commonBox = document.getElementById('common-mistakes-list');
  if (reasons.length > 0) {
    commonBox.innerHTML = Array.from(new Set(reasons)).slice(0, 5).map(r => `<li>${r}</li>`).join('');
  }
}

function renderProgress() {
  const topicsMap = {};
  store.mistakes.forEach(m => {
    topicsMap[m.topic] = (topicsMap[m.topic] || 0) + 1;
  });

  const sortedTopics = Object.entries(topicsMap).sort((a, b) => b[1] - a[1]);
  const list = document.getElementById('weakest-topics-list');
  
  if (sortedTopics.length === 0) {
    list.innerHTML = '<li>No data available yet.</li>';
    return;
  }

  list.innerHTML = sortedTopics.map(([topic, count]) => `<li><strong>${topic}:</strong> ${count} mistakes recorded</li>`).join('');
}

function updateSettings() {
  store.settings.language = document.getElementById('setting-language').value;
  store.settings.target = document.getElementById('setting-target').value;
  saveStore();
}

function showLoading(msg) {
  document.getElementById('loading-text').textContent = msg;
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

updateStats();
