"""Browser QA for the GitHub Pages demo (not a CMS backend test)."""
from __future__ import annotations
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'
SHOTS=ROOT/'qa-screenshots'
SHOTS.mkdir(exist_ok=True)
errors=[]
results=[]

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(DOCS)))
Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
    for width in [360,390,430,768,1024,1440,1920]:
        page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
        page.on('pageerror',lambda e,w=width: errors.append(f'{w}px: {e}'))
        page.goto(origin+'/',wait_until='networkidle')
        page.locator('#serviceCards .service-card').first.wait_for()
        count=page.locator('#serviceCards .service-card').count()
        overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2')
        results.append((width,'EN',count,overflow))
        if width == 1440: page.screenshot(path=str(SHOTS/'homepage-desktop.png'),full_page=True)
        if width == 390: page.screenshot(path=str(SHOTS/'homepage-mobile.png'),full_page=True)
        page.locator('[data-lang="ar"]').click()
        lang=page.evaluate('document.documentElement.lang')
        rtl=page.evaluate('document.documentElement.dir')
        arabic=page.locator('h1').inner_text()
        overflow_ar=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2')
        if lang!='ar' or rtl!='rtl' or not 'ذكاء' in arabic: errors.append(f'{width}px: AR switch failure: {lang}/{rtl}')
        results.append((width,'AR',count,overflow_ar))
        if width == 390: page.screenshot(path=str(SHOTS/'homepage-mobile-ar.png'),full_page=True)
        page.close()
    page=browser.new_page(viewport={'width':1366,'height':900})
    page.goto(origin+'/projects.html',wait_until='networkidle')
    page.locator('#gallery .gallery-card').first.wait_for()
    initial_count=page.locator('#gallery .gallery-card').count()
    page.locator('[data-filter="quality"]').click()
    filter_count=page.locator('#gallery .gallery-card').count()
    page.locator('#searchProjects').fill('no-match-demo-keyword')
    no_results=page.locator('#emptyGallery').is_visible()
    if (initial_count,filter_count,no_results)!=(3,1,True): errors.append(f'Gallery controls fail: {initial_count} {filter_count} {no_results}')
    page.screenshot(path=str(SHOTS/'projects-desktop.png'),full_page=True)
    page.goto(origin+'/case-study.html?slug=quality-management-hub',wait_until='networkidle')
    case_title=page.locator('#caseTitle').inner_text()
    if 'Quality' not in case_title: errors.append(f'Case study content: {case_title}')
    page.goto(origin+'/admin-demo.html',wait_until='networkidle')
    if not page.locator('.preview-banner').is_visible(): errors.append('Admin preview warning not visible')
    page.locator('[data-pane="projects"]').click()
    if not page.locator('#adminPlaceholder').is_visible(): errors.append('Admin tab interaction failed')
    page.screenshot(path=str(SHOTS/'admin-demo.png'),full_page=True)
    page.close();browser.close()
server.shutdown()
for width, lang, count, overflow in results:
    if count != 3 or overflow: errors.append(f'{width}px {lang}: cards={count},overflow={overflow}')
report=['# Static Preview QA — 2026-11-05','','**Scope:** GitHub Pages `docs/` only; does NOT validate Node/Payload/PostgreSQL.','','| Width | Language | Service cards | Horizontal overflow |','|---:|---|---:|---|']
for width,lang,count,overflow in results: report.append(f'| {width} | {lang} | {count} | {"FAIL" if overflow else "None"} |')
report += ['', '## Interactions','- Filter all / quality, search/no result, case study load, language switch, Admin Preview tabs: tested.','- Desktop and mobile screenshots saved under `qa-screenshots/`.','', '## Errors', *(errors if errors else ['None observed in the tested browser paths.'])]
(ROOT/'STATIC_PREVIEW_QA.md').write_text('\n'.join(report)+'\n')
print(json.dumps({'viewport_checks':len(results),'gallery_count':initial_count,'filter_count':filter_count,'case_title':case_title,'errors':errors},ensure_ascii=False,indent=2))
if errors: raise SystemExit(1)
