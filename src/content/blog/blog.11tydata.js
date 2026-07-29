module.exports = {
  layout: "post.njk",
  tags: "blog",
  permalink: (data) => `blog/${data.page.fileSlug}.html`,
  eleventyComputed: {
    canonical: (data) => `https://www.viexsalud.cl/blog/${data.page.fileSlug}.html`,
  },
};
