const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const cache = new Map();
module.exports = { reset: () => cache.clear(), transform: async function (html) {
  if (typeof this.page.outputPath !== 'string' || !this.page.outputPath.endsWith('.html')) return html;
  const tags = [...html.matchAll(/<img\b[^>]*\bsrc="((?:\/)?assets\/img\/[^"?#]+\.(?:png|jpe?g))"[^>]*>/gi)];
  for (const [tag, src] of tags) {
    const relative = src.replace(/^\//, '');
    if (relative.split('/').includes('..')) continue;
    if (!cache.has(relative)) cache.set(relative, (async () => {
      const input = path.resolve('src', relative);
      const output = path.join('_site/assets/optimized', relative.slice('assets/img/'.length) + '.webp');
      await fs.mkdir(path.dirname(output), {recursive:true});
      const info = await sharp(input).rotate().resize({width:1200, withoutEnlargement:true}).webp({quality:82}).toFile(output);
      return {url: '/' + output.replace(/^_site\//, ''), width:info.width, height:info.height};
    })());
    const image = await cache.get(relative);
    let next = tag.replace(src, image.url);
    if (!/\bwidth=/.test(next)) next = next.replace('<img', `<img width="${image.width}" height="${image.height}"`);
    if (!/\bloading=/.test(next)) next = next.replace('<img', '<img loading="lazy"');
    if (!/\bdecoding=/.test(next)) next = next.replace('<img', '<img decoding="async"');
    html = html.replace(tag, next);
  }
  return html;
}};
