from pathlib import Path
from html.parser import HTMLParser
import json,re, subprocess
root=Path(__file__).resolve().parents[1]
errs=[]
class HtmlCheck(HTMLParser):
 def __init__(self): super().__init__();self.refs=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t in ('script','link','a'):
   ref=a.get('src') or a.get('href')
   if ref and not ref.startswith(('http:','https:','mailto:','#','tel:')): self.refs.append(ref.split('#')[0].split('?')[0])
for page in (root/'docs').glob('*.html'):
 p=HtmlCheck();p.feed(page.read_text())
 for ref in p.refs:
  if ref and not (page.parent/ref).exists(): errs.append(f'{page.name} broken static asset/link: {ref}')
 if '<main' not in page.read_text():errs.append(f'{page.name} missing main')
 if 'viewport' not in page.read_text():errs.append(f'{page.name} missing viewport')
json_data=json.loads((root/'content/demo-content.json').read_text())
preview_data=json.loads((root/'docs/data/content.json').read_text())
if json_data!=preview_data:errs.append('Preview content.json differs from source')
for page in ('index.html','projects.html','case-study.html','admin-demo.html'):
 if not (root/'docs'/page).exists():errs.append(f'{page} missing')
for path in ('src/collections/Projects.ts','src/collections/Users.ts','src/collections/PrivateMedia.ts','src/collections/Services.ts','src/app/(payload)/layout.tsx','payload.config.ts','.github/workflows/pages.yml'):
 if not (root/path).exists():errs.append(f'{path} missing')
code=(root/'src/collections/Projects.ts').read_text()
access=(root/'src/lib/access.ts').read_text() if (root/'src/lib/access.ts').exists() else ''
for token in ('visibility','privateGallery'):
 if token not in code:errs.append(f'Project config missing {token}')
if "'published'" not in code+access:errs.append("Public read rule missing 'published' status constraint")
for path in (root/'docs').rglob('*.html'):
 if re.search('example[.]invalid|API_KEY|PAYLOAD_SECRET',path.read_text()):errs.append(f'Forbidden placeholder/secret in {path.name}')
result=subprocess.run(['node','--check',str(root/'docs/assets/app.js')],capture_output=True,text=True)
if result.returncode:errs.append('JS parse: '+result.stderr)
result2=subprocess.run(['node',str(root/'scripts/validate-content.mjs')],capture_output=True,text=True)
if result2.returncode:errs.append('content check: '+result2.stderr)
report=['# Scaffold Verification (no browser/network required)','','Generated: 2026-11-05','','## Checks','- HTML parsed: all four pages','- Relative file links and static assets checked','- Canonical JSON data matches published preview JSON','- Node JavaScript parse passes','- Content schema checks pass','- Required Next + Payload source files present','- Public demo content has no known placeholder email/secrets','', '## Outcome', 'PASS' if not errs else 'FAIL', '', '## Findings', *(errs if errs else ['No errors in tested static checks.']), '', '## Not covered', '- Browser QA of the static preview: run `pnpm test:e2e` (Playwright) or `python scripts/qa_preview.py`.','- Next.js + Payload runtime, migrations and security tests: run `pnpm build && pnpm test:int` (see PHASE_1_2_REPORT.md).','- This script never pushes to GitHub or deploys Pages.']
(root/'STATIC_CHECKS.md').write_text('\n'.join(report)+'\n')
print('\n'.join(report))
if errs:raise SystemExit(1)
