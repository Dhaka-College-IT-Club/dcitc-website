# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-11-01

### Changed

- **BREAKING**: The public API is now served under `/api/v2`. All endpoints and first-party callers moved from `/api/v1`; there is no redirect from the old prefix.
- Google OAuth callback, the Render health check, and the frontend API rewrite now target the v2 prefix.
- The backend manifest version is now `2.0.0`, matching the frontend.

### Added

- Root changelog and a version badge with a "What's new in 2.0" summary in the README.
- A single release version constant surfaced in the footer bottom bar and as a read-only row on the admin settings page.

### Removed

- Nothing. No data, cookie, or storage change is part of this release.

## [1.0.0] - 2026-11-01

Pre-relaunch baseline: public site, email/Google authentication, member dashboard, and admin content console on the `/api/v1` API.
