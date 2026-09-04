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
  const fitCycle = () => {
    if (!cycle) return;
    if (window.matchMedia("(max-width: 640px)").matches) {
      cycle.style.width = "";
      return;
    }
    const active = cycle.querySelector(".is-on") || cycle.children[0];
    if (!active) return;
    const clone = active.cloneNode(true);
    clone.style.cssText =
      "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;pointer-events:none";
    clone.className = active.className;
    document.body.appendChild(clone);
    const width = Math.ceil(clone.getBoundingClientRect().width);
    clone.remove();
    if (width > 0) cycle.style.width = `${width}px`;
  };
  if (cycle) {
    const words = [...cycle.children];
    let index = 0;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    words.forEach((word, i) => word.classList.toggle("is-on", i === 0));
    fitCycle();
    window.addEventListener("resize", fitCycle);
    if (!prefersReduce && words.length > 1) {
      window.setInterval(() => {
        words[index].classList.remove("is-on");
        index = (index + 1) % words.length;
        words[index].classList.add("is-on");
        fitCycle();
      }, 2400);
    }
    window.__krivaFitCycle = fitCycle;
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
      window.__krivaGhWeeks = weeks;
      const paintMonths = () => {
        if (!monthsEl || !window.__krivaGhWeeks) return;
        const dict = window.__krivaDict || {};
        const months = (dict["stack.gh.months"] || "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec").split(",");
        let lastMonth = -1;
        monthsEl.innerHTML = window.__krivaGhWeeks
          .map((column, i) => {
            const hit = column.find(Boolean);
            if (!hit) return "";
            const month = new Date(`${hit.date}T00:00:00`).getMonth();
            if (month === lastMonth) return "";
            lastMonth = month;
            return `<span style="--col:${i + 1}">${months[month] || ""}</span>`;
          })
          .join("");
      };
      paintMonths();
      window.__krivaPaintGhMonths = paintMonths;
      const frag = document.createDocumentFragment();
      weeks.forEach((column) => {
        column.forEach((day) => {
          const cell = document.createElement("span");
          cell.className = "gh-cell";
          if (!day) {
            cell.classList.add("is-empty");
          } else {
            cell.dataset.level = String(day.level ?? 0);
            const dict = window.__krivaDict || {};
            const one = dict["stack.gh.one"] || "contribution";
            const many = dict["stack.gh.many"] || "contributions";
            cell.title = `${day.date}: ${day.count} ${day.count === 1 ? one : many}`;
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
      "meta.title": "Kriva Portfolio",
      "meta.description": "Portfolio of Arseniy (Kriva): 3+ years of commercial work. Landings, web platforms, SaaS, crypto plugins, Telegram bots, software and automation. About 200k real users monthly.",
      "a11y.skip": "Skip to content",
      "a11y.lang": "Switch language",
      "a11y.theme": "Toggle theme",
      "a11y.menu": "Menu",
      "a11y.map": "Map of Malmö, Sweden",
      "a11y.sections": "Sections",
      "nav.experience": "Experience",
      "nav.cases": "Cases",
      "nav.path": "Path",
      "nav.stack": "Stack",
      "nav.process": "Process",
      "nav.about": "About",
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
      "hero.map.country": "Sweden",
      "traffic.kicker": "Live reach",
      "traffic.label": "real monthly users",
      "traffic.note": "Traffic across live products — people who actually open and use them, every month.",
      "proof.years": "years of commercial work",
      "proof.users": "real monthly users",
      "proof.products": "shipped products and cases",
      "proof.web": "landings, SaaS and platforms",
      "case.n01": "Case 01",
      "case.n02": "Case 02",
      "case.n03": "Case 03",
      "case.look": "Look inside",
      "case.less": "Show less",
      "adsota.sub": "Telegram Ad Network",
      "adsota.lede": "Launch Telegram campaigns, target the audience, pick a format and watch live analytics — the same cabinet advertisers use.",
      "adsota.open": "Open adsota.io",
      "pay.sub": "Private payment gateway",
      "pay.lede": "Crypto invoices with USDT on multiple chains, a timed checkout, WalletConnect and a live admin console — a private gateway for payments, not a public storefront.",
      "pay.open": "Request access",
      "aicash.sub": "Telegram Mini App",
      "aicash.lede": "Hire AI workers, run the office, complete quests and withdraw — a live Mini App with real monthly users.",
      "aicash.detail": "Hire AI workers, buy credits, run quests and withdraw. Idle office with a shop and team.",
      "filter.landing": "Landing",
      "filter.platform": "Platform",
      "filter.brand": "Brand",
      "filter.checkout": "Checkout",
      "ads.col.demand": "Demand",
      "ads.col.network": "Network",
      "ads.col.supply": "Supply",
      "ads.node.landing": "Landing",
      "ads.node.campaigns": "Campaigns",
      "ads.node.editor": "Editor",
      "ads.node.formats": "Formats",
      "ads.node.analytics": "Analytics",
      "ads.node.docs": "Docs",
      "ads.node.brand": "Brand",
      "ads.node.mark": "Mark",
      "ads.node.publishers": "Publishers",
      "ads.node.resources": "Resources",
      "ads.node.withdraw": "Withdraw",
      "pay.node.invoice": "Invoice",
      "pay.node.currency": "Currency",
      "pay.node.network": "Network",
      "pay.node.proceed": "Proceed",
      "pay.node.pay": "Pay",
      "pay.node.wallet": "Wallet",
      "pay.node.admin": "Admin",
      "ui.close": "Close",
      "more.kicker": "Selected work",
      "more.title": "More products and cases",
      "more.lede": "Bots, libraries, AI products and tools — built and shipped.",
      "more.echo.body": "AI companion bot with subscription payments, gifts and OpenRouter-based dialogues. Built as a monetized Telegram product, not a demo.",
      "more.sotamaker.body": "Constructor for viral traffic bots in Telegram. Set up flows, invite mechanics and monetization — no code needed.",
      "more.smart.body": "Smart message renderer for Aiogram — JSON templates, dynamic keyboards, multi-language, notifications and async-first architecture.",
      "more.open.tg": "Open in Telegram",
      "more.open.gh": "GitHub",
      "more.open.pypi": "PyPI",
      "badge.dating": "Dating",
      "badge.payments": "Payments",
      "badge.tool": "Tool",
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
      "stack.kicker": "Stack",
      "stack.title": "Tools I build products with",
      "stack.tma": "Telegram Mini Apps",
      "stack.gh.suffix": "contributions in the last year",
      "stack.gh.mon": "Mon",
      "stack.gh.wed": "Wed",
      "stack.gh.fri": "Fri",
      "stack.gh.less": "Less",
      "stack.gh.more": "More",
      "stack.gh.months": "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
      "stack.gh.one": "contribution",
      "stack.gh.many": "contributions",
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
      "about.kicker": "About",
      "about.title": "About me",
      "about.lede": "CEO with an engineering core. I don’t stop at Python — I own the product, the infra and the ship date.",
      "about.card.title": "I run the product, not only the code",
      "about.card.body": "More than three years in commercial work — as the person who decides, deploys and supports. Python is in the toolkit. So are Docker, PostgreSQL, Redis, bots, Mini Apps and SaaS. Live systems, not a resume stack.",
      "about.li1": "CEO: product, team, clients — and I still open the repo.",
      "about.li2": "Infra I actually use: Docker, PostgreSQL, Redis, Git, production deploys.",
      "about.li3": "Landings, platforms, Telegram, crypto plugins and automation when the job lives there.",
      "about.li4": "Young, sharp and hungry to grow alongside the best.",
      "about.quote": "I work for results, not activity.",
      "about.phone.alt": "iPhone showing +$10 000 payment received from SotaAds LLC",
    },
    ru: {
      "meta.title": "Kriva Portfolio",
      "meta.description": "Портфолио Arseniy (Kriva): 3+ года коммерческой работы. Лендинги, веб-платформы, SaaS, крипто-плагины, Telegram-боты, софт и автоматизация. Около 200k реальных пользователей в месяц.",
      "a11y.skip": "К содержанию",
      "a11y.lang": "Сменить язык",
      "a11y.theme": "Сменить тему",
      "a11y.menu": "Меню",
      "a11y.map": "Карта Мальмё, Швеция",
      "a11y.sections": "Разделы",
      "nav.experience": "Опыт",
      "nav.cases": "Кейсы",
      "nav.path": "Путь",
      "nav.stack": "Стек",
      "nav.process": "Процесс",
      "nav.about": "Обо мне",
      "hero.kicker": "AI Product Builder · Product Engineer",
      "hero.line1": "Я создаю",
      "hero.cycle.0": "продукты",
      "hero.cycle.1": "AI-продукты",
      "hero.cycle.2": "SaaS и платформы",
      "hero.cycle.3": "Telegram-ботов",
      "hero.cycle.4": "платежи",
      "hero.cycle.5": "автоматизацию",
      "hero.sub": "От идеи до живого продукта — продуктовое мышление, инженерия и AI в одном цикле.",
      "hero.cta": "Кейсы",
      "hero.card.role": "AI Product Builder",
      "hero.card.speech": "AI Product Builder и Product Engineer. Веду продукт от нуля до запуска — продукт, инженерия, AI и шип.",
      "hero.map.country": "Швеция",
      "traffic.kicker": "Живой охват",
      "traffic.label": "юзеров / мес",
      "traffic.note": "Трафик по живым продуктам — люди, которые реально открывают и пользуются ими каждый месяц.",
      "proof.years": "лет коммерческой работы",
      "proof.users": "юзеров / мес",
      "proof.products": "запущенных продуктов и кейсов",
      "proof.web": "лендинги, SaaS и платформы",
      "case.n01": "Кейс 01",
      "case.n02": "Кейс 02",
      "case.n03": "Кейс 03",
      "case.look": "Внутри",
      "case.less": "Свернуть",
      "adsota.sub": "Рекламная сеть Telegram",
      "adsota.lede": "Запускайте Telegram-кампании, выбирайте аудиторию и формат, смотрите живую аналитику — тот же кабинет, которым пользуются рекламодатели.",
      "adsota.open": "Открыть adsota.io",
      "pay.sub": "Приватный платёжный шлюз",
      "pay.lede": "Крипто-инвойсы с USDT в нескольких сетях, чекаут с таймером, WalletConnect и живая админка — приватный шлюз для платежей, а не публичная витрина.",
      "pay.open": "Запросить доступ",
      "aicash.sub": "Telegram Mini App",
      "aicash.lede": "Нанимайте AI-сотрудников, ведите офис, выполняйте квесты и выводите средства — живое Mini App с реальной аудиторией.",
      "aicash.detail": "Нанимайте AI-сотрудников, покупайте кредиты, выполняйте квесты и выводите. Idle-офис с магазином и командой.",
      "filter.landing": "Лендинг",
      "filter.platform": "Платформа",
      "filter.brand": "Бренд",
      "filter.checkout": "Чекаут",
      "ads.col.demand": "Спрос",
      "ads.col.network": "Сеть",
      "ads.col.supply": "Предложение",
      "ads.node.landing": "Лендинг",
      "ads.node.campaigns": "Кампании",
      "ads.node.editor": "Редактор",
      "ads.node.formats": "Форматы",
      "ads.node.analytics": "Аналитика",
      "ads.node.docs": "Документация",
      "ads.node.brand": "Бренд",
      "ads.node.mark": "Знак",
      "ads.node.publishers": "Паблишеры",
      "ads.node.resources": "Ресурсы",
      "ads.node.withdraw": "Вывод",
      "pay.node.invoice": "Инвойс",
      "pay.node.currency": "Валюта",
      "pay.node.network": "Сеть",
      "pay.node.proceed": "Продолжить",
      "pay.node.pay": "Оплата",
      "pay.node.wallet": "Кошелёк",
      "pay.node.admin": "Админка",
      "ui.close": "Закрыть",
      "more.kicker": "Избранные работы",
      "more.title": "Ещё продукты и кейсы",
      "more.lede": "Боты, библиотеки, AI-продукты и инструменты — собраны и запущены.",
      "more.echo.body": "AI-компаньон бот с подписками, подарками и диалогами на OpenRouter. Монетизированный Telegram-продукт, а не демо.",
      "more.sotamaker.body": "Конструктор вирусных трафиковых ботов в Telegram. Настраивайте флоу, инвайты и монетизацию — без кода.",
      "more.smart.body": "Умный рендерер сообщений для Aiogram — JSON-шаблоны, динамические клавиатуры, мультиязычность, уведомления и async-first архитектура.",
      "more.open.tg": "Открыть в Telegram",
      "more.open.gh": "GitHub",
      "more.open.pypi": "PyPI",
      "badge.dating": "Дейтинг",
      "badge.payments": "Платежи",
      "badge.tool": "Инструмент",
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
      "stack.kicker": "Стек",
      "stack.title": "Инструменты, на которых я собираю продукты",
      "stack.tma": "Telegram Mini Apps",
      "stack.gh.suffix": "контрибуций за последний год",
      "stack.gh.mon": "Пн",
      "stack.gh.wed": "Ср",
      "stack.gh.fri": "Пт",
      "stack.gh.less": "Меньше",
      "stack.gh.more": "Больше",
      "stack.gh.months": "Янв,Фев,Мар,Апр,Май,Июн,Июл,Авг,Сен,Окт,Ноя,Дек",
      "stack.gh.one": "контрибуция",
      "stack.gh.many": "контрибуций",
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
      "about.kicker": "Обо мне",
      "about.title": "Обо мне",
      "about.lede": "CEO с инженерным ядром. Не останавливаюсь на Python — отвечаю за продукт, инфру и дату шипа.",
      "about.card.title": "Я веду продукт, а не только код",
      "about.card.body": "Больше трёх лет в коммерческой работе — как человек, который решает, деплоит и поддерживает. Python в тулките. Также Docker, PostgreSQL, Redis, боты, Mini Apps и SaaS. Живые системы, а не стек для резюме.",
      "about.li1": "CEO: продукт, команда, клиенты — и я всё ещё открываю репозиторий.",
      "about.li2": "Инфра, которой реально пользуюсь: Docker, PostgreSQL, Redis, Git, продовые деплои.",
      "about.li3": "Лендинги, платформы, Telegram, крипто-плагины и автоматизация — когда задача там.",
      "about.li4": "Молодой, острый и голодный расти рядом с лучшими.",
      "about.quote": "Я работаю на результат, а не на активность.",
      "about.phone.alt": "iPhone с платежом +$10 000 от SotaAds LLC",
    },
  };

  const initI18n = () => {
    const stored = localStorage.getItem("kriva-lang");
    let lang = stored || "en";

    const apply = (l) => {
      lang = l;
      localStorage.setItem("kriva-lang", l);
      const dict = TRANSLATIONS[l] || TRANSLATIONS.en;
      window.__krivaDict = dict;
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (dict[key] !== undefined) el.textContent = dict[key];
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.dataset.i18nPlaceholder;
        if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
      });
      document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
        const key = el.dataset.i18nAria;
        if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
      });
      document.querySelectorAll("[data-i18n-content]").forEach((el) => {
        const key = el.dataset.i18nContent;
        if (dict[key] !== undefined) el.setAttribute("content", dict[key]);
      });
      document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
        const key = el.dataset.i18nAlt;
        if (dict[key] !== undefined) el.setAttribute("alt", dict[key]);
      });
      const titleEl = document.querySelector("title[data-i18n]");
      if (titleEl && dict[titleEl.dataset.i18n] !== undefined) {
        document.title = dict[titleEl.dataset.i18n];
      }
      document.documentElement.lang = l === "ru" ? "ru" : "en";
      const btn = document.querySelector("[data-lang-toggle]");
      if (btn) btn.textContent = l === "ru" ? "RU" : "EN";
      if (typeof window.__krivaPaintGhMonths === "function") window.__krivaPaintGhMonths();
      if (typeof window.__krivaFitCycle === "function") window.__krivaFitCycle();
    };

    apply(lang);

    document.querySelector("[data-lang-toggle]")?.addEventListener("click", () => {
      apply(lang === "en" ? "ru" : "en");
    });
  };

  initI18n();
})();
