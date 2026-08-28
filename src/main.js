const toggle = document.querySelector(".theme-toggle");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-nav");
const root = document.body;
const savedTheme = localStorage.getItem("kriva-theme");

if (savedTheme === "dark") root.classList.add("dark");

toggle.addEventListener("click", () => {
  root.classList.toggle("dark");
  localStorage.setItem("kriva-theme", root.classList.contains("dark") ? "dark" : "light");
});

const closeMenu = () => {
  root.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
};

menuToggle.addEventListener("click", () => {
  const isOpen = root.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
});

navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => event.key === "Escape" && closeMenu());

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const words = ["продукты", "интерфейсы", "истории", "впечатления"];
const rotatingWord = document.querySelector("#rotating-word");
let wordIndex = 0;
setInterval(() => {
  rotatingWord.style.opacity = 0;
  rotatingWord.style.transform = "translateY(8px)";
  setTimeout(() => {
    wordIndex = (wordIndex + 1) % words.length;
    rotatingWord.textContent = words[wordIndex];
    rotatingWord.style.opacity = 1;
    rotatingWord.style.transform = "translateY(0)";
  }, 180);
}, 2600);
rotatingWord.style.transition = "opacity .18s, transform .18s";

document.addEventListener("pointermove", (event) => {
  const glow = document.querySelector(".cursor-glow");
  glow.style.left = `${event.clientX - window.innerWidth * 0.16}px`;
  glow.style.top = `${event.clientY - window.innerWidth * 0.16}px`;
});
