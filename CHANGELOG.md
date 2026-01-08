# Changelog

All notable changes to Pulso IRC are documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

## [0.1.1] - 2026-01-08

### Added
- TLS CA support for custom certificate authorities.

### Changed
- Nick-change handling now works when the server omits a user/host prefix.
- Refresh closes active sessions so nicks are released.

### Security
- Local crash logging with redaction and rotation.
- Strict Content Security Policy.
- Inline media previews disabled by default.

## [0.1.0] - 2026-01-08

### Added
- Initial production-ready baseline.

### Changed
- Linux-only distribution.
