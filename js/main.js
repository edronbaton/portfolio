(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem("kriva-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);

  const themeBtn = document.querySelector("[data-theme-toggle]");
  const setTheme = (next) => {
    root.setAttribute("data-theme", next);
    localStorage.setItem("kriva-theme", next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#000000" : "#f5f5f7");
  };

  themeBtn?.addEventListener("click", () => {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  const nav = document.querySelector(".nav");
  const menuBtn = document.querySelector("[data-menu]");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });

  const progress = document.querySelector(".progress");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = `${value * 100}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = document.querySelectorAll(".nav-links a");
  const sections = [...links]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
  );
  sections.forEach((section) => spy.observe(section));

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          reveal.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.animationDelay = `${(i % 4) * 80}ms`;
    reveal.observe(el);
  });

  const startLenis = () => {
    if (!window.Lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.style.scrollBehavior = "smooth";
      return;
    }
    const lenis = new window.Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -12, duration: 1.15 });
      });
    });
  };

  if (window.Lenis) startLenis();
  else {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js";
    script.onload = startLenis;
    script.onerror = startLenis;
    document.head.appendChild(script);
  }

  const cycle = document.querySelector(".cycle");
  if (cycle) {
    const words = [...cycle.children];
    let index = 0;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    words.forEach((word, i) => word.classList.toggle("is-on", i === 0));
    if (!prefersReduce && words.length > 1) {
      window.setInterval(() => {
        words[index].classList.remove("is-on");
        index = (index + 1) % words.length;
        words[index].classList.add("is-on");
      }, 2400);
    }
  }

  const form = document.querySelector(".form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const message = String(data.get("message") || "").trim();
    const text = `Привет, Kriva. Это ${name}. Связь: ${contact}. ${message}`;
    form.classList.add("success");
    const note = form.querySelector(".form-note");
    if (note) {
      note.textContent = "Текст скопирован. Напишите Kriva в GitHub — ссылка слева.";
    }
    navigator.clipboard?.writeText(text).catch(() => {});
    form.reset();
  });
})();
