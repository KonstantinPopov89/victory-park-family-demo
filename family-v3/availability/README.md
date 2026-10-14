# Availability prototype integration

Guest, duty administrator and scenario screens live at `../availability.html`, `../availability-admin.html` and `../availability-demo.html`. The real attraction catalog at `../attractions.html?mode=real#catalog` uses the same status model through `catalog.js`. It updates badges without rerendering the family picker, so selection, expanded conditions and focus survive status changes.

All screens share the validated localStorage key `victory-availability-pages-v1`. A catalog-first visit initializes the same frozen presentation seed as the guest screen. Saved states remain compatible. Manual updates, data failures, expiry, park closure and reset synchronize between tabs on the same origin in one browser. Time is frozen initially; the scenario panel can resume it or advance it explicitly. Family and order keys remain separate.

All 11 real attraction IDs, catalog routes and existing photo paths are mapped in `Availability.RIDES`. Guest and administrator lists show the same real photographs as the catalog. Images load lazily, have fixed dimensions and descriptive alt text, and show a text fallback if unavailable. Fictional family-selection examples keep their separate illustrations and do not inherit real attraction statuses.

Events, operating statuses, schedules, thresholds and weather are fictional. There are no API calls, credentials, equipment controls or operational status publication. The CSP prohibits connections. Photos and catalog names identify the real attractions but do not prove current operation.

Run `node --test tests/model.test.cjs` from this directory. The suite has 41 tests: 35 status rules, 3 presentation clock cases, and 3 shared seed/catalog mapping/backward compatibility cases. Browser integration is verified separately for cross-tab synchronization, all 11 statuses/photos, failed storage, responsive layout and preservation of the existing family flow.
