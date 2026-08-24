"use strict";

// -- table search (fanta-search bubbles a CustomEvent naming its target table + query) --
// Token-based, not a single substring: every word of the query must appear somewhere in
// the row's searchable text, in ANY order. This matters because Fantacalcio.it's bulk
// listone gives abbreviated names (e.g. "Paz N."); once identity reconciliation resolves
// the full name ("Nico Paz") into data-search, a plain `.includes("nico paz")` would still
// fail if the source ever prints surname-first — token matching is robust to that either way.
document.addEventListener("fanta-search", function (event) {
    const target = document.getElementById(event.detail.target);
    if (!target) return;
    const queryWords = String(event.detail.query || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visibleCount = 0;
    for (const row of target.querySelectorAll("tbody tr:not(.empty-state)")) {
        const haystack = String(row.dataset.search || row.textContent).toLowerCase();
        const matches = queryWords.every((word) => haystack.includes(word));
        row.hidden = !matches;
        if (matches) visibleCount += 1;
    }
    const emptyState = target.querySelector(".empty-state");
    if (emptyState) emptyState.hidden = visibleCount > 0;
});

// -- auction bid evaluation form: progressive enhancement over the plain GET form --
// without JS the form still works (full navigation, server-rendered result); with JS
// it fetches the same URL as JSON and swaps only the result panel, no page reload.
(function enhanceEvaluateForm() {
    const form = document.getElementById("evaluate-form");
    const result = document.getElementById("evaluate-result");
    if (!form || !result) return;

    const strategyLabel = {bid: "Rilancia", pass: "Ritirati"};

    function renderEvaluation(evaluation, evaluationError) {
        if (evaluationError) {
            result.innerHTML = `<p class="form-error">Impossibile valutare l'offerta: ${evaluationError}</p>`;
            return;
        }
        if (!evaluation) { result.innerHTML = ""; return; }
        result.innerHTML = `
            <p class="evaluate-result__verdict"><fanta-badge tone="${evaluation.strategy}">${strategyLabel[evaluation.strategy] || evaluation.strategy}</fanta-badge> rilancio massimo consigliato <strong>${evaluation.recommendedMaxBid} cr</strong></p>
            <p class="evaluate-result__detail">Riserva minima per gli slot residui: ${evaluation.minimumReserve} cr · budget disponibile dopo la riserva: ${evaluation.affordableBudget} cr</p>`;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const query = new URLSearchParams(new FormData(form)).toString();
        const url = `${form.getAttribute("action")}?${query}`;
        result.setAttribute("aria-busy", "true");
        try {
            const response = await fetch(url, {headers: {accept: "application/json"}});
            const payload = await response.json();
            renderEvaluation(payload.evaluation, payload.evaluationError);
            history.replaceState(null, "", url);
        } catch (_error) {
            renderEvaluation(null, "richiesta al server non riuscita, riprova.");
        } finally {
            result.removeAttribute("aria-busy");
        }
    });
})();
