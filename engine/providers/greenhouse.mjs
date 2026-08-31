export default {
  async fetch(entry, ctx) {
    const data = await ctx.json(`https://boards-api.greenhouse.io/v1/boards/${entry.token}/jobs`);
    if (!data || !Array.isArray(data.jobs)) return [];
    return data.jobs.map((j) => ({
      title: j.title, url: j.absolute_url,
      location: j.location?.name || "Remote", salary: null,
      postedAt: j.first_published ? Date.parse(j.first_published) : undefined,
    }));
  },
};
