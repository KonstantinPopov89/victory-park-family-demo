# Availability prototype integration

The three site routes are `../availability.html`, `../availability-admin.html`, and `../availability-demo.html`. They share the family-v3 header, footer, assets and navigation. The state model and 35 model tests were carried from the approved debit-recency prototype. The model uses the isolated localStorage key `victory-availability-pages-v1` and adds a presentation clock. Pure model seeds run by default; UI seeds and resets freeze simulated time to preserve all four statuses during a presentation. The demo page can resume or freeze time without a time jump. Explicit advance scenarios still expire statuses.

All events, schedules, thresholds and weather are fictional. There are no API calls, credentials, real status publication, or equipment controls. The CSP prohibits connections. Changes stay in the current browser and synchronize between tabs on the same origin. `family-v3` purchase state uses its existing, separate key.

Guest ride links were matched by exact Russian name against the 11 real catalog objects in `family-v3/model.js`. The real catalog remains authoritative for the card route, not for current operating status. Navigation in existing family-v3 pages links to this page and preserves the offers integration. Prior release packages remain unchanged.

Run the preserved model tests with `node --test tests/model.test.cjs` from this directory. The interface adaptation changes frame/navigation, guest catalog links, public demo explanation, and the clearly marked presentation clock. Three additional clock tests accompany the 35 preserved status-model tests. Research files and local evidence are not included.
