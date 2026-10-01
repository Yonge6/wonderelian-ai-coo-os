# NOESIS production release — 2026-10-01

- actor: Codex
- source: User explicitly requested 上线 after approving the verified local preview.
- action: Publish selected crystal frontend through the existing GitHub Pages and bounded ops.wonderelian.com deployment path.
- preflight: 99 tests passed; STATE_OK; static public-data sanitizer passed during local design verification. Existing production index and three snapshot hashes independently read over configured SSH. Unique existing private credential is mode 600; no credentials stored or printed.
- scope: Seven frontend files only; existing analytics JSON must remain byte-identical. Local unrelated files preserved. No provider sync, production product-repo change, new scheduler, DNS change or server cleanup.
- risk: Shared server has about 119 MB free; use small delta with existing-file backup instead of full site duplication. Deployment aborts below 30 MB free.
- status: release_prepared; public verification pending.
