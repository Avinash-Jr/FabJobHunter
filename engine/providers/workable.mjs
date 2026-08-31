// Workable placeholder. Returning an empty list means the scanner just skips any
// company tagged ats: "workable" instead of erroring.
//
// To finish this later, wire it up exactly the way greenhouse.mjs does. Workable
// exposes a public widget feed per account, no key required:
//   https://apply.workable.com/api/v1/widget/accounts/<entry.token>?details=true
// It answers with { jobs: [...] }, where each job carries title, url or
// shortlink, location fields and a published date. So the body becomes: fetch
// that URL through ctx.json, bail out with [] if the shape is wrong, then map
// each job to { title, url, location, salary: null, postedAt }.
export default {
  async fetch(entry, ctx) {
    return [];
  },
};
