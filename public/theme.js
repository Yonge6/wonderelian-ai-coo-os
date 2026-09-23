/* Load before styles: persist explicit day/night choice; default to night. */
(() => {
  const key = "ai-coo-theme", choices = ["light", "dark"];
  let preference = "dark";
  try { const saved = localStorage.getItem(key); if (choices.includes(saved)) preference = saved; } catch {}
  function apply() {
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = preference;
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      const selected = button.dataset.themeChoice === preference;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }
  apply();
  document.addEventListener("DOMContentLoaded", apply);
  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-theme-choice]");
    if (!button || !choices.includes(button.dataset.themeChoice)) return;
    preference = button.dataset.themeChoice;
    try { localStorage.setItem(key, preference); } catch {}
    apply();
  });
})();
