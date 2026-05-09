# Petri Bloom System Architecture

## Layer 1 — Product Layer (User Facing)

This layer handles all user interactions:

- Give a Blessing
- Request Help
- Sponsorship creation
- Help applications

Purpose:
Capture human intent in the simplest possible way.

---

## Layer 2 — Intelligence Layer (Petri Bloom Engine)

This is the matching brain of the system.

It processes:

- location similarity
- category overlap
- budget compatibility
- intent strength

Outputs:

- `auto_match` (strong alignment)
- `pending_review` (possible match)
- `none` (no match)

Purpose:
Convert human intent into structured meaningful connections.

---

## Layer 3 — System & Insight Layer

This layer handles:

- match storage (`petri_matches`)
- intent storage (`petri_tokens`)
- analytics and learning
- future optimization signals

Purpose:
Improve match quality over time and provide system intelligence.
