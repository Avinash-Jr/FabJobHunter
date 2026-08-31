export default {
  async fetch(entry, ctx) {
    const data = await ctx.json(`https://api.lever.co/v0/postings/${entry.token}?mode=json`);
    if (!Array.isArray(data)) return [];
    return data.map((j) => ({
      title: j.text, url: j.hostedUrl,
      location: j.categories?.location || "Remote", salary: null,
      postedAt: typeof j.createdAt === "number" ? j.createdAt : undefined,
    }));
  },
};
