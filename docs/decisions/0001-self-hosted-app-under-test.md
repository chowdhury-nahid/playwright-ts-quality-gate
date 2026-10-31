# 0001: Self-hosted app under test

Status: accepted, 2026-10-31

## Context
A CI gate that can fail honestly needs an app we control. A public demo site changes without notice and goes down,
so a red build there proves nothing about our tests.

## Decision
Run a pinned RealWorld (Conduit) implementation, TonyMckes/conduit-realworld-example-app at commit
5e127d8569b300e0a21dc2c20ea680da4967b1aa (MIT licence), in Docker Compose with Postgres. The pin lives in sut/.env.
A no-Docker mode (in-memory SQLite) exists for machines without Docker.

## Consequences
- We can add a deliberate regression in a pull request and show the red build (phase 3).
- The app uses hash routing, so URLs look like /#/login. Page objects own that detail.
- Upgrading the app is a deliberate change of one line in sut/.env.
- The SQLite mode is for local use only. CI uses Postgres, which is closer to production.
