# Domain services

This directory will contain deterministic campus business aggregation, for
example timetable normalization and graduation-credit calculation.

Do not place MCP transport handling, authentication verification, or raw OpenAPI
request code here. Those concerns belong to `transport/` and `integration/`.
