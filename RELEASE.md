# Release Checklist

1. Run tests and lint:
   - `npm --prefix renderer run lint`
   - `node --test`
2. Run dependency audits:
   - `npm audit --audit-level=high`
   - `npm audit --audit-level=high --prefix renderer`
3. Build the app:
   - `npm run build`
4. Verify Linux-only targets:
   - `node scripts/verify-linux-only.js`
5. Update `CHANGELOG.md` and bump version in `package.json`.
6. Commit and tag the release.
