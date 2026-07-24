// src/utils/slugify.js

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')   // strip punctuation/symbols but keep letters from ANY language (Khmer, Latin, etc.), numbers, and combining marks (Khmer vowel signs/diacritics)
    .replace(/[\s_-]+/g, '-')            // collapse whitespace/underscores to single dash
    .replace(/^-+|-+$/g, '');            // trim leading/trailing dashes
}

module.exports = { slugify };
