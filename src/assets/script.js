(() => {
  "use strict";

  const WHATSAPP_NUMBER = "56948627767";

  /* Mobile nav toggle */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* Multi-step quote form -> builds a prefilled WhatsApp message (no backend, no data stored) */
  const form = document.getElementById("quote-form");
  if (form) {
    const steps = Array.from(form.querySelectorAll(".form-step"));
    const dots = Array.from(form.querySelectorAll(".progress-dots span"));
    let current = 0;

    function renderStep() {
      steps.forEach((s, i) => s.classList.toggle("active", i === current));
      dots.forEach((d, i) => {
        d.classList.toggle("done", i < current);
        d.classList.toggle("active", i === current);
      });
      const counter = form.querySelector(".step-count");
      if (counter) counter.textContent = `Paso ${current + 1} de ${steps.length}`;
    }

    function validateStep(index) {
      const fields = steps[index].querySelectorAll("[required]");
      for (const f of fields) {
        if (f.type === "radio") {
          const group = steps[index].querySelectorAll(`[name="${f.name}"]`);
          if (![...group].some((r) => r.checked)) return false;
        } else if (!f.value.trim()) {
          f.focus();
          return false;
        }
      }
      return true;
    }

    form.querySelectorAll("[data-next]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (!validateStep(current)) {
          steps[current].classList.add("shake");
          setTimeout(() => steps[current].classList.remove("shake"), 300);
          return;
        }
        if (current < steps.length - 1) {
          current += 1;
          renderStep();
        }
      })
    );

    form.querySelectorAll("[data-prev]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (current > 0) {
          current -= 1;
          renderStep();
        }
      })
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateStep(current)) return;

      const data = new FormData(form);
      const nombre = (data.get("nombre") || "").toString().trim();
      const telefono = (data.get("telefono") || "").toString().trim();
      const edad = (data.get("edad") || "").toString().trim();
      const sexo = (data.get("sexo") || "").toString().trim();
      const region = (data.get("region") || "").toString().trim();
      const cargas = (data.get("cargas") || "").toString().trim();

      const lines = [
        "Hola, quiero una evaluación gratuita de mi plan de Isapre.",
        `Nombre: ${nombre}`,
        `Teléfono: ${telefono}`,
        `Edad: ${edad}`,
        sexo ? `Sexo: ${sexo}` : "",
        `Región: ${region}`,
        `Cargas familiares: ${cargas === "si" ? "Sí" : "Solo yo"}`,
      ].filter(Boolean);

      const message = encodeURIComponent(lines.join("\n"));
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener");
    });

    renderStep();
  }

  /* Reveal-on-scroll (progressive enhancement, respects reduced motion) */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && "IntersectionObserver" in window) {
    const revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach((el) => el.classList.add("reveal-armed"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
    // Safety net: never let a JS/observer hiccup permanently hide real content.
    setTimeout(() => revealEls.forEach((el) => el.classList.add("is-visible")), 4000);
  }

  /* Current year in footer */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
})();
