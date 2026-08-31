// Ashby placeholder. Returning an empty list means the scanner just skips any
// company tagged ats: "ashby" instead of erroring.
//
// To finish this later, wire it up exactly the way greenhouse.mjs does. Ashby's
// public board feed needs no key and lives at:
//   https://api.ashbyhq.com/posting-api/job-board/<entry.token>
// It answers with { jobs: [...] }, where each job carries title, jobUrl,
// location and publishedAt. So the body becomes: fetch that URL through
// ctx.json, bail out with [] if the shape is wrong, then map each job to
// { title, url, location, salary: null, postedAt }.
export default {
  async fetch(entry, ctx) {
    return [];
  },
};
