const routes = {
  "/": { title: "Job Notification Tracker", key: "landing", notFound: false },
  "/dashboard": { title: "Dashboard", key: "dashboard", notFound: false },
  "/settings": { title: "Settings", key: "settings", notFound: false },
  "/saved": { title: "Saved Jobs", key: "saved", notFound: false },
  "/digest": { title: "Daily Digest", key: "digest", notFound: false },
  "/proof": { title: "Proof", key: "proof", notFound: false },
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
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">Dashboard</h1>
        <div class="empty-state">
          <p>No jobs yet. In the next step, you will load a realistic dataset.</p>
        </div>
      </section>
    `;
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
  if (!link) {
    return;
  }

  const href = link.getAttribute("href");
  if (!href || !href.startsWith("/")) {
    return;
  }

  event.preventDefault();
  navigateTo(href);
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
