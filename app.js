const routes = {
  "/": { title: "Home", notFound: false },
  "/dashboard": { title: "Dashboard", notFound: false },
  "/settings": { title: "Settings", notFound: false },
  "/saved": { title: "Saved", notFound: false },
  "/digest": { title: "Digest", notFound: false },
  "/proof": { title: "Proof", notFound: false },
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
  return routes[normalized] || { title: "Page Not Found", notFound: true };
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
  } else {
    routeView.innerHTML = `
      <section class="page" aria-labelledby="page-title">
        <h1 id="page-title">${route.title}</h1>
        <p>This section will be built in the next step.</p>
      </section>
    `;
  }

  document.title = `Job Notification App | ${route.title}`;
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
