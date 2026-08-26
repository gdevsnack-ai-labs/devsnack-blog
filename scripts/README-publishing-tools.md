# Publishing and media helpers

These scripts are operator tools for the DevSnack publishing workflow. They are
not imported by the Next.js runtime and must never contain OAuth tokens,
service-role keys, cookies, or local machine paths.

## Lab benchmark publisher

`publish_lab_benchmark.py` registers a reviewed local benchmark report in the
Supabase Lab feed.

Required environment variables:

```bash
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME
export SUPABASE_ANON_KEY=REPLACE_ME
python scripts/publish_lab_benchmark.py
```

Instead of exporting the keys directly, `DEVSNACK_ENV_FILE` may point to a
local, ignored environment file. Never commit that file.

## Legacy Blogger draft publisher

`legacy/publish_dflash2_draft.py` is retained for historical Blogger DRAFT
workflows. The current canonical production feed uses the Vercel/Supabase
direct publisher instead.

```bash
export BLOGGER_TOKEN_PATH="$HOME/.config/devsnack/blogger-token.json"
export BLOGGER_BLOG_ID="<blogger-blog-id>"
python scripts/legacy/publish_dflash2_draft.py
```

The token file must remain outside the repository. This script creates a
Blogger **DRAFT** and should not be treated as a direct LIVE publishing path.

## Krea/ComfyUI image helper

`media/gen_blog_images.py` creates three DevSnack header images from a local
ComfyUI workflow. Configure local paths at runtime:

```bash
export COMFYUI_URL="http://localhost:8188"
export KREA_WORKFLOW_PATH="/path/to/Krea_simple.json"
export BLOG_IMAGE_OUTPUT_DIR="./public/images/blog"
export COMFYUI_OUTPUT_DIR="/path/to/ComfyUI/output"
python scripts/media/gen_blog_images.py
```

Generated images are local assets; the script does not contain credentials.
