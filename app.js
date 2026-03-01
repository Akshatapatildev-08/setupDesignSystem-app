const routes = {
  "/": { title: "Job Notification Tracker", key: "landing", notFound: false },
  "/dashboard": { title: "Dashboard", key: "dashboard", notFound: false },
  "/settings": { title: "Settings", key: "settings", notFound: false },
  "/saved": { title: "Saved Jobs", key: "saved", notFound: false },
  "/digest": { title: "Daily Digest", key: "digest", notFound: false },
  "/proof": { title: "Proof", key: "proof", notFound: false }
};

const STORAGE_KEY = "jobNotificationTracker.savedJobIds";
const jobs = Array.isArray(window.jobsData) ? window.jobsData : [];
const jobsById = new Map(jobs.map((job) => [job.id, job]));

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

function getSavedJobIds() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
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

function formatPostedDaysAgo(days) {
  if (days === 0) {
    return "Posted today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

function renderDashboardCards() {
  if (!jobs.length) {
    return '<div class="empty-state"><p>No jobs yet. In the next step, you will load a realistic dataset.</p></div>';
  }

  return `
    <div class="jobs-grid">
      ${jobs
        .map((job) => {
          const saved = isJobSaved(job.id);

          return `
            <article class="job-card" data-job-id="${job.id}">
              <header class="job-card__header">
                <div>
                  <h2>${escapeHtml(job.title)}</h2>
                  <p class="job-card__company">${escapeHtml(job.company)}</p>
                </div>
                <span class="source-badge">${escapeHtml(job.source)}</span>
              </header>

              <p class="job-card__meta">${escapeHtml(job.location)} · ${escapeHtml(job.mode)}</p>
              <p class="job-card__meta">Experience: ${escapeHtml(job.experience)}</p>
              <p class="job-card__meta">Salary: ${escapeHtml(job.salaryRange)}</p>
              <p class="job-card__posted">${formatPostedDaysAgo(job.postedDaysAgo)}</p>

              <div class="job-card__actions">
                <button class="btn btn-secondary" type="button" data-action="view" data-job-id="${job.id}">View</button>
                <button class="btn btn-secondary ${saved ? "is-saved" : ""}" type="button" data-action="save" data-job-id="${job.id}">${saved ? "Saved" : "Save"}</button>
                <a class="btn btn-primary" href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noopener noreferrer">Apply</a>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
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

function bindDashboardInteractions() {
  const viewButtons = document.querySelectorAll('[data-action="view"]');
  const saveButtons = document.querySelectorAll('[data-action="save"]');

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.getAttribute("data-job-id");
      if (jobId) {
        openJobModal(jobId);
      }
    });
  });

  saveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.getAttribute("data-job-id");
      if (!jobId) {
        return;
      }

      const saved = toggleSaveJob(jobId);
      button.textContent = saved ? "Saved" : "Save";
      button.classList.toggle("is-saved", saved);
    });
  });

}

function renderRoute(pathname) {
  const normalized = normalizePath(pathname);
  const route = getRoute(normalized);

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
        <p class="lead">This section will be built in the next step.</p>
        <div class="surface field-stack" aria-label="Preference placeholders">
          <div class="field">
            <label>Role keywords</label>
            <input class="placeholder-input" type="text" value="e.g., Product Designer, Frontend Engineer" readonly />
          </div>
          <div class="field">
            <label>Preferred locations</label>
            <input class="placeholder-input" type="text" value="e.g., Bengaluru, Mumbai, Remote" readonly />
          </div>
          <div class="field">
            <label>Mode (Remote / Hybrid / Onsite)</label>
            <select class="placeholder-select" disabled>
              <option>Remote</option>
              <option>Hybrid</option>
              <option>Onsite</option>
            </select>
          </div>
          <div class="field">
            <label>Experience level</label>
            <input class="placeholder-input" type="text" value="e.g., 2-4 years" readonly />
          </div>
        </div>
      </section>
    `;
  } else if (route.key === "dashboard") {
    routeView.innerHTML = `
      <section class="page page--wide" aria-labelledby="page-title">
        <h1 id="page-title">Dashboard</h1>
        <p class="lead">Fresh opportunities aligned to your preferences.</p>
        ${renderDashboardCards()}
      </section>
    `;
    bindDashboardInteractions();
  } else if (route.key === "saved") {
    routeView.innerHTML = `
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">Saved</h1>
        <div class="empty-state">
          <p>Your saved opportunities will appear here in a focused, review-ready list.</p>
        </div>
      </section>
    `;
  } else if (route.key === "digest") {
    routeView.innerHTML = `
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">Digest</h1>
        <div class="empty-state">
          <p>Your daily summary will appear here when digest generation is added in the next step.</p>
        </div>
      </section>
    `;
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
      return;
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
