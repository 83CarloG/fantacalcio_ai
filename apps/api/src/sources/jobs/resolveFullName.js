"use strict";

/**
 * Turn a resolved source name into a displayable/searchable full name.
 *
 * `fpediaFullName`: FPEDIA's own "SURNAME GIVENNAME" format (all caps). For the common
 * 2-word case (one surname + one given name) the words are reversed into the conventional
 * "given surname" order (e.g. "PAZ NICO" -> "Nico Paz"). Compound surnames or multiple
 * given names (3+ words) are left in FPEDIA's own order rather than guessed at (e.g.
 * "DE GEA DAVID" -> "De Gea David") — still fully searchable, just not necessarily in
 * spoken order; there is no reliable deterministic way to split those without a dedicated
 * name database.
 *
 * `fallbackName`: already-natural-order name from a Fantacalcio.it player detail page,
 * used only when there was no FPEDIA match. Title-cased as-is.
 *
 * @param {{fpediaFullName?:string, fallbackName?:string}} input
 * @return {?string}
 */
module.exports = function resolveFullName({fpediaFullName, fallbackName} = {}) {
    const titleCase = function (value) {
        return value.toLowerCase().replace(/(^|[\s-])([a-zà-ÿ])/g, function (match, boundary, letter) {
            return boundary + letter.toUpperCase();
        });
    };

    if (fpediaFullName) {
        const words = fpediaFullName.trim().split(/\s+/).filter(Boolean);
        const ordered = words.length === 2 ? [words[1], words[0]] : words;
        return titleCase(ordered.join(" "));
    }
    if (fallbackName) return titleCase(fallbackName.trim());
    return null;
};
