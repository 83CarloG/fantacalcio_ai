"use strict";

// -- live-auction call screen: whistle button reveals the rising-price tracker, which
// recomputes the bid/pass verdict on every price change via the same evaluateBid math the
// removed player-page form used to call, now driven by the owner's real live budget/slots
// instead of typed-in numbers (see apps/web-bff/src/auction/features/evaluateLiveBid.js).
(function enhanceAuctionCallScreen() {
    const whistleBtn = document.getElementById("whistle-btn");
    if (!whistleBtn) return;
    const tracker = document.getElementById("bid-tracker");
    const bidInput = document.getElementById("current-bid");
    const plus1 = document.getElementById("bid-plus1");
    const verdict = document.getElementById("bid-verdict");
    const winPrice = document.getElementById("win-price");

    function syncWinPrice() { if (winPrice) winPrice.value = bidInput.value; }

    async function refreshVerdict() {
        const currentBid = Number(bidInput.value);
        if (!Number.isFinite(currentBid) || currentBid < 1) return;
        syncWinPrice();
        verdict.setAttribute("aria-busy", "true");
        try {
            // works unchanged from both call screens (Preparazione's /auction/live/call/:id
            // and Live's /live/call/:id, Task F) — the evaluate endpoint is always the
            // current page's own path with /evaluate appended
            const response = await fetch(`${location.pathname}/evaluate?currentBid=${currentBid}`);
            const payload = await response.json();
            if (payload.error) {
                verdict.innerHTML = `<p class="form-error">${payload.error}</p>`;
                return;
            }
            const evaluation = payload.evaluation;
            const isBid = evaluation.strategy === "bid";
            const strategyLabel = isBid ? "RILANCIA" : "FERMATI";
            const tone = isBid ? "SUCCESS" : "FAILED";
            const strategyDetail = isBid
                ? `puoi arrivare fino a <strong>${evaluation.recommendedMaxBid} cr</strong>`
                : `il massimo consigliato era <strong>${evaluation.recommendedMaxBid} cr</strong>`;
            verdict.innerHTML = `
                <p class="bid-verdict__strategy"><span class="status-pill status-pill--${tone}"><span class="status-pill__dot"></span>${strategyLabel}</span> ${strategyDetail}</p>
                <p class="run-line__detail">Riserva minima: ${evaluation.minimumReserve} cr &middot; budget dopo riserva: ${evaluation.affordableBudget} cr</p>`;
        } catch (_error) {
            verdict.innerHTML = '<p class="form-error">Richiesta non riuscita, riprova.</p>';
        } finally {
            verdict.removeAttribute("aria-busy");
        }
    }

    whistleBtn.addEventListener("click", function () {
        whistleBtn.hidden = true;
        tracker.hidden = false;
        refreshVerdict();
    });
    plus1.addEventListener("click", function () {
        bidInput.value = Number(bidInput.value || 0) + 1;
        refreshVerdict();
    });
    bidInput.addEventListener("input", refreshVerdict);
})();

// -- mobile nav: hamburger toggle for the header, below the 768px breakpoint --
(function enhanceNavToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Chiudi il menu di navigazione" : "Apri il menu di navigazione");
    }

    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (event) { if (event.target.tagName === "A") setOpen(false); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") setOpen(false); });
})();

// -- admin data-panel forms: full-page POSTs (no fetch/preventDefault — every action here is a
// real background job, some minutes-long) still deserve immediate feedback and a guard against
// a second click while the browser is between "form submitted" and "next page painted".
(function enhanceAdminToolbarForms() {
    document.addEventListener("submit", function (event) {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.method !== "post") return;
        if (!form.closest(".admin-toolbar, .import-panel")) return;
        const button = form.querySelector('fanta-button[type="submit"]');
        if (button) button.setAttribute("loading", "");
    });
})();

// -- admin panel live progress: while a listone import or FPEDIA batch is in flight (server
// decides via `pollActive`, see apps/web-bff/server/routes/pages.js), poll this same page as
// JSON every few seconds and refresh the run-status pill + FPEDIA progress bar in place —
// otherwise "in corso" is only ever a snapshot from the moment the page happened to load, and
// the admin has to keep hitting reload to see whether a multi-minute job is still going.
(function pollAdminProgress() {
    const panel = document.querySelector(".admin-panel[data-poll]");
    if (!panel || panel.dataset.poll !== "true") return;
    const runStatusEl = document.getElementById("listone-run-status");
    const progressEl = document.getElementById("fpedia-progress");
    const RUN_STATUS_LABELS = {SUCCESS: "Completato", RUNNING: "In corso", FAILED: "Fallito"};

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (ch) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[ch];
        });
    }

    function renderRunLine(listoneRun) {
        if (!listoneRun) {
            return '<p class="run-line"><span class="status-pill status-pill--NONE"><span class="status-pill__dot"></span>Non eseguito</span></p>';
        }
        const label = RUN_STATUS_LABELS[listoneRun.status] || "Non eseguito";
        let detail = "";
        if (listoneRun.status === "RUNNING") detail = `avviato il ${escapeHtml(listoneRun.startedAt)}`;
        else if (listoneRun.status === "SUCCESS") {
            const result = listoneRun.result || {};
            const identity = result.identity || {};
            detail = `${escapeHtml(listoneRun.finishedAt)} — ${result.imported} importati, ${result.removed} rimossi, ${identity.reconciled}/${identity.total} nomi risolti`;
        } else if (listoneRun.status === "FAILED") {
            detail = `${escapeHtml(listoneRun.finishedAt)}: ${escapeHtml(listoneRun.error)}`;
        }
        return `<p class="run-line"><span class="status-pill status-pill--${listoneRun.status}"><span class="status-pill__dot"></span>${label}</span>${detail ? `<span class="run-line__detail">${detail}</span>` : ""}</p>`;
    }

    function renderProgress(progress) {
        if (!progress) return "";
        const pendingStat = progress.complete ? "" : `<span class="progress__stat progress__stat--muted">${progress.pending} in coda</span>`;
        const unmatchedNote = progress.unmatched
            ? `<p class="progress__note"><span class="status-pill status-pill--NONE">${progress.unmatched} assenti da FPEDIA</span> non sono ancora pubblicati sull'indice FPEDIA: non possono essere arricchiti da nessun batch finché non compaiono lì, non sono "in coda".</p>`
            : "";
        return `<div class="progress">
              <div class="progress__head">
                <span class="progress__label">Enrichment FPEDIA</span>
                <span class="progress__value">${progress.attempted} / ${progress.identified} &middot; ${progress.percentComplete}%</span>
              </div>
              <div class="progress__bar"><div class="progress__fill" style="width:${progress.percentComplete}%"></div></div>
              <div class="progress__breakdown">
                <span class="progress__stat progress__stat--success">${progress.success} completati</span>
                <span class="progress__stat progress__stat--warning">${progress.needsReview} da rivedere</span>
                <span class="progress__stat progress__stat--danger">${progress.failedRetryable} falliti</span>
                <span class="progress__stat progress__stat--muted">${progress.notFound} non trovati</span>
                ${pendingStat}
              </div>
              ${unmatchedNote}
            </div>`;
    }

    async function tick() {
        try {
            const response = await fetch("/setup", {headers: {accept: "application/json"}});
            const payload = await response.json();
            if (runStatusEl) runStatusEl.innerHTML = renderRunLine(payload.listoneRun);
            if (progressEl) progressEl.innerHTML = renderProgress(payload.fpediaProgress);
            if (!payload.pollActive) return; // server says there's nothing left in flight
        } catch (_error) {
            // transient network hiccup — try again on the next tick rather than going silent
        }
        setTimeout(tick, 4000);
    }

    setTimeout(tick, 4000);
})();

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

// -- "my list" quick actions (fanta-quick-actions bubbles {playerId, action}) — used both on
// the single-player call screen and on the bulk watchlist-builder page, so this listener is
// global rather than page-guarded, same as the fanta-search listener above.
document.addEventListener("fanta-quick-action", async function (event) {
    const trigger = event.target; // the <fanta-quick-actions> element itself dispatches it
    const {playerId, action} = event.detail;
    if (action === "open-profile") {
        window.location.href = `/players/${playerId}`;
        return;
    }
    if (action !== "toggle-target") return;
    try {
        const response = await fetch(`/auction/live/targets/${playerId}/toggle`, {method: "POST"});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const {isTarget} = await response.json();
        trigger.toggleAttribute("data-target-active", isTarget);
        trigger.setAttribute("data-actions", JSON.stringify([
            {action: "toggle-target", label: isTarget ? "Rimuovi da lista" : "Aggiungi a lista"},
            {action: "open-profile", label: "Vai alla scheda"}
        ]));
        // both host pages keep an optional adjacent status flag element to update in place —
        // the call screen's <span class="target-status"> and the watchlist row's <td>
        const status = trigger.closest("[data-quick-actions-row]")?.querySelector(".target-status") || trigger.parentElement?.querySelector(".target-status");
        if (status) status.textContent = isTarget ? "★ Nel mirino" : "";
    } catch (_error) {
        // best-effort, same as the old form-based toggle it replaces — the trigger's visual
        // state simply doesn't change, no separate error UI for this small action
    }
});
