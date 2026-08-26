import json
import os
import re
from pathlib import Path

from bs4 import BeautifulSoup

from normalize_story_html import normalize_content

snapshot_path = Path(os.environ['DEVSNACK_STORY_SNAPSHOT']) if os.environ.get('DEVSNACK_STORY_SNAPSHOT') else None
if snapshot_path and snapshot_path.exists():
    data = json.loads(snapshot_path.read_text(encoding='utf-8'))
    assert len(data['posts']) == 29
    cases = [(post['slug'], post['content'] or '') for post in data['posts']]
else:
    cases = [
        ('sample-legacy', '<!doctype html><html><head><style>p{color:red}</style><meta charset="utf-8"></head><body><div class="blog-container"><h1 style="color:red">Title</h1><p style="font-size:13px">Body</p><table width="600"><tr><td>Data</td></tr></table></div><script>alert(1)</script></body></html>'),
        ('html5-poop-dodge-game', '<html><head><style>.game{}</style></head><body><div class="blog-content"><h1>Game</h1><div id="game-section"><canvas></canvas><script>run()</script></div><h2>How it works</h2><pre><code>const x = 1</code></pre></div></body></html>'),
    ]

for slug, old in cases:
    new = normalize_content(slug, old)
    assert '<!doctype' not in new.lower(), slug
    assert '<head' not in new.lower(), slug
    assert '<meta' not in new.lower(), slug
    assert '<link' not in new.lower(), slug
    assert '<style' not in new.lower(), slug
    assert '<script' not in new.lower(), slug
    assert not re.search(r'\sstyle\s*=', new, re.I), slug
    old_soup = BeautifulSoup(old, 'html.parser')
    new_soup = BeautifulSoup(new, 'html.parser')
    if slug not in {'html5-poop-dodge-game', 'ai-vampire-survivor-like-demo'}:
        for tag in ('table', 'pre', 'img'):
            assert len(new_soup.find_all(tag)) >= len(old_soup.find_all(tag)), (slug, tag)
    else:
        assert '/demos/html' in new

repo_root = Path(__file__).resolve().parents[1]
assert (repo_root / 'public/html5-poop-dodge-game.html').exists()
assert (repo_root / 'public/pixel-survivors-ai-game.html').exists()
print(f'story normalization tests passed: {len(cases)} case(s), semantic HTML preserved, legacy presentation removed')
