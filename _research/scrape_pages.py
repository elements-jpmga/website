"""Scrape every page of elements.com.sg into ordered content blocks so the redesign keeps the same information.
Output: _research/pages/<slug>.json  {url, path, title, description, blocks:[...]}  and images into src/assets/img/pages/.
"""
import json, re, os, sys, hashlib, urllib.request, urllib.parse, io
from bs4 import BeautifulSoup, NavigableString, Tag
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '_research', 'pages'); os.makedirs(OUT, exist_ok=True)
IMG_DIR = os.path.join(ROOT, 'src', 'assets', 'img', 'pages'); os.makedirs(IMG_DIR, exist_ok=True)
SITE = 'https://elements.com.sg'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh) ElementsRevamp/1.0'}
SKIP = {'/', '/home/', '/cart/', '/checkout/', '/my-account/', '/thank-you/', '/massage-thank-you-page/'}

def fetch(url):
    url = urllib.parse.quote(url, safe=':/?=&%#')
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def norm_path(url):
    p = re.sub(r'^https?://[^/]+', '', url).split('#')[0].split('?')[0]
    return p if p.endswith('/') else p + '/'

def local_img(src):
    """Download an image once, resize, return local web path."""
    if not src or src.startswith('data:'): return None
    src = re.sub(r'-\d+x\d+(?=\.\w+$)', '', src)  # prefer the original size
    if src.startswith('//'): src = 'https:' + src
    if src.startswith('/'): src = SITE + src
    h = hashlib.md5(src.encode()).hexdigest()[:12]
    base = re.sub(r'[^a-z0-9]+', '-', os.path.basename(src).rsplit('.', 1)[0].lower())[:40].strip('-')
    name = f'{base}-{h}.jpg'
    dest = os.path.join(IMG_DIR, name)
    if not os.path.exists(dest):
        try:
            data = fetch(src)
            im = Image.open(io.BytesIO(data))
            if im.mode in ('RGBA', 'LA', 'P'):
                bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im.convert('RGBA'), mask=im.convert('RGBA').split()[-1]); im = bg
            else: im = im.convert('RGB')
            im.thumbnail((1600, 1600)); im.save(dest, quality=82, optimize=True, progressive=True)
        except Exception as e:
            print('   img fail', src, e); return None
    return '/assets/img/pages/' + name

def clean_html(el):
    """Keep only simple inline/structural markup from a text-editor widget."""
    for t in el.find_all(['script', 'style', 'noscript', 'iframe', 'form', 'input', 'button', 'svg']): t.decompose()
    for img in el.find_all('img'):
        src = img.get('data-src') or img.get('src')
        loc = local_img(src)
        if loc: img.attrs = {'src': loc, 'alt': img.get('alt', ''), 'loading': 'lazy'}
        else: img.decompose()
    for a in el.find_all('a'):
        href = a.get('href', '')
        a.attrs = {'href': re.sub(r'^https?://(www\.)?elements\.com\.sg', '', href) or '#'}
    allowed = {'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'blockquote', 'span', 'sup', 'sub'}
    for t in list(el.find_all(True)):
        if t.name not in allowed: t.unwrap()
        else:
            keep = {k: v for k, v in t.attrs.items() if k in ('href', 'src', 'alt', 'loading')}
            t.attrs = keep
    html = ''.join(str(c) for c in el.contents)
    html = re.sub(r'<span>(.*?)</span>', r'\1', html, flags=re.S)
    html = re.sub(r'<p>\s*(&nbsp;|\s)*</p>', '', html)
    html = re.sub(r'\s+', ' ', html).strip()
    return html

def text(el): return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)).strip()

def widget_type(w):
    for c in w.get('class', []):
        if c.startswith('elementor-widget-') and c not in ('elementor-widget', 'elementor-widget-container', 'elementor-widget-wrap'):
            return c.replace('elementor-widget-', '')
    return 'unknown'

def parse_widget(w, blocks):
    t = widget_type(w)
    if t in ('spacer', 'divider', 'divider--view-line', 'menu-anchor', 'wrap', 'sidebar', 'global', 'share-buttons', 'social-icons', 'facebook-button', 'breadcrumbs'): return
    if t == 'heading':
        h = w.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span'], class_=re.compile('elementor-heading-title'))
        if h and text(h): blocks.append({'t': 'heading', 'level': int(h.name[1]) if h.name[0] == 'h' else 3, 'text': text(h), 'html': clean_html(h)})
    elif t == 'text-editor':
        c = w.find(class_='elementor-widget-container') or w
        html = clean_html(c)
        if re.sub(r'<[^>]+>', '', html).strip(): blocks.append({'t': 'html', 'html': html})
    elif t in ('image', 'theme-post-featured-image'):
        img = w.find('img')
        if img:
            loc = local_img(img.get('data-src') or img.get('src'))
            cap = w.find('figcaption')
            if loc: blocks.append({'t': 'image', 'src': loc, 'alt': img.get('alt', ''), 'caption': text(cap) if cap else ''})
    elif t == 'button':
        a = w.find('a')
        if a and text(a): blocks.append({'t': 'button', 'text': text(a), 'href': re.sub(r'^https?://(www\.)?elements\.com\.sg', '', a.get('href', '#')) or '#'})
    elif t == 'icon-list':
        items = [text(li) for li in w.find_all('li') if text(li)]
        if items: blocks.append({'t': 'list', 'items': items})
    elif t in ('toggle', 'accordion', 'n-accordion'):
        items = []
        titles = w.find_all(class_=re.compile('(elementor-tab-title|e-n-accordion-item-title)'))
        contents = w.find_all(class_=re.compile('(elementor-tab-content|e-n-accordion-item-content|elementor-toggle-content)'))
        if not titles:
            for d in w.find_all('details'):
                s = d.find('summary'); titles.append(s); body = BeautifulSoup('<div></div>', 'lxml').div
                for c in d.contents:
                    if c is not s: body.append(c.extract() if isinstance(c, Tag) else NavigableString(str(c)))
                contents.append(body)
        for ti, ci in zip(titles, contents):
            q = text(ti); a = clean_html(ci)
            if q: items.append({'q': q, 'a': a})
        if items: blocks.append({'t': 'faq', 'items': items})
    elif t in ('image-box', 'icon-box', 'call-to-action', 'flip-box'):
        img = w.find('img'); loc = local_img(img.get('data-src') or img.get('src')) if img else None
        title = w.find(class_=re.compile('(image-box-title|icon-box-title|cta__title|flip-box__layout-title|elementor-cta__title)'))
        desc = w.find(class_=re.compile('(image-box-description|icon-box-description|cta__description|flip-box__layout-description|elementor-cta__description)'))
        a = w.find('a', href=True)
        blocks.append({'t': 'card', 'img': loc, 'title': text(title) if title else '', 'html': clean_html(desc) if desc else '', 'href': (re.sub(r'^https?://(www\.)?elements\.com\.sg', '', a['href']) if a else '')})
    elif t == 'testimonial':
        c = w.find(class_='elementor-testimonial-content'); n = w.find(class_='elementor-testimonial-name')
        if c: blocks.append({'t': 'quote', 'text': text(c), 'who': text(n) if n else ''})
    elif t in ('blockquote',):
        blocks.append({'t': 'quote', 'text': text(w), 'who': ''})
    elif t in ('image-carousel', 'gallery', 'image-gallery', 'media-carousel'):
        imgs = []
        for img in w.find_all('img'):
            loc = local_img(img.get('data-src') or img.get('src'))
            if loc: imgs.append({'src': loc, 'alt': img.get('alt', '')})
        if imgs: blocks.append({'t': 'gallery', 'images': imgs})
    elif t == 'video':
        a = w.find(class_='elementor-video') or w.find('iframe')
        src = (w.get('data-settings') or '')
        m = re.search(r'"youtube_url":"([^"]+)"', src)
        blocks.append({'t': 'video', 'url': (m.group(1).replace('\\/', '/') if m else (a.get('src') if a else ''))})
    elif t == 'google_maps':
        f = w.find('iframe'); blocks.append({'t': 'map', 'src': f.get('src', '') if f else ''})
    elif t in ('shortcode', 'html', 'wpforms', 'form', 'contact-form-7'):
        # forms and embeds: keep any readable text, flag the form for rebuild
        txt = clean_html(w)
        if w.find('form') or 'wpforms' in t or 'form' in t: blocks.append({'t': 'form', 'note': text(w)[:200]})
        elif re.sub(r'<[^>]+>', '', txt).strip(): blocks.append({'t': 'html', 'html': txt})
    elif t in ('counter',):
        n = w.find(class_='elementor-counter-number'); tt = w.find(class_='elementor-counter-title')
        blocks.append({'t': 'stat', 'value': (n.get('data-to-value') or text(n)) if n else '', 'label': text(tt) if tt else ''})
    elif t in ('price-list', 'price-table'):
        blocks.append({'t': 'html', 'html': clean_html(w)})
    elif t in ('tabs', 'n-tabs'):
        titles = [text(x) for x in w.find_all(class_=re.compile('(elementor-tab-title|e-n-tab-title)')) if text(x)]
        contents = [clean_html(x) for x in w.find_all(class_=re.compile('(elementor-tab-content|e-n-tab-content)'))]
        items = [{'q': q, 'a': a} for q, a in zip(titles[:len(contents)], contents) if q]
        if items: blocks.append({'t': 'faq', 'items': items})
    elif t in ('theme-post-content', 'post-content'):
        html = clean_html(w)
        if re.sub(r'<[^>]+>', '', html).strip(): blocks.append({'t': 'html', 'html': html})
    else:
        html = clean_html(w)
        if re.sub(r'<[^>]+>', '', html).strip(): blocks.append({'t': 'html', 'html': html, 'widget': t})

def walk(container, blocks):
    """Depth-first over Elementor sections; widgets are leaves. Non-Elementor content falls back to raw HTML."""
    for child in container.children:
        if not isinstance(child, Tag): continue
        cls = child.get('class', [])
        if 'elementor-widget' in cls: parse_widget(child, blocks); continue
        if child.name in ('script', 'style', 'noscript'): continue
        walk(child, blocks)

def scrape(url):
    path = norm_path(url)
    html = fetch(url).decode('utf-8', 'ignore')
    soup = BeautifulSoup(html, 'lxml')
    title = soup.find('meta', property='og:title'); title = title['content'] if title else (soup.title.string if soup.title else '')
    title = re.sub(r'\s*[-|–]\s*Elements Wellness.*$', '', title or '').strip()
    desc = soup.find('meta', attrs={'name': 'description'}); desc = desc['content'] if desc else ''
    for sel in ['header', 'footer', '.elementor-location-header', '.elementor-location-footer', '#site-header', '#footer', '.site-header', '.site-footer', '#cookie-law-info-bar', '.cli-modal', '.elementor-location-popup', '#wpforms-conversational-form-page', 'nav']:
        for t in soup.select(sel): t.decompose()
    for t in soup.find_all(attrs={'data-elementor-type': re.compile('header|footer|popup')}): t.decompose()
    main = soup.find(attrs={'data-elementor-type': re.compile('wp-page|wp-post|e-landing-page|single')}) or soup.find('main') or soup.find(id='content') or soup.body
    blocks = []
    walk(main, blocks)
    if not blocks:  # classic editor page
        ec = soup.find(class_=re.compile('entry-content')) or main
        blocks.append({'t': 'html', 'html': clean_html(ec)})
    # collapse duplicate consecutive blocks (Elementor often renders desktop + mobile copies)
    out = []
    for b in blocks:
        if out and json.dumps(out[-1], sort_keys=True) == json.dumps(b, sort_keys=True): continue
        out.append(b)
    return {'url': url, 'path': path, 'title': title, 'description': desc, 'blocks': out}

if __name__ == '__main__':
    urls = [l.strip() for l in open(os.path.join(ROOT, '_research', 'sitemap-all.txt')) if l.strip()]
    only = sys.argv[1:]
    index = {}
    for u in urls:
        p = norm_path(u)
        if p in SKIP or re.match(r'^/20\d\d/', p): continue
        if only and not any(o in p for o in only): continue
        try:
            d = scrape(u)
        except Exception as e:
            print('FAIL', p, e); continue
        slug = p.strip('/').replace('/', '__') or 'home'
        json.dump(d, open(os.path.join(OUT, slug + '.json'), 'w'), ensure_ascii=False, indent=1)
        index[p] = {'title': d['title'], 'blocks': len(d['blocks']), 'file': slug + '.json'}
        print(f'{p:60} {len(d["blocks"]):3} blocks  {d["title"][:50]}')
    if not only: json.dump(index, open(os.path.join(OUT, '_index.json'), 'w'), indent=1)
