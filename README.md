# Catalog v2 public verification

This branch contains public-only verification code and hashes. It does not deploy a site. GitHub Pages remains configured to the existing publication branch. Do not merge this branch into the publication branch.

Prepared inputs include the sealed 53-file old baseline, the 59-file new public allowlist, the independent acceptance script and responsive screenshot collection. Preflight must fail if any input is absent. No claim of passing site QA follows from these prepared files; the live workflow must run after publication.

The workflow runs on push to `codex/catalog-v2-verification`. Manual dispatch is also declared, but its availability can depend on the workflow existing on the repository default branch; push to the dedicated branch is the reliable first trigger. Contents permission is read-only. No GitHub Pages deployment permission or action is present.

Files in the manifests are fetched from the old root and `/catalog-v2/`. SHA256 equality is required for all 53 old files and every new allowlisted file before and after browser checks. Verified new bytes are saved into the run artifact's `public-site/` directory and used by the independent static checks. An HTTP error or mismatch is a failure, not a warning. This proves listed public bytes, not every possible URL or user-browser state.

Performance uses Lighthouse 13.5.0, simulated mobile and CPU 4, with default Lighthouse network parameters, in 15 independent Chrome invocations. Three rounds cover old attractions and the four new pages. Median-of-three LCP <= 2500 ms and CLS <= 0.1 are required for every new page. Every raw run, warning and outlier is retained. The old page is a same-job comparison; its performance is not a new-version acceptance gate. Missing or invalid old measurements still fail comparability.

After complete preparation, the release owner should inspect the exact staged allowlist, commit only `.github/workflows/catalog-v2-verification.yml`, `README.md` and `checks/*` source/manifests, then push this one named branch to the verified origin. Do not stage screenshots, private work documents, result logs, local absolute paths, credentials or `node_modules`.

Recommended commands, after final inputs have been reviewed:

```
node checks/preflight.mjs
git diff --check
git status --short
git add .github/workflows/catalog-v2-verification.yml README.md checks/*.mjs checks/*.cjs checks/*-sha256.json .gitignore
git diff --cached --stat
git diff --cached
git commit -m "Verify separate public catalog prototype"
git push origin HEAD:refs/heads/codex/catalog-v2-verification
gh run list --repo KonstantinPopov89/victory-park-family-demo --branch codex/catalog-v2-verification --limit 5
```

Run evidence is uploaded as `catalog-v2-public-verification` for 14 days, including failures. Inspect the completed job and downloaded artifacts; a started run or successful tool installation is not completion.

This verification revision repeats browser/readback checks only on unchanged published site commit 6aad97b327f2cc57843e7fcdb690c37d056f8eba. Run 38451616380 passed performance and rendering, but recorded one HTTP 503 for home.js during browser scenarios. That failure remains evidence. VP_QA_FUNCTIONAL_ONLY=1 skips redundant performance measurements for this bounded recheck; no browser assertion, HTTP error criterion or performance threshold is relaxed. Combine its performance report only with the matching 59-file SHA manifest.
