module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/index.html");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("admin");

  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  eleventyConfig.addFilter("relatedPosts", (collection, currentUrl) => {
    return [...collection]
      .sort((a, b) => b.date - a.date)
      .filter((p) => p.url !== currentUrl)
      .slice(0, 3);
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => new Date(dateObj).toISOString().slice(0, 10));

  eleventyConfig.addFilter("readingTime", (html) => {
    const text = String(html || "").replace(/<[^>]*>/g, " ");
    const words = (text.match(/\S+/g) || []).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min de lectura`;
  });

  eleventyConfig.addFilter("collectionDataToJSON", (collection) =>
    JSON.stringify(
      (collection || []).map((item) => ({
        nombre: item.data.nombre,
        isapre: item.data.isapre,
        como_declarar: item.data.como_declarar,
      }))
    ).replace(/</g, "\\u003c")
  );

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const d = new Date(dateObj);
    return `${d.getUTCDate()} de ${meses[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
