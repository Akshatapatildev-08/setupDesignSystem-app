const routes = {
  "/": { title: "Job Notification Tracker", key: "landing", notFound: false },
  "/dashboard": { title: "Dashboard", key: "dashboard", notFound: false },
  "/settings": { title: "Settings", key: "settings", notFound: false },
  "/saved": { title: "Saved Jobs", key: "saved", notFound: false },
  "/digest": { title: "Daily Digest", key: "digest", notFound: false },
  "/proof": { title: "Proof", key: "proof", notFound: false },
  "/jt/07-test": { title: "Test Checklist", key: "test-checklist", notFound: false },
  "/jt/08-ship": { title: "Ship Gate", key: "ship-gate", notFound: false }
};

const SAVED_STORAGE_KEY = "jobNotificationTracker.savedJobIds";
const PREFERENCES_STORAGE_KEY = "jobTrackerPreferences";
const DIGEST_STORAGE_PREFIX = "jobTrackerDigest_";
const STATUS_STORAGE_KEY = "jobTrackerStatus";
const STATUS_UPDATES_STORAGE_KEY = "jobTrackerStatusUpdates";
const TEST_STATUS_STORAGE_KEY = "jobTrackerTestStatus";
const STATUS = {
  NOT_APPLIED: "Not Applied",
  APPLIED: "Applied",
  REJECTED: "Rejected",
  SELECTED: "Selected"
};

const STATUS_OPTIONS = [STATUS.NOT_APPLIED, STATUS.APPLIED, STATUS.REJECTED, STATUS.SELECTED];
const TEST_CHECKLIST_ITEMS = [
  "Preferences persist after refresh",
  "Match score calculates correctly",
  "\"Show only matches\" toggle works",
  "Save job persists after refresh",
  "Apply opens in new tab",
  "Status update persists after refresh",
  "Status filter works correctly",
  "Digest generates top 10 by score",
  "Digest persists for the day",
  "No console errors on main pages"
];
const jobs = Array.isArray(window.jobsData) ? window.jobsData : [];
const jobsById = new Map(jobs.map((job) => [job.id, job]));

const defaultPreferences = {
  roleKeywords: [],
  preferredLocations: [],
  preferredMode: [],
  experienceLevel: "",
  skills: [],
  minMatchScore: 40
};

const dashboardState = {
  preferences: null,
  preferencesConfigured: false,
  scoresById: new Map(),
  showOnlyMatches: false,
  filters: {
    keyword: "",
    location: "",
    mode: "",
    experience: "",
    source: "",
    status: ""
  },
  sortBy: "latest"
};

const routeView = document.querySelector("#route-view");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");

function normalizePath(pathname) {
  if (!pathname || pathname === "") {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getRoute(pathname) {
  const normalized = normalizePath(pathname);
  return routes[normalized] || { title: "Page Not Found", key: "not-found", notFound: true };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseCommaSeparated(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function getSavedJobIds() {
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function setSavedJobIds(ids) {
  window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
}

function isJobSaved(id) {
  return getSavedJobIds().includes(id);
}

function toggleSaveJob(id) {
  const ids = getSavedJobIds();
  const hasId = ids.includes(id);

  if (hasId) {
    setSavedJobIds(ids.filter((savedId) => savedId !== id));
    return false;
  }

  setSavedJobIds([...ids, id]);
  return true;
}

function loadPreferences() {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return { ...defaultPreferences };
    }

    const parsed = JSON.parse(raw);
    return {
      roleKeywords: Array.isArray(parsed.roleKeywords) ? parsed.roleKeywords : [],
      preferredLocations: Array.isArray(parsed.preferredLocations) ? parsed.preferredLocations : [],
      preferredMode: Array.isArray(parsed.preferredMode) ? parsed.preferredMode : [],
      experienceLevel: typeof parsed.experienceLevel === "string" ? parsed.experienceLevel : "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      minMatchScore:
        Number.isFinite(parsed.minMatchScore) && parsed.minMatchScore >= 0 && parsed.minMatchScore <= 100
          ? parsed.minMatchScore
          : 40
    };
  } catch (error) {
    return { ...defaultPreferences };
  }
}

function savePreferences(preferences) {
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

function hasConfiguredPreferences(preferences) {
  return (
    preferences.roleKeywords.length > 0 ||
    preferences.preferredLocations.length > 0 ||
    preferences.preferredMode.length > 0 ||
    preferences.experienceLevel !== "" ||
    preferences.skills.length > 0
  );
}

function loadTestStatus() {
  try {
    const raw = window.localStorage.getItem(TEST_STATUS_STORAGE_KEY);
    if (!raw) {
      return Array(TEST_CHECKLIST_ITEMS.length).fill(false);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return Array(TEST_CHECKLIST_ITEMS.length).fill(false);
    }

    return TEST_CHECKLIST_ITEMS.map((_, index) => Boolean(parsed[index]));
  } catch (error) {
    return Array(TEST_CHECKLIST_ITEMS.length).fill(false);
  }
}

function saveTestStatus(values) {
  const normalized = TEST_CHECKLIST_ITEMS.map((_, index) => Boolean(values[index]));
  window.localStorage.setItem(TEST_STATUS_STORAGE_KEY, JSON.stringify(normalized));
}

function getPassedTestCount(values) {
  return values.filter(Boolean).length;
}

function areAllTestsPassed(values) {
  return getPassedTestCount(values) === TEST_CHECKLIST_ITEMS.length;
}

function loadStatusMap() {
  try {
    const raw = window.localStorage.getItem(STATUS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveStatusMap(statusMap) {
  window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statusMap));
}

function loadStatusUpdates() {
  try {
    const raw = window.localStorage.getItem(STATUS_UPDATES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStatusUpdates(updates) {
  window.localStorage.setItem(STATUS_UPDATES_STORAGE_KEY, JSON.stringify(updates));
}

function getJobStatus(jobId) {
  const statusMap = loadStatusMap();
  const status = statusMap[jobId];
  return STATUS_OPTIONS.includes(status) ? status : STATUS.NOT_APPLIED;
}

function addStatusUpdate(jobId, status) {
  const updates = loadStatusUpdates();
  const next = [
    {
      jobId,
      status,
      changedAt: new Date().toISOString()
    },
    ...updates
  ].slice(0, 100);

  saveStatusUpdates(next);
}

function showToast(message) {
  let root = document.querySelector("#toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    document.body.appendChild(root);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("toast--exit");
    window.setTimeout(() => toast.remove(), 220);
  }, 1800);
}

function setJobStatus(jobId, status) {
  if (!STATUS_OPTIONS.includes(status)) {
    return;
  }

  const map = loadStatusMap();
  map[jobId] = status;
  saveStatusMap(map);
  addStatusUpdate(jobId, status);

  if (status !== STATUS.NOT_APPLIED) {
    showToast(`Status updated: ${status}`);
  }
}

function getRecentStatusUpdates(limit = 8) {
  return loadStatusUpdates()
    .map((entry) => {
      const job = jobsById.get(entry.jobId);
      if (!job) {
        return null;
      }

      return {
        ...entry,
        title: job.title,
        company: job.company
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDigestStorageKey(dateKey) {
  return `${DIGEST_STORAGE_PREFIX}${dateKey}`;
}

function formatPostedDaysAgo(days) {
  if (days === 0) {
    return "Posted today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

function extractSalaryScore(salaryRange) {
  const value = String(salaryRange || "");
  const numbers = value.match(/[\d.]+/g);

  if (!numbers || numbers.length === 0) {
    return 0;
  }

  const upper = Number(numbers[numbers.length - 1]);

  if (Number.isNaN(upper)) {
    return 0;
  }

  if (value.toLowerCase().includes("month")) {
    return (upper * 12) / 100000;
  }

  return upper;
}

function calculateMatchScore(job, preferences) {
  let score = 0;

  const title = normalizeValue(job.title);
  const description = normalizeValue(job.description);
  const location = normalizeValue(job.location);
  const mode = normalizeValue(job.mode);
  const experience = normalizeValue(job.experience);
  const source = normalizeValue(job.source);
  const jobSkills = (job.skills || []).map(normalizeValue);

  const roleKeywords = preferences.roleKeywords.map(normalizeValue);
  const preferredLocations = preferences.preferredLocations.map(normalizeValue);
  const preferredMode = preferences.preferredMode.map(normalizeValue);
  const experienceLevel = normalizeValue(preferences.experienceLevel);
  const preferenceSkills = preferences.skills.map(normalizeValue);

  if (roleKeywords.some((keyword) => keyword && title.includes(keyword))) {
    score += 25;
  }

  if (roleKeywords.some((keyword) => keyword && description.includes(keyword))) {
    score += 15;
  }

  if (preferredLocations.some((prefLocation) => prefLocation === location)) {
    score += 15;
  }

  if (preferredMode.some((prefMode) => prefMode === mode)) {
    score += 10;
  }

  if (experienceLevel && experienceLevel === experience) {
    score += 10;
  }

  if (preferenceSkills.some((skill) => skill && jobSkills.includes(skill))) {
    score += 15;
  }

  if (job.postedDaysAgo <= 2) {
    score += 5;
  }

  if (source === "linkedin") {
    score += 5;
  }

  return Math.min(score, 100);
}

function computeScoresById(preferences) {
  return new Map(jobs.map((job) => [job.id, calculateMatchScore(job, preferences)]));
}

function buildDigestFromPreferences(preferences) {
  const scoresById = computeScoresById(preferences);
  const ranked = jobs
    .map((job) => ({
      id: job.id,
      matchScore: scoresById.get(job.id) || 0,
      postedDaysAgo: job.postedDaysAgo
    }))
    .filter((job) => job.matchScore >= preferences.minMatchScore)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      return a.postedDaysAgo - b.postedDaysAgo;
    })
    .slice(0, 10);

  return {
    date: getLocalDateKey(),
    createdAt: new Date().toISOString(),
    jobs: ranked
  };
}

function loadDigestForDate(dateKey) {
  try {
    const raw = window.localStorage.getItem(getDigestStorageKey(dateKey));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.jobs)) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

function saveDigestForDate(dateKey, digest) {
  window.localStorage.setItem(getDigestStorageKey(dateKey), JSON.stringify(digest));
}

function getDigestJobs(digest) {
  if (!digest || !Array.isArray(digest.jobs)) {
    return [];
  }

  return digest.jobs
    .map((entry) => {
      const job = jobsById.get(entry.id);
      if (!job) {
        return null;
      }

      return {
        ...job,
        matchScore: entry.matchScore
      };
    })
    .filter(Boolean);
}

function formatDigestDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatDateTime(iso) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

function buildDigestPlainText(digestJobs, dateKey) {
  const lines = [
    "Top 10 Jobs For You — 9AM Digest",
    formatDigestDate(dateKey),
    ""
  ];

  digestJobs.forEach((job, index) => {
    lines.push(
      `${index + 1}. ${job.title} | ${job.company}`,
      `   ${job.location} | ${job.experience} | Match ${job.matchScore}`,
      `   Apply: ${job.applyUrl}`,
      ""
    );
  });

  lines.push("This digest was generated based on your preferences.");
  return lines.join("\n");
}

function renderRecentStatusUpdates() {
  const mount = document.querySelector("#recent-status-updates");
  if (!mount) {
    return;
  }

  const updates = getRecentStatusUpdates();

  if (!updates.length) {
    mount.innerHTML = `
      <section class="surface recent-status">
        <h2>Recent Status Updates</h2>
        <p>No status updates yet.</p>
      </section>
    `;
    return;
  }

  mount.innerHTML = `
    <section class="surface recent-status">
      <h2>Recent Status Updates</h2>
      <div class="updates-list">
        ${updates
          .map(
            (update) => `
              <article class="update-item">
                <p><strong>${escapeHtml(update.title)}</strong> · ${escapeHtml(update.company)}</p>
                <p>Status: ${escapeHtml(update.status)}</p>
                <p>${formatDateTime(update.changedAt)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDigestContent(digest, dateKey) {
  const mount = document.querySelector("#digest-content");
  if (!mount) {
    return;
  }

  if (!digest) {
    mount.innerHTML = "";
    renderRecentStatusUpdates();
    return;
  }

  const digestJobs = getDigestJobs(digest);

  if (!digestJobs.length) {
    mount.innerHTML = `
      <div class="empty-state">
        <p>No matching roles today. Check again tomorrow.</p>
      </div>
    `;
    renderRecentStatusUpdates();
    return;
  }

  mount.innerHTML = `
    <section class="digest-card" aria-label="Daily digest email layout">
      <header class="digest-card__header">
        <h2>Top 10 Jobs For You — 9AM Digest</h2>
        <p>${formatDigestDate(dateKey)}</p>
      </header>

      <div class="digest-list">
        ${digestJobs
          .map(
            (job) => `
              <article class="digest-item">
                <h3>${escapeHtml(job.title)}</h3>
                <p>${escapeHtml(job.company)}</p>
                <p>${escapeHtml(job.location)} · ${escapeHtml(job.experience)}</p>
                <p>Match Score: ${job.matchScore}</p>
                <a class="btn btn-primary" href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noopener noreferrer">Apply</a>
              </article>
            `
          )
          .join("")}
      </div>

      <footer class="digest-card__footer">This digest was generated based on your preferences.</footer>
    </section>
  `;
  renderRecentStatusUpdates();
}

function getMatchTone(score) {
  if (score >= 80) {
    return "match-badge--high";
  }

  if (score >= 60) {
    return "match-badge--mid";
  }

  if (score >= 40) {
    return "match-badge--base";
  }

  return "match-badge--low";
}

function getStatusTone(status) {
  if (status === STATUS.APPLIED) {
    return "status-badge--applied";
  }

  if (status === STATUS.REJECTED) {
    return "status-badge--rejected";
  }

  if (status === STATUS.SELECTED) {
    return "status-badge--selected";
  }

  return "status-badge--neutral";
}

function getDashboardJobs() {
  const filters = dashboardState.filters;
  const keyword = normalizeValue(filters.keyword);

  const filtered = jobs.filter((job) => {
    const score = dashboardState.scoresById.get(job.id) || 0;
    const status = getJobStatus(job.id);

    if (dashboardState.showOnlyMatches && score < dashboardState.preferences.minMatchScore) {
      return false;
    }

    const searchable = `${job.title} ${job.company} ${job.description}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) {
      return false;
    }

    if (filters.location && normalizeValue(job.location) !== normalizeValue(filters.location)) {
      return false;
    }

    if (filters.mode && normalizeValue(job.mode) !== normalizeValue(filters.mode)) {
      return false;
    }

    if (filters.experience && normalizeValue(job.experience) !== normalizeValue(filters.experience)) {
      return false;
    }

    if (filters.source && normalizeValue(job.source) !== normalizeValue(filters.source)) {
      return false;
    }

    if (filters.status && status !== filters.status) {
      return false;
    }

    return true;
  });

  if (dashboardState.sortBy === "latest") {
    filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  } else if (dashboardState.sortBy === "match") {
    filtered.sort((a, b) => (dashboardState.scoresById.get(b.id) || 0) - (dashboardState.scoresById.get(a.id) || 0));
  } else if (dashboardState.sortBy === "salary") {
    filtered.sort((a, b) => extractSalaryScore(b.salaryRange) - extractSalaryScore(a.salaryRange));
  }

  return filtered;
}

function buildJobCard(job) {
  const saved = isJobSaved(job.id);
  const score = dashboardState.scoresById.get(job.id) || 0;
  const status = getJobStatus(job.id);

  return `
    <article class="job-card" data-job-id="${job.id}">
      <header class="job-card__header">
        <div>
          <h2>${escapeHtml(job.title)}</h2>
          <p class="job-card__company">${escapeHtml(job.company)}</p>
        </div>
        <span class="source-badge">${escapeHtml(job.source)}</span>
      </header>

      <div class="job-card__row">
        <span class="match-badge ${getMatchTone(score)}">Match ${score}</span>
      </div>

      <p class="job-card__meta">${escapeHtml(job.location)} · ${escapeHtml(job.mode)}</p>
      <p class="job-card__meta">Experience: ${escapeHtml(job.experience)}</p>
      <p class="job-card__meta">Salary: ${escapeHtml(job.salaryRange)}</p>
      <p class="job-card__posted">${formatPostedDaysAgo(job.postedDaysAgo)}</p>

      <div class="status-block">
        <span class="status-badge ${getStatusTone(status)}" data-status-badge>Status: ${status}</span>
        <div class="status-buttons" role="group" aria-label="Update job status">
          ${STATUS_OPTIONS.map((option) => `<button class="btn btn-status ${status === option ? "is-active" : ""}" type="button" data-action="set-status" data-job-id="${job.id}" data-status="${option}">${option}</button>`).join("")}
        </div>
      </div>

      <div class="job-card__actions">
        <button class="btn btn-secondary" type="button" data-action="view" data-job-id="${job.id}">View</button>
        <button class="btn btn-secondary ${saved ? "is-saved" : ""}" type="button" data-action="save" data-job-id="${job.id}">${saved ? "Saved" : "Save"}</button>
        <a class="btn btn-primary" href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noopener noreferrer">Apply</a>
      </div>
    </article>
  `;
}

function updateCardStatusUI(card, status) {
  const badge = card.querySelector("[data-status-badge]");
  if (badge) {
    badge.className = `status-badge ${getStatusTone(status)}`;
    badge.textContent = `Status: ${status}`;
  }

  const statusButtons = card.querySelectorAll('[data-action="set-status"]');
  statusButtons.forEach((button) => {
    const buttonStatus = button.getAttribute("data-status");
    button.classList.toggle("is-active", buttonStatus === status);
  });
}

function renderDashboardList() {
  const mount = document.querySelector("#dashboard-list");
  if (!mount) {
    return;
  }

  const jobsToRender = getDashboardJobs();

  if (!jobsToRender.length) {
    mount.innerHTML = `
      <div class="empty-state">
        <p>No roles match your criteria. Adjust filters or lower threshold.</p>
      </div>
    `;
    return;
  }

  mount.innerHTML = `<div class="jobs-grid">${jobsToRender.map(buildJobCard).join("")}</div>`;
}

function renderSavedList() {
  const mount = document.querySelector("#saved-list");
  if (!mount) {
    return;
  }

  const savedJobs = getSavedJobIds()
    .map((id) => jobsById.get(id))
    .filter(Boolean);

  if (!savedJobs.length) {
    mount.innerHTML = `
      <div class="empty-state">
        <p>Your saved opportunities will appear here in a focused, review-ready list.</p>
      </div>
    `;
    return;
  }

  mount.innerHTML = `<div class="jobs-grid">${savedJobs.map(buildJobCard).join("")}</div>`;
}

function bindDashboardInteractions() {
  const listMount = document.querySelector("#dashboard-list");
  const filterBar = document.querySelector("#dashboard-filters");
  const showMatchesToggle = document.querySelector("#show-only-matches");

  if (!listMount || !filterBar || !showMatchesToggle) {
    return;
  }

  listMount.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.getAttribute("data-action");
    const jobId = actionTarget.getAttribute("data-job-id");

    if (action === "view" && jobId) {
      openJobModal(jobId);
      return;
    }

    if (action === "save" && jobId) {
      const saved = toggleSaveJob(jobId);
      actionTarget.textContent = saved ? "Saved" : "Save";
      actionTarget.classList.toggle("is-saved", saved);
      return;
    }

    if (action === "set-status" && jobId) {
      const status = actionTarget.getAttribute("data-status") || STATUS.NOT_APPLIED;
      setJobStatus(jobId, status);

      const card = actionTarget.closest(".job-card");
      if (card) {
        updateCardStatusUI(card, status);
      }

      if (dashboardState.filters.status) {
        renderDashboardList();
      }
    }
  });

  const handleFilterChange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.name in dashboardState.filters) {
      dashboardState.filters[target.name] = target.value;
      renderDashboardList();
      return;
    }

    if (target.name === "sortBy") {
      dashboardState.sortBy = target.value;
      renderDashboardList();
    }
  };

  filterBar.addEventListener("input", handleFilterChange);
  filterBar.addEventListener("change", handleFilterChange);

  showMatchesToggle.addEventListener("change", () => {
    dashboardState.showOnlyMatches = showMatchesToggle.checked;
    renderDashboardList();
  });
}

function bindSavedInteractions() {
  const listMount = document.querySelector("#saved-list");
  if (!listMount) {
    return;
  }

  listMount.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.getAttribute("data-action");
    const jobId = actionTarget.getAttribute("data-job-id");

    if (action === "view" && jobId) {
      openJobModal(jobId);
      return;
    }

    if (action === "save" && jobId) {
      toggleSaveJob(jobId);
      renderSavedList();
      return;
    }

    if (action === "set-status" && jobId) {
      const status = actionTarget.getAttribute("data-status") || STATUS.NOT_APPLIED;
      setJobStatus(jobId, status);
      const card = actionTarget.closest(".job-card");
      if (card) {
        updateCardStatusUI(card, status);
      }
    }
  });
}

function renderLocationOptions(selectedValues) {
  const locations = Array.from(new Set(jobs.map((job) => job.location))).sort((a, b) => a.localeCompare(b));

  return locations
    .map((location) => {
      const selected = selectedValues.includes(location) ? "selected" : "";
      return `<option value="${escapeHtml(location)}" ${selected}>${escapeHtml(location)}</option>`;
    })
    .join("");
}

function renderSettingsForm(preferences) {
  const modes = ["Remote", "Hybrid", "Onsite"];
  const experiences = ["", "Fresher", "0-1", "1-3", "3-5"];

  return `
    <form id="preferences-form" class="surface field-stack" aria-label="Job matching preferences">
      <div class="field">
        <label for="roleKeywords">Role keywords</label>
        <input id="roleKeywords" name="roleKeywords" class="placeholder-input" type="text" value="${escapeHtml(preferences.roleKeywords.join(", "))}" placeholder="e.g., frontend, react, intern" />
      </div>

      <div class="field">
        <label for="preferredLocations">Preferred locations</label>
        <select id="preferredLocations" name="preferredLocations" class="placeholder-select" multiple size="6">
          ${renderLocationOptions(preferences.preferredLocations)}
        </select>
      </div>

      <fieldset class="field fieldset">
        <legend>Preferred mode</legend>
        <div class="checkbox-group">
          ${modes
            .map((mode) => {
              const checked = preferences.preferredMode.includes(mode) ? "checked" : "";
              return `<label><input type="checkbox" name="preferredMode" value="${mode}" ${checked} /> ${mode}</label>`;
            })
            .join("")}
        </div>
      </fieldset>

      <div class="field">
        <label for="experienceLevel">Experience level</label>
        <select id="experienceLevel" name="experienceLevel" class="placeholder-select">
          ${experiences
            .map((exp) => {
              const selected = preferences.experienceLevel === exp ? "selected" : "";
              const label = exp === "" ? "Any" : exp;
              return `<option value="${exp}" ${selected}>${label}</option>`;
            })
            .join("")}
        </select>
      </div>

      <div class="field">
        <label for="skills">Skills</label>
        <input id="skills" name="skills" class="placeholder-input" type="text" value="${escapeHtml(preferences.skills.join(", "))}" placeholder="e.g., sql, python, react" />
      </div>

      <div class="field">
        <label for="minMatchScore">Minimum match score: <span id="min-score-value">${preferences.minMatchScore}</span></label>
        <input id="minMatchScore" name="minMatchScore" type="range" min="0" max="100" step="1" value="${preferences.minMatchScore}" />
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Save Preferences</button>
      </div>
    </form>
  `;
}

function bindSettingsForm() {
  const form = document.querySelector("#preferences-form");
  const slider = document.querySelector("#minMatchScore");
  const sliderValue = document.querySelector("#min-score-value");
  const status = document.querySelector("#preferences-status");

  if (!form || !slider || !sliderValue) {
    return;
  }

  slider.addEventListener("input", () => {
    sliderValue.textContent = slider.value;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const selectedLocationOptions = Array.from(form.querySelector("#preferredLocations").selectedOptions).map((opt) => opt.value);
    const selectedModes = Array.from(form.querySelectorAll('input[name="preferredMode"]:checked')).map((input) => input.value);

    const preferences = {
      roleKeywords: parseCommaSeparated(String(formData.get("roleKeywords") || "")),
      preferredLocations: selectedLocationOptions,
      preferredMode: selectedModes,
      experienceLevel: String(formData.get("experienceLevel") || ""),
      skills: parseCommaSeparated(String(formData.get("skills") || "")),
      minMatchScore: Number(formData.get("minMatchScore") || 40)
    };

    savePreferences(preferences);

    if (status) {
      status.textContent = "Preferences saved.";
    }
  });
}

function openJobModal(jobId) {
  const job = jobsById.get(jobId);
  if (!job) {
    return;
  }

  closeJobModal();

  const overlay = document.createElement("div");
  overlay.id = "job-modal-overlay";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__header">
        <h2 id="modal-title">${escapeHtml(job.title)} · ${escapeHtml(job.company)}</h2>
        <button class="btn btn-secondary" type="button" data-action="close-modal">Close</button>
      </div>
      <p id="modal-meta" class="modal__meta">${escapeHtml(job.location)} · ${escapeHtml(job.mode)} · ${escapeHtml(job.experience)}</p>
      <p id="modal-description" class="modal__description">${escapeHtml(job.description).replace(/\n/g, "<br />")}</p>
      <div>
        <h3 class="modal__skills-heading">Skills</h3>
        <div id="modal-skills" class="skills-list">
          ${job.skills.map((skill) => `<span class="skill-chip">${escapeHtml(skill)}</span>`).join("")}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('[data-action="close-modal"]');
  if (closeButton) {
    closeButton.addEventListener("click", closeJobModal);
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeJobModal();
    }
  });
}

function closeJobModal() {
  const overlay = document.querySelector("#job-modal-overlay");
  if (!overlay) {
    return;
  }

  overlay.remove();
}

function renderDashboard(preferences) {
  dashboardState.preferences = preferences;
  dashboardState.preferencesConfigured = hasConfiguredPreferences(preferences);
  dashboardState.scoresById = new Map(jobs.map((job) => [job.id, calculateMatchScore(job, preferences)]));

  const locations = Array.from(new Set(jobs.map((job) => job.location))).sort((a, b) => a.localeCompare(b));
  const modes = ["", "Remote", "Hybrid", "Onsite"];
  const experiences = ["", "Fresher", "0-1", "1-3", "3-5"];
  const sources = ["", "LinkedIn", "Naukri", "Indeed"];

  routeView.innerHTML = `
    <section class="page page--wide" aria-labelledby="page-title">
      <h1 id="page-title">Dashboard</h1>
      <p class="lead">Fresh opportunities aligned to your preferences.</p>

      ${dashboardState.preferencesConfigured ? "" : '<div class="notice-banner">Set your preferences to activate intelligent matching.</div>'}

      <section id="dashboard-filters" class="surface filter-bar" aria-label="Filter and sort jobs">
        <div class="field">
          <label for="keyword">Keyword search</label>
          <input id="keyword" name="keyword" class="placeholder-input" type="text" value="${escapeHtml(dashboardState.filters.keyword)}" />
        </div>

        <div class="field">
          <label for="locationFilter">Location</label>
          <select id="locationFilter" name="location" class="placeholder-select">
            <option value="">All</option>
            ${locations
              .map((location) => {
                const selected = dashboardState.filters.location === location ? "selected" : "";
                return `<option value="${escapeHtml(location)}" ${selected}>${escapeHtml(location)}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div class="field">
          <label for="modeFilter">Mode</label>
          <select id="modeFilter" name="mode" class="placeholder-select">
            ${modes
              .map((mode) => {
                const selected = dashboardState.filters.mode === mode ? "selected" : "";
                return `<option value="${mode}" ${selected}>${mode || "All"}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div class="field">
          <label for="experienceFilter">Experience</label>
          <select id="experienceFilter" name="experience" class="placeholder-select">
            ${experiences
              .map((exp) => {
                const selected = dashboardState.filters.experience === exp ? "selected" : "";
                return `<option value="${exp}" ${selected}>${exp || "All"}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div class="field">
          <label for="sourceFilter">Source</label>
          <select id="sourceFilter" name="source" class="placeholder-select">
            ${sources
              .map((source) => {
                const selected = dashboardState.filters.source === source ? "selected" : "";
                return `<option value="${source}" ${selected}>${source || "All"}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div class="field">
          <label for="statusFilter">Status</label>
          <select id="statusFilter" name="status" class="placeholder-select">
            <option value="">All</option>
            ${STATUS_OPTIONS.map((status) => `<option value="${status}" ${dashboardState.filters.status === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label for="sortBy">Sort by</label>
          <select id="sortBy" name="sortBy" class="placeholder-select">
            <option value="latest" ${dashboardState.sortBy === "latest" ? "selected" : ""}>Latest</option>
            <option value="match" ${dashboardState.sortBy === "match" ? "selected" : ""}>Match Score</option>
            <option value="salary" ${dashboardState.sortBy === "salary" ? "selected" : ""}>Salary</option>
          </select>
        </div>

        <label class="toggle-row">
          <input id="show-only-matches" type="checkbox" ${dashboardState.showOnlyMatches ? "checked" : ""} />
          Show only jobs above my threshold
        </label>
      </section>

      <section id="dashboard-list" aria-live="polite"></section>
    </section>
  `;

  bindDashboardInteractions();
  renderDashboardList();
}

function renderSaved(preferences) {
  dashboardState.scoresById = computeScoresById(preferences);

  routeView.innerHTML = `
    <section class="page page--wide" aria-labelledby="page-title">
      <h1 id="page-title">Saved</h1>
      <p class="lead">Your shortlisted opportunities in one place.</p>
      <section id="saved-list" aria-live="polite"></section>
    </section>
  `;

  renderSavedList();
  bindSavedInteractions();
}

function renderDigest(preferences) {
  const configured = hasConfiguredPreferences(preferences);
  const todayKey = getLocalDateKey();
  const existingDigest = loadDigestForDate(todayKey);

  routeView.innerHTML = `
    <section class="page" aria-labelledby="page-title">
      <h1 id="page-title">Digest</h1>
      <p class="lead">Daily ranked opportunities prepared for your review.</p>

      ${
        configured
          ? ""
          : '<div class="notice-banner">Set preferences to generate a personalized digest.</div>'
      }

      <div class="surface digest-actions">
        <button id="generate-digest" class="btn btn-primary" type="button" ${configured ? "" : "disabled"}>
          Generate Today's 9AM Digest (Simulated)
        </button>
        <button id="copy-digest" class="btn btn-secondary" type="button" ${existingDigest ? "" : "disabled"}>
          Copy Digest to Clipboard
        </button>
        <button id="email-digest" class="btn btn-secondary" type="button" ${existingDigest ? "" : "disabled"}>
          Create Email Draft
        </button>
      </div>

      <p class="digest-note">Demo Mode: Daily 9AM trigger simulated manually.</p>

      <section id="digest-content" aria-live="polite"></section>
      <section id="recent-status-updates" aria-live="polite"></section>
    </section>
  `;

  renderDigestContent(existingDigest, todayKey);
  bindDigestInteractions(preferences, todayKey);
}

function bindDigestInteractions(preferences, dateKey) {
  const generateButton = document.querySelector("#generate-digest");
  const copyButton = document.querySelector("#copy-digest");
  const emailButton = document.querySelector("#email-digest");

  const getCurrentDigest = () => loadDigestForDate(dateKey);

  const refreshDigestAndActions = (digest) => {
    renderDigestContent(digest, dateKey);
    const hasDigest = Boolean(digest);
    if (copyButton) {
      copyButton.disabled = !hasDigest;
    }
    if (emailButton) {
      emailButton.disabled = !hasDigest;
    }
  };

  if (generateButton) {
    generateButton.addEventListener("click", () => {
      const existing = getCurrentDigest();
      if (existing) {
        refreshDigestAndActions(existing);
        return;
      }

      const digest = buildDigestFromPreferences(preferences);
      saveDigestForDate(dateKey, digest);
      refreshDigestAndActions(digest);
    });
  }

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const digest = getCurrentDigest();
      if (!digest) {
        return;
      }

      const digestJobs = getDigestJobs(digest);
      const text = buildDigestPlainText(digestJobs, dateKey);

      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
    });
  }

  if (emailButton) {
    emailButton.addEventListener("click", () => {
      const digest = getCurrentDigest();
      if (!digest) {
        return;
      }

      const digestJobs = getDigestJobs(digest);
      const body = encodeURIComponent(buildDigestPlainText(digestJobs, dateKey));
      const subject = encodeURIComponent("My 9AM Job Digest");
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
  }
}

function renderTestChecklist() {
  const status = loadTestStatus();
  const passed = getPassedTestCount(status);

  routeView.innerHTML = `
    <section class="page" aria-labelledby="page-title">
      <h1 id="page-title">Built-In Test Checklist</h1>
      <p class="lead">Track readiness before shipping.</p>

      <section class="surface test-summary">
        <p class="test-summary__count">Tests Passed: ${passed} / ${TEST_CHECKLIST_ITEMS.length}</p>
        ${passed < TEST_CHECKLIST_ITEMS.length ? '<p class="test-summary__warning">Resolve all issues before shipping.</p>' : ""}
      </section>

      <section class="surface test-list" id="test-list">
        ${TEST_CHECKLIST_ITEMS.map((item, index) => `
          <label class="test-item">
            <input type="checkbox" data-test-index="${index}" ${status[index] ? "checked" : ""} />
            <span>${escapeHtml(item)}</span>
            <span class="test-tip" title="How to test">How to test</span>
          </label>
        `).join("")}
      </section>

      <div class="form-actions">
        <button class="btn btn-secondary" type="button" id="reset-test-status">Reset Test Status</button>
      </div>
    </section>
  `;

  bindTestChecklist();
}

function updateTestSummary(values) {
  const passed = getPassedTestCount(values);
  const countNode = document.querySelector(".test-summary__count");
  const warningNode = document.querySelector(".test-summary__warning");

  if (countNode) {
    countNode.textContent = `Tests Passed: ${passed} / ${TEST_CHECKLIST_ITEMS.length}`;
  }

  if (passed < TEST_CHECKLIST_ITEMS.length) {
    if (!warningNode) {
      const summary = document.querySelector(".test-summary");
      if (summary) {
        const p = document.createElement("p");
        p.className = "test-summary__warning";
        p.textContent = "Resolve all issues before shipping.";
        summary.appendChild(p);
      }
    }
  } else if (warningNode) {
    warningNode.remove();
  }
}

function bindTestChecklist() {
  const list = document.querySelector("#test-list");
  const resetButton = document.querySelector("#reset-test-status");
  if (!list) {
    return;
  }

  list.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const idx = Number(target.getAttribute("data-test-index"));
    if (!Number.isFinite(idx)) {
      return;
    }

    const current = loadTestStatus();
    current[idx] = target.checked;
    saveTestStatus(current);
    updateTestSummary(current);
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const reset = Array(TEST_CHECKLIST_ITEMS.length).fill(false);
      saveTestStatus(reset);
      const boxes = list.querySelectorAll('input[type="checkbox"]');
      boxes.forEach((box) => {
        box.checked = false;
      });
      updateTestSummary(reset);
    });
  }
}

function renderShipGate() {
  const status = loadTestStatus();
  const passed = getPassedTestCount(status);
  const unlocked = areAllTestsPassed(status);

  routeView.innerHTML = `
    <section class="page" aria-labelledby="page-title">
      <h1 id="page-title">Ship Gate</h1>
      ${
        unlocked
          ? `<section class="surface">
              <p>All tests completed. Shipping gate unlocked.</p>
            </section>`
          : `<section class="surface ship-lock">
              <p>Complete all tests before shipping.</p>
              <p>Current status: ${passed} / ${TEST_CHECKLIST_ITEMS.length} tests passed.</p>
              <a class="btn btn-secondary" href="/jt/07-test" data-route>Go to Test Checklist</a>
            </section>`
      }
    </section>
  `;
}

function renderRoute(pathname) {
  const normalized = normalizePath(pathname);
  const route = getRoute(normalized);
  const preferences = loadPreferences();

  if (route.notFound) {
    routeView.innerHTML = `
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </section>
    `;
  } else if (route.key === "landing") {
    routeView.innerHTML = `
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">Stop Missing The Right Jobs.</h1>
        <p class="lead">Precision-matched job discovery delivered daily at 9AM.</p>
        <a class="btn btn-primary" href="/settings" data-route>Start Tracking</a>
      </section>
    `;
  } else if (route.key === "settings") {
    routeView.innerHTML = `
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">Settings</h1>
        <p class="lead">Set your targeting preferences for deterministic matching.</p>
        ${renderSettingsForm(preferences)}
        <p id="preferences-status" class="muted-inline"></p>
      </section>
    `;
    bindSettingsForm();
  } else if (route.key === "dashboard") {
    renderDashboard(preferences);
  } else if (route.key === "saved") {
    renderSaved(preferences);
  } else if (route.key === "digest") {
    renderDigest(preferences);
  } else if (route.key === "test-checklist") {
    renderTestChecklist();
  } else if (route.key === "ship-gate") {
    renderShipGate();
  } else if (route.key === "proof") {
    routeView.innerHTML = `
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">Proof</h1>
        <p>This section will host artifact collection in the next step.</p>
      </section>
    `;
  }

  document.title = `Job Notification Tracker | ${route.title}`;
  updateActiveLinks(normalized);
}

function updateActiveLinks(pathname) {
  const current = pathname;
  const links = document.querySelectorAll("[data-route]");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    const active = href === current;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function closeMobileNav() {
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
}

function navigateTo(pathname) {
  const target = normalizePath(pathname);
  const current = normalizePath(window.location.pathname);

  if (target === current) {
    closeMobileNav();
    return;
  }

  window.history.pushState({}, "", target);
  renderRoute(target);
  closeMobileNav();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-route]");
  if (link) {
    const href = link.getAttribute("href");
    if (href && href.startsWith("/")) {
      event.preventDefault();
      navigateTo(href);
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeJobModal();
  }
});

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileNav.hidden = isOpen;
});

window.addEventListener("popstate", () => {
  renderRoute(window.location.pathname);
  closeMobileNav();
});

renderRoute(window.location.pathname);
closeMobileNav();


