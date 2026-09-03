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
    window.lenisScrollTo = (el) => lenis.scrollTo(el, { offset: -12, duration: 1.15 });
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

  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const formatCount = (value, format) => {
    if (format === "kplus") return `${Math.round(value / 1000)}k\u200A+`;
    return `${Math.round(value)}`;
  };
  const runCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const format = el.dataset.format || "kplus";
    if (prefersReduce || target <= 0) {
      el.textContent = formatCount(target, format);
      return;
    }
    const start = performance.now();
    const duration = 1700;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const current = target * eased;
      el.textContent = t === 1 ? formatCount(target, format) : `${Math.round(current / 1000)}k`;
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

  const MALMO = [55.6059, 13.0007];
  const loadLeaflet = () =>
    new Promise((resolve, reject) => {
      if (window.L) {
        resolve();
        return;
      }
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

  const initMalmoMap = () => {
    const el = document.getElementById("malmo-map");
    if (!el || !window.L) return;
    const map = window.L.map(el, {
      center: MALMO,
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
    });
    window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles © Esri",
      maxZoom: 19,
    }).addTo(map);
    window.L.marker(MALMO, {
      interactive: false,
      keyboard: false,
      icon: window.L.divIcon({
        className: "map-pin",
        html: "<i></i>",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }).addTo(map);

    const resize = () => map.invalidateSize();
    window.addEventListener("resize", resize);
    const card = el.closest(".reveal");
    if (card) {
      const sync = () => {
        if (card.classList.contains("is-in")) {
          resize();
          window.setTimeout(resize, 320);
        }
      };
      sync();
      new MutationObserver(sync).observe(card, { attributes: true, attributeFilter: ["class"] });
    } else {
      window.setTimeout(resize, 200);
    }
  };

  loadLeaflet().then(initMalmoMap).catch(() => {});

  const prefersReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initPhones = () => {
    document.querySelectorAll("[data-phone]").forEach((phone, phoneIndex) => {
      const shots = [...phone.querySelectorAll(".iphone-shots img")];
      const dots = phone.querySelector(".iphone-dots");
      const label = phone.querySelector("[data-shot-label]");
      if (shots.length < 2) return;
      shots.forEach((img, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", img.dataset.label || `Screen ${i + 1}`);
        if (i === 0) btn.classList.add("is-on");
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          show(i, true);
        });
        dots?.append(btn);
      });
      let index = 0;
      let timer;
      const show = (next, manual) => {
        shots[index].classList.remove("is-on");
        dots?.children[index]?.classList.remove("is-on");
        index = (next + shots.length) % shots.length;
        shots[index].classList.add("is-on");
        dots?.children[index]?.classList.add("is-on");
        if (label) label.textContent = shots[index].dataset.label || "";
        if (manual) restart();
      };
      const restart = () => {
        window.clearInterval(timer);
        if (prefersReduceMotion) return;
        timer = window.setInterval(() => show(index + 1), 2800 + phoneIndex * 450);
      };
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) restart();
            else window.clearInterval(timer);
          });
        },
        { threshold: 0.3 }
      ).observe(phone);
      phone.addEventListener("click", (event) => {
        if (event.target.closest(".iphone-dots, a")) return;
        show(index + 1, true);
      });
    });

    const toggle = document.querySelector(".app-toggle");
    toggle?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-show]");
      if (!btn) return;
      toggle.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-selected", String(item === btn));
      });
      document.querySelectorAll(".phone-case").forEach((card) => {
        card.classList.toggle("is-shown", card.dataset.app === btn.dataset.show);
      });
    });
  };

  const initSpine = () => {
    const stream = document.querySelector(".case-stream");
    const spine = document.querySelector(".case-spine");
    const progress = document.querySelector(".spine-progress");
    if (!stream || !spine || !progress) return;
    const cases = [...stream.querySelectorAll("[data-case]")];
    const nodes = cases.map((section) => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = "spine-node";
      node.setAttribute("aria-label", `Go to ${section.id}`);
      node.addEventListener("click", () => {
        const target = document.getElementById(section.id);
        if (!target) return;
        if (window.lenisScrollTo) window.lenisScrollTo(target);
        else target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      spine.append(node);
      return node;
    });

    const track = spine.querySelector(".spine-track");
    let trackTop = 0;
    let trackHeight = 1;

    const layout = () => {
      const spineTop = spine.getBoundingClientRect().top + window.scrollY;
      const rects = cases.map((section) => {
        const card = section.querySelector(".case-card") || section;
        const face = section.querySelector(".case-face") || card;
        const cardR = card.getBoundingClientRect();
        const faceR = face.getBoundingClientRect();
        return {
          nodeY: faceR.top + window.scrollY + faceR.height / 2 - spineTop,
          top: cardR.top + window.scrollY - spineTop,
          bottom: cardR.bottom + window.scrollY - spineTop,
        };
      });
      nodes.forEach((node, i) => {
        node.style.top = `${rects[i].nodeY}px`;
      });
      if (!rects.length) return;
      trackTop = rects[0].top;
      trackHeight = Math.max(1, rects[rects.length - 1].bottom - trackTop);
      [track, progress].forEach((el) => {
        if (!el) return;
        el.style.top = `${trackTop}px`;
        el.style.height = `${trackHeight}px`;
      });
    };

    const onScroll = () => {
      const read = window.innerHeight * 0.42 - spine.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (read - trackTop) / trackHeight));
      progress.style.transform = `translateX(-50%) scaleY(${p})`;
      cases.forEach((section, i) => {
        const r = section.getBoundingClientRect();
        const active = r.top < window.innerHeight * 0.52 && r.bottom > window.innerHeight * 0.28;
        nodes[i].classList.toggle("is-on", active);
      });
    };

    layout();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      layout();
      onScroll();
    });
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        layout();
        onScroll();
      }).observe(stream);
    }
  };

  const initCaseFold = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setOpen = (block, open) => {
      const detail = block.querySelector(".case-detail");
      if (!detail) return;
      block.classList.toggle("is-open", open);
      block.querySelectorAll("[data-case-toggle]").forEach((btn) => {
        btn.setAttribute("aria-expanded", String(open));
      });
      if ("inert" in detail) detail.inert = !open;
      if (open) {
        block.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
      }
      if (!open) {
        block.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
      }
    };

    document.querySelectorAll("[data-case]").forEach((block) => {
      const toggle = block.querySelector("[data-case-toggle]");
      if (!toggle) return;
      const face = block.querySelector(".case-face");
      const flip = () => {
        const next = !block.classList.contains("is-open");
        setOpen(block, next);
        if (next && !reduceMotion) {
          window.setTimeout(() => {
            if (window.lenisScrollTo) window.lenisScrollTo(block);
            else block.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 80);
        }
      };
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        flip();
      });
      face?.addEventListener("click", (event) => {
        if (event.target.closest("a, .btn, [data-case-toggle]")) return;
        flip();
      });
    });
  };

  initPhones();
  initSpine();
  initCaseFold();

  const bindGallery = (root) => {
    const dialog = root.querySelector(".ads-lightbox");
    const frame = root.querySelector("[data-lightbox-img]");
    const url = root.querySelector("[data-lightbox-url]");
    if (!dialog || !frame) return;

    const open = (node) => {
      const img = node.querySelector("img");
      if (!img) return;
      frame.src = img.currentSrc || img.src;
      frame.alt = img.alt || "";
      if (url) url.textContent = node.dataset.url || "";
      if (typeof dialog.showModal === "function") dialog.showModal();
    };

    const filterBar = root.querySelector(".ads-filter");
    const graph = root.querySelector(".ads-graph");
    const nodes = [...root.querySelectorAll(".ads-node")];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = root.dataset.filter || "landing";
    let busy = false;

    const paint = (kind) => {
      current = kind;
      root.dataset.filter = kind;
      root.classList.add("is-filtered");
      let delay = 0;
      nodes.forEach((node) => {
        const match = node.dataset.kind === kind;
        node.hidden = !match;
        node.classList.remove("is-in-shot");
        node.style.removeProperty("animation-delay");
        if (match) {
          node.style.animationDelay = `${delay}ms`;
          delay += 60;
          void node.offsetWidth;
          node.classList.add("is-in-shot");
        }
      });
      filterBar?.querySelectorAll("[data-filter]").forEach((btn) => {
        const on = btn.dataset.filter === kind;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-selected", String(on));
      });
    };

    const applyFilter = (kind, instant = false) => {
      if (!kind || kind === current || busy) return;
      if (instant || reduceMotion) {
        paint(kind);
        return;
      }
      busy = true;
      graph?.classList.add("is-switching");
      window.setTimeout(() => {
        graph?.classList.remove("is-switching");
        paint(kind);
        busy = false;
      }, 280);
    };

    filterBar?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-filter]");
      if (!btn) return;
      applyFilter(btn.dataset.filter);
    });
    nodes.forEach((node) => {
      node.addEventListener("click", () => open(node));
    });
    dialog.querySelector("[data-lightbox-close]")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  };

  document.querySelectorAll("[data-gallery]").forEach(bindGallery);

  const form = document.querySelector(".form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const message = String(data.get("message") || "").trim();
    const text = `Hi Kriva. This is ${name}. Contact: ${contact}. ${message}`;
    form.classList.add("success");
    const note = form.querySelector(".form-note");
    if (note) {
      note.textContent = "Copied. Message Kriva on GitHub — link on the left.";
    }
    navigator.clipboard?.writeText(text).catch(() => {});
    form.reset();
  });

  const initGithub = async () => {
    const root = document.querySelector("[data-github]");
    if (!root) return;
    const user = root.dataset.github;
    const countEl = root.querySelector("[data-gh-count]");
    const cellsEl = root.querySelector("[data-gh-cells]");
    const monthsEl = root.querySelector("[data-gh-months]");
    if (!cellsEl) return;
    try {
      const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
      if (!res.ok) throw new Error("github");
      const data = await res.json();
      const days = data.contributions || [];
      const total = data.total?.lastYear ?? days.reduce((sum, day) => sum + (day.count || 0), 0);
      if (countEl) countEl.textContent = total.toLocaleString("en-US");
      const first = new Date(`${days[0].date}T00:00:00`);
      const pad = first.getDay();
      const weeks = [];
      let week = Array.from({ length: pad }, () => null);
      days.forEach((day) => {
        week.push(day);
        if (week.length === 7) {
          weeks.push(week);
          week = [];
        }
      });
      if (week.length) {
        while (week.length < 7) week.push(null);
        weeks.push(week);
      }
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      let lastMonth = -1;
      if (monthsEl) {
        monthsEl.innerHTML = weeks
          .map((column, i) => {
            const hit = column.find(Boolean);
            if (!hit) return "";
            const month = new Date(`${hit.date}T00:00:00`).getMonth();
            if (month === lastMonth) return "";
            lastMonth = month;
            return `<span style="--col:${i + 1}">${months[month]}</span>`;
          })
          .join("");
      }
      const frag = document.createDocumentFragment();
      weeks.forEach((column) => {
        column.forEach((day) => {
          const cell = document.createElement("span");
          cell.className = "gh-cell";
          if (!day) {
            cell.classList.add("is-empty");
          } else {
            cell.dataset.level = String(day.level ?? 0);
            cell.title = `${day.date}: ${day.count} contribution${day.count === 1 ? "" : "s"}`;
          }
          frag.append(cell);
        });
      });
      cellsEl.replaceChildren(frag);
    } catch {
      root.hidden = true;
    }
  };

  initGithub();

  // ── i18n ──────────────────────────────────────────────────────────────────
  const TRANSLATIONS = {
    en: {
      "nav.experience": "Experience",
      "nav.cases": "Cases",
      "nav.path": "Path",
      "nav.stack": "Stack",
      "nav.process": "Process",
      "nav.about": "About",
      "nav.contact": "Contact",
      "nav.cta": "Discuss a project",
      "hero.kicker": "AI Product Builder · Product Engineer",
      "hero.line1": "I build",
      "hero.cycle.0": "products end-to-end",
      "hero.cycle.1": "AI-native products",
      "hero.cycle.2": "SaaS & platforms",
      "hero.cycle.3": "Telegram bots",
      "hero.cycle.4": "payment flows",
      "hero.cycle.5": "automation",
      "hero.sub": "From vague idea to live product — product thinking, engineering and AI in one loop.",
      "hero.cta": "View cases",
      "hero.card.role": "AI Product Builder",
      "hero.card.speech": "AI Product Builder and Product Engineer. I take ideas from zero to live — product, engineering, AI and ship.",
      "process.kicker": "How I build",
      "process.title": "A short cycle to a live product",
      "process.lede": "I build products end-to-end",
      "process.step1.title": "Product",
      "process.step1.body": "Turn vague ideas into working products, define MVP scope and prioritize features.",
      "process.step2.title": "Engineering",
      "process.step2.body": "Build backend systems, APIs, databases, integrations and infrastructure.",
      "process.step3.title": "Payments",
      "process.step3.body": "Design payment flows, checkout, invoices, transaction states and monetization logic.",
      "process.step4.title": "AI & Automation",
      "process.step4.body": "Use LLMs, agents and AI-native development workflows to prototype and automate.",
      "process.step5.title": "Launch & Growth",
      "process.step5.body": "Deploy, monitor, measure usage and iterate based on real users.",
      "cases.more.title": "And more",
      "cases.more.label": "projects",
      "cases.more.caption": "Landings, bots, plugins and internal tools besides the cases above.",
      "path.kicker": "Timeline",
      "path.title": "How the commercial work stacked up",
      "path.y2023.title": "First commercial work",
      "path.y2023.body": "Started taking client orders: Telegram bots, scripts, automation and custom software.",
      "path.y2024.title": "Same craft, harder jobs",
      "path.y2024.body": "Kept shipping bots, automation and tools — more complex scopes, more production responsibility.",
      "path.y2025.title": "Products with real money",
      "path.y2025.body": "Moved into projects with live payment flows — subscriptions, transfers and monetization that actually settles.",
      "path.y2026.title": "Still shipping",
      "path.y2026.body": "Continuing end-to-end: bots, platforms and products with payments in production.",
    },
    ru: {
      "nav.experience": "Опыт",
      "nav.cases": "Кейсы",
      "nav.path": "Путь",
      "nav.stack": "Стек",
      "nav.process": "Процесс",
      "nav.about": "Обо мне",
      "nav.contact": "Контакт",
      "nav.cta": "Обсудить проект",
      "hero.kicker": "AI Product Builder · Product Engineer",
      "hero.line1": "Я создаю",
      "hero.cycle.0": "продукты под ключ",
      "hero.cycle.1": "AI-нативные продукты",
      "hero.cycle.2": "SaaS и платформы",
      "hero.cycle.3": "Telegram-ботов",
      "hero.cycle.4": "платёжные системы",
      "hero.cycle.5": "автоматизацию",
      "hero.sub": "От идеи до живого продукта — продуктовое мышление, инженерия и AI в одном цикле.",
      "hero.cta": "Посмотреть кейсы",
      "hero.card.role": "AI Product Builder",
      "hero.card.speech": "AI Product Builder и Product Engineer. Веду продукт от нуля до запуска — продукт, инженерия, AI и шип.",
      "process.kicker": "Как я строю продукты",
      "process.title": "Короткий цикл до живого продукта",
      "process.lede": "Я строю продукты под ключ",
      "process.step1.title": "Продукт",
      "process.step1.body": "Превращаю размытые идеи в рабочие продукты, определяю MVP и приоритеты фич.",
      "process.step2.title": "Инженерия",
      "process.step2.body": "Строю бэкенд, API, базы данных, интеграции и инфраструктуру.",
      "process.step3.title": "Платежи",
      "process.step3.body": "Проектирую платёжные флоу, чекаут, инвойсы, состояния транзакций и монетизацию.",
      "process.step4.title": "AI и автоматизация",
      "process.step4.body": "Использую LLM, агентов и AI-native подходы для прототипирования и автоматизации.",
      "process.step5.title": "Запуск и рост",
      "process.step5.body": "Деплой, мониторинг, аналитика и итерации на основе реальных пользователей.",
      "cases.more.title": "И ещё",
      "cases.more.label": "проектов",
      "cases.more.caption": "Лендинги, боты, плагины и внутренние инструменты помимо кейсов выше.",
      "path.kicker": "Путь",
      "path.title": "Как складывалась коммерческая работа",
      "path.y2023.title": "Первые заказы",
      "path.y2023.body": "Начал брать клиентскую работу: Telegram-боты, скрипты, автоматизация и кастомный софт.",
      "path.y2024.title": "Тот же крафт, сложнее задачи",
      "path.y2024.body": "Продолжал шипить ботов, автоматизацию и инструменты — шире скоуп и больше ответственности за прод.",
      "path.y2025.title": "Продукты с живыми деньгами",
      "path.y2025.body": "Вышел на проекты с реальными платежами — подписки, переводы и монетизация, которая реально проходит.",
      "path.y2026.title": "Продолжаю шипить",
      "path.y2026.body": "Дальше end-to-end: боты, платформы и продукты с платежами в проде.",
    },
  };

  const initI18n = () => {
    const stored = localStorage.getItem("kriva-lang");
    let lang = stored || "en";

    const apply = (l) => {
      lang = l;
      localStorage.setItem("kriva-lang", l);
      const dict = TRANSLATIONS[l] || TRANSLATIONS.en;
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (dict[key] !== undefined) el.textContent = dict[key];
      });
      document.documentElement.lang = l === "ru" ? "ru" : "en";
      const btn = document.querySelector("[data-lang-toggle]");
      if (btn) btn.textContent = l === "ru" ? "RU" : "EN";
    };

    apply(lang);

    document.querySelector("[data-lang-toggle]")?.addEventListener("click", () => {
      apply(lang === "en" ? "ru" : "en");
    });
  };

  initI18n();
})();
