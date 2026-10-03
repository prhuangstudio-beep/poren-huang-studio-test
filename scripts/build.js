const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const site = 'https://porenhuang.com';
const brandIconHead = '<link rel="icon" type="image/x-icon" href="/favicon.ico"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#ffffff">';
const works = JSON.parse(fs.readFileSync(path.join(root, 'data', 'works.json'), 'utf8')).map(work => ({ ...work, previous_slugs: work.previous_slugs || [] })).sort((a, b) => a.order - b.order);
const read = name => fs.readFileSync(path.join(root, 'templates', name), 'utf8');
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clean = value => String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const render = (template, values) => template.replace(/{{(\w+)}}/g, (_, key) => values[key] ?? '');
const title = work => [work.title_en, work.title_zh].filter(Boolean).join(' ');
const redirectSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function redirectPage(previousSlug, currentSlug) {
  const destination = `/works/${currentSlug}.html`;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0; url=${destination}"><link rel="canonical" href="${site}/works/${currentSlug}"><title>Redirecting…</title><script>location.replace(${JSON.stringify(destination)});</script></head><body><p>Redirecting to <a href="${destination}">${destination}</a>.</p></body></html>`;
}
function buildPreviousSlugRedirects() {
  const currentSlugs = new Set(works.map(work => work.slug));
  const previousSlugs = new Map();
  works.forEach(work => {
    if (!Array.isArray(work.previous_slugs)) throw new Error(`previous_slugs must be an array for ${work.slug}`);
    work.previous_slugs.forEach(value => {
      const previousSlug = String(value || '').trim();
      if (!redirectSlugPattern.test(previousSlug)) throw new Error(`Invalid previous slug "${previousSlug}" for ${work.slug}`);
      if (currentSlugs.has(previousSlug)) throw new Error(`Previous slug "${previousSlug}" conflicts with an active work URL.`);
      if (previousSlugs.has(previousSlug)) throw new Error(`Previous slug "${previousSlug}" is assigned to both ${previousSlugs.get(previousSlug)} and ${work.slug}.`);
      previousSlugs.set(previousSlug, work.slug);
    });
  });
  previousSlugs.forEach((currentSlug, previousSlug) => write(path.join(root, 'works', `${previousSlug}.html`), redirectPage(previousSlug, currentSlug)));
  return previousSlugs.size;
}
const imageUrl = image => `${site}/${image.filename}`;
const imageSize = filename => {
  const data = fs.readFileSync(path.join(root, filename));
  for (let i = 2; i < data.length - 9; i++) if (data[i] === 0xff && [0xc0, 0xc1, 0xc2].includes(data[i + 1])) return { height: data.readUInt16BE(i + 5), width: data.readUInt16BE(i + 7) };
  return { width: 1200, height: 1200 };
};
const widthsFor = width => [...new Set([400, 800, 1200, 1920].filter(value => value <= width).concat(width))].sort((a, b) => a - b);
const picture = (image, { lazy = true } = {}) => {
  const size = imageSize(image.filename), widths = widthsFor(size.width), directory = path.posix.dirname(image.filename), base = path.posix.basename(image.filename, path.posix.extname(image.filename));
  const srcset = extension => widths.map(width => `${directory}/optimized/${base}-${width}w.${extension} ${width}w`).join(', ');
  return `<picture><source type="image/avif" srcset="${srcset('avif')}" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 800px"><source type="image/webp" srcset="${srcset('webp')}" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 800px"><img src="${image.filename}" srcset="${srcset('jpg')}" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 800px" alt="${esc(image.alt_zh || image.alt_en)}" width="${size.width}" height="${size.height}"${lazy ? ' loading="lazy"' : ''} decoding="async"></picture>`;
};
const dimText = dimension => [dimension.shape, dimension.size && `${dimension.size}${dimension.unit || ''}`].filter(Boolean).join(' ');
const workDescription = work => clean([work.description_zh, work.description_en].filter(Boolean).join(' ')) || `${title(work)}, ${work.year}. A sculpture by Poren Huang 黃柏仁.`;
const numberValues = work => {
  const first = work.dimensions?.[0];
  if (!first) return {};
  const values = String(first.size || '').match(/[\d.]+/g)?.map(Number) || [];
  const unit = first.unit === 'cm' ? 'CMT' : undefined;
  const quantitative = value => value === undefined ? undefined : { '@type': 'QuantitativeValue', value, unitCode: unit };
  return { width: quantitative(values[0]), height: quantitative(values[1]), depth: quantitative(values[2]) };
};
const person = JSON.parse(read('person-schema.json'));
function artworkSchema(work) {
  return {
    '@context': 'https://schema.org', '@type': 'VisualArtwork', '@id': `${site}/works/${work.slug}#artwork`,
    name: work.title_en, ...(work.title_zh ? { alternateName: work.title_zh } : {}),
    image: work.images.map(imageUrl), creator: { '@id': person['@id'], name: person.name, alternateName: person.alternateName },
    dateCreated: String(work.year), artMedium: work.material_en, artform: 'Sculpture',
    ...numberValues(work), description: workDescription(work), url: `${site}/works/${work.slug}`
  };
}
// A sculpture appears once in the overview. Its colour/material variants stay
// as separate detail pages, while their first photographs rotate in one card.
const workFamilyKey = work => [work.title_en, work.title_zh, work.year].map(value => String(value || '').trim().toLocaleLowerCase()).join('|');
const workFamilies = [...works.reduce((families, work) => {
  const key = workFamilyKey(work);
  if (!families.has(key)) families.set(key, []);
  families.get(key).push(work);
  return families;
}, new Map()).values()];
function card(family) {
  const work = family[0];
  const first = work.images[0];
  const search = family.flatMap(item => [item.title_en, item.title_zh, item.year, item.material_en, item.material_zh, item.colorway]).filter(Boolean).join(' ').toLocaleLowerCase();
  const slides = family.map((item, index) => {
    const image = item.images[0];
    if (!image) return '';
    return `<span class="work-card-slide${index === 0 ? ' is-active' : ''}"${index === 0 ? '' : ' aria-hidden="true"'}>${picture(image, { lazy: index !== 0 })}</span>`;
  }).join('');
  const variants = family.length > 1 ? ` data-work-variants="${family.length}"` : '';
  return `<a class="work-card" data-work-card${variants} data-year="${esc(work.year)}" data-search="${esc(search)}" href="works/${esc(work.slug)}"><figure class="works-cover work-card-carousel" data-work-card-carousel aria-label="${esc(title(work))}">${slides || picture(first)}</figure><div class="works-card-meta"><strong lang="en">${esc(work.title_en)}</strong>${work.title_zh ? `<span>${esc(work.title_zh)}</span>` : ''}<time>${esc(work.year)}</time></div></a>`;
}
const indexTemplate = read('works-index.html');
const years = [...new Set(works.map(work => work.year))].sort((a, b) => b - a);
const hreflang = url => `<link rel="alternate" hreflang="zh-Hant" href="${url}"><link rel="alternate" hreflang="en" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">`;
const indexPage = render(indexTemplate, { yearOptions: years.map(year => `<option value="${year}">${year}</option>`).join(''), workCards: workFamilies.map(card).join(''), hreflang: hreflang(`${site}/works`) });
write(path.join(root, 'works', 'index.html'), indexPage);
write(path.join(root, 'works.html'), indexPage);

const detailTemplate = read('work-page.html');
works.forEach((work, index) => {
  const metadata = [
    work.dimensions?.length ? `<p>${work.dimensions.map(dimText).map(esc).join('<br>')}</p>` : '',
    work.material_en ? `<p>${esc(work.material_en)}${work.material_zh ? ` / ${esc(work.material_zh)}` : ''}</p>` : '',
    work.edition ? `<p>Edition: ${esc(work.edition)}</p>` : '',
    work.colorway ? `<p>${esc(work.colorway)}</p>` : ''
  ].filter(Boolean).join('');
  const thumbnails = work.images.map((image, imageIndex) => `<button type="button" class="${imageIndex === 0 ? 'active' : ''}" data-work-image="${esc(image.filename)}" data-work-alt="${esc(image.alt_zh || image.alt_en)}">${picture(image)}</button>`).join('');
  const description = [work.description_en, work.description_zh].filter(Boolean).join('\n');
  const relatedWorks = [...works.slice(index + 1), ...works.slice(0, index)].slice(0, 4).map(item => `<a href="works/${esc(item.slug)}"><span class="square-media">${picture(item.images[0])}</span><span lang="en">${esc(item.title_en)} · ${esc(item.year)}</span></a>`).join('');
  const contactSubject = `Contact — ${title(work)} (${work.year})`;
  const contactBody = `Hello Poren Huang Studio,\n\nI am contacting you about: ${title(work)} (${work.year}).\n\nHow should we address you?\nName:\nContact information:\nMessage:\n`;
  const values = {
    title: esc(`${title(work)} | Poren Huang Studio 黃柏仁`), description: esc(workDescription(work)), canonical: `${site}/works/${work.slug}`,
    ogImage: `${site}/assets/og/${work.slug}.jpg`, schema: JSON.stringify(artworkSchema(work)), mainImage: picture(work.images[0], { lazy: false }), mainAlt: esc(work.images[0].alt_zh || work.images[0].alt_en), hreflang: hreflang(`${site}/works/${work.slug}`),
    thumbnails, heading: `<span class="work-title-en" lang="en">${esc(work.title_en)}</span>${work.title_zh ? `<span class="work-title-zh" lang="zh-Hant">${esc(work.title_zh)}</span>` : ''}`, year: esc(work.year), metadata,
    workContact: `<a class="work-contact-me" target="_blank" rel="noopener noreferrer" href="https://mail.google.com/mail/?view=cm&fs=1&to=pr_dogs@yahoo.com.tw&su=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(contactBody)}">CONTACT ME</a>`,
    descriptionBlock: description ? `<div class="work-description"><p>${esc(description).replace(/\n/g, '<br>')}</p></div>` : '', relatedWorks
  };
  write(path.join(root, 'works', `${work.slug}.html`), render(detailTemplate, values));
});
const redirectCount = buildPreviousSlugRedirects();

// The shared Person source is inserted on the two manually-authored pages on every build.
['index.html', 'about.html'].forEach(file => {
  const target = path.join(root, file);
  let html = fs.readFileSync(target, 'utf8');
  const personScript = `<script type="application/ld+json">${JSON.stringify(person)}</script>`;
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, personScript);
  write(target, html);
});

const routes = ['', 'about', 'works', 'exhibitions', 'press', ...works.map(work => `works/${work.slug}`)];
write(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${site}/${route}</loc></url>`).join('\n')}\n</urlset>\n`);

function addHreflangToStaticPages() {
  const rootPages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
  const workPages = fs.readdirSync(path.join(root, 'works')).filter(file => file.endsWith('.html')).map(file => path.join('works', file));
  [...rootPages, ...workPages].forEach(relative => {
    const target = path.join(root, relative);
    let html = fs.readFileSync(target, 'utf8');
    // Repair legacy escaped attribute quotes before normalising hreflang.
    html = html.replace(/\\(?=")/g, '');
    const route = relative === 'index.html' ? '' : relative.replace(/index\.html$/, '').replace(/\.html$/, '');
    const url = `${site}/${route}`.replace(/\/$/, '/');
    html = html.replace(/<link rel="alternate" hreflang="(?:zh-Hant|en|x-default)"[^>]*>/g, '');
    html = html.replace('</head>', `${hreflang(url)}</head>`);
    html = html.replaceAll(String.fromCharCode(92, 34), '"');
    write(target, html);
  });
}

async function optimizeImages() {
  const cacheFile = path.join(root, '.cache', 'image-optimization.json');
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  const images = works.flatMap(work => work.images);
  let created = 0, skipped = 0;
  for (const image of images) {
    const source = path.join(root, image.filename);
    if (!fs.existsSync(source)) continue;
    const stat = fs.statSync(source);
    const size = imageSize(image.filename);
    const directory = path.dirname(source);
    const base = path.basename(source, path.extname(source));
    const optimized = path.join(directory, 'optimized');
    const widths = widthsFor(size.width);
    const outputs = widths.flatMap(width => ['avif', 'webp', 'jpg'].map(extension => path.join(optimized, `${base}-${width}w.${extension}`)));
    if (cache[image.filename]?.mtimeMs === stat.mtimeMs && outputs.every(fs.existsSync)) { skipped++; continue; }
    fs.mkdirSync(optimized, { recursive: true });
    for (const width of widths) {
      const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
      await Promise.all([
        pipeline.clone().avif({ quality: 55 }).toFile(path.join(optimized, `${base}-${width}w.avif`)),
        pipeline.clone().webp({ quality: 78 }).toFile(path.join(optimized, `${base}-${width}w.webp`)),
        pipeline.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(optimized, `${base}-${width}w.jpg`))
      ]);
    }
    cache[image.filename] = { mtimeMs: stat.mtimeMs, widths };
    created++;
  }
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  return { created, skipped };
}

async function generateOgImages() {
  const outputDirectory = path.join(root, 'assets', 'og');
  const cacheFile = path.join(root, '.cache', 'og-images.json');
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  fs.mkdirSync(outputDirectory, { recursive: true });
  let created = 0, skipped = 0;
  for (const work of works) {
    const selected = work.images.find(image => image.featured) || work.images[0];
    if (!selected) continue;
    const source = path.join(root, selected.filename);
    const output = path.join(outputDirectory, `${work.slug}.jpg`);
    if (!fs.existsSync(source)) continue;
    const stat = fs.statSync(source);
    const signature = `${selected.filename}:${stat.mtimeMs}:${stat.size}`;
    if (cache[work.slug] === signature && fs.existsSync(output)) { skipped++; continue; }
    const background = await sharp(source).rotate().resize(1200, 630, { fit: 'cover', position: 'centre' }).blur(28).modulate({ brightness: 0.72, saturation: 0.9 }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    const foreground = await sharp(source).rotate().resize(1200, 630, { fit: 'contain', position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    await sharp(background).composite([{ input: foreground, gravity: 'centre' }]).jpeg({ quality: 88, mozjpeg: true }).toFile(output);
    cache[work.slug] = signature;
    created++;
  }
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  return { created, skipped };
}

const staticSocialImages = {
  'index.html': 'assets/media/artist-portrait.png',
  'about.html': 'assets/media/artist-portrait.png',
  'exhibitions.html': 'assets/media/home-image-break.jpg',
  'press.html': 'assets/media/press-side-image-optimized.jpg',
  'series.html': 'assets/media/series-entry.jpg',
  'work.html': 'assets/media/artist-portrait.png'
};
async function updateStaticSocialMeta() {
  for (const [file, imagePath] of Object.entries(staticSocialImages)) {
    const target = path.join(root, file);
    const localImage = path.join(root, imagePath);
    if (!fs.existsSync(target) || !fs.existsSync(localImage)) continue;
    let html = fs.readFileSync(target, 'utf8');
    const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0];
    if (!head) continue;
    const pageTitle = clean(head.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const description = head.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
    const canonical = head.match(/<link rel="canonical" href="([^"]*)">/)?.[1] || `${site}/`;
    const metadata = await sharp(localImage).metadata();
    const image = `${site}/${imagePath}`;
    const social = `<meta property="og:title" content="${esc(pageTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="${metadata.width}"><meta property="og:image:height" content="${metadata.height}"><meta property="og:image:type" content="${metadata.format === 'png' ? 'image/png' : 'image/jpeg'}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="zh_TW"><meta property="og:locale:alternate" content="en_US"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(pageTitle)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}">`;
    const cleaned = head.replace(/<meta property="og:[^"]+"[^>]*>/g, '').replace(/<meta name="twitter:[^"]+"[^>]*>/g, '');
    html = html.replace(head, cleaned.replace('</head>', `${social}</head>`));
    write(target, html);
  }
}

async function generateBrandIcons() {
  const source = path.join(root, 'assets', 'icons', 'pr-black.png');
  if (!fs.existsSync(source)) throw new Error('Missing brand icon source: assets/icons/pr-black.png');
  const render = async (size, { opaque = false } = {}) => {
    const logo = await sharp(source).trim({ background: '#ffffff', threshold: 12 }).resize(Math.round(size * 0.62), Math.round(size * 0.62), { fit: 'contain' }).png().toBuffer();
    const radius = Math.round(size * 0.18);
    const background = Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/></svg>`);
    const canvas = sharp({ create: { width: size, height: size, channels: 4, background: opaque ? '#ffffff' : { r: 255, g: 255, b: 255, alpha: 0 } } }).composite([{ input: background }, { input: logo, gravity: 'centre' }]);
    return opaque ? canvas.flatten({ background: '#ffffff' }).png().toBuffer() : canvas.png().toBuffer();
  };
  const named = [[16, 'favicon-16x16.png'], [32, 'favicon-32x32.png'], [180, 'apple-touch-icon.png'], [192, 'android-chrome-192x192.png'], [512, 'android-chrome-512x512.png']];
  const buffers = await Promise.all(named.map(([size, file]) => render(size, { opaque: file === 'apple-touch-icon.png' })));
  await Promise.all(named.map(([, file], index) => fs.promises.writeFile(path.join(root, file), buffers[index])));
  const icoImages = await Promise.all([16, 32, 48].map(size => render(size)));
  const header = Buffer.alloc(6 + icoImages.length * 16);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoImages.length, 4);
  let offset = header.length;
  icoImages.forEach((image, index) => {
    const entry = 6 + index * 16;
    const size = [16, 32, 48][index];
    header[entry] = size; header[entry + 1] = size; header[entry + 2] = 0; header[entry + 3] = 0;
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8); header.writeUInt32LE(offset, entry + 12); offset += image.length;
  });
  await fs.promises.writeFile(path.join(root, 'favicon.ico'), Buffer.concat([header, ...icoImages]));
  await fs.promises.writeFile(path.join(root, 'site.webmanifest'), JSON.stringify({ name: 'Poren Huang Studio', short_name: 'Poren Huang', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }], theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone' }, null, 2) + '\n');
}

function addBrandIconsToAllPages() {
  const rootPages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
  const workPages = fs.readdirSync(path.join(root, 'works')).filter(file => file.endsWith('.html')).map(file => path.join('works', file));
  [...rootPages, ...workPages].forEach(relative => {
    const target = path.join(root, relative);
    let html = fs.readFileSync(target, 'utf8');
    html = html.replace(/<link rel="icon"[^>]*>|<link rel="apple-touch-icon"[^>]*>|<link rel="manifest"[^>]*>|<meta name="theme-color"[^>]*>/g, '');
    write(target, html.replace('</head>', `${brandIconHead}</head>`));
  });
}

addHreflangToStaticPages();
addBrandIconsToAllPages();
Promise.all([optimizeImages(), generateOgImages(), generateBrandIcons()]).then(async ([images, og]) => {
  await updateStaticSocialMeta();
  console.log(`Built ${works.length} static work pages, ${redirectCount} legacy redirect pages, sitemap and optimized images (${images.created} processed, ${images.skipped} cached; OG ${og.created} created, ${og.skipped} cached).`);
}).catch(error => { console.error(error); process.exitCode = 1; });
