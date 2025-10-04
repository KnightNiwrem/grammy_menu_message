````instructions
# Copilot Instructions for grammy_menu_message Plugin Library

This document provides guidelines for GitHub Copilot when suggesting code for this project.

## Project Architecture

- This is a [Deno](https://deno.land/) project
- This is a **plugin library** for [grammy](https://grammy.dev) Telegram bot framework
- This project is **NOT dockerized** (it's a library, not a deployable application)

## Constitution Compliance

All code suggestions must comply with `.specify/memory/constitution.md`. Key principles:

### Code Quality (Principle I)
- **Type Safety**: Strict TypeScript with explicit types; no implicit `any`
- **Self-Contained**: No external runtime dependencies beyond grammy core and Deno standard library
- **Modular Design**: Single responsibility per module
- **Documentation**: JSDoc comments required for all exported APIs

### Test-First Development (Principle II - NON-NEGOTIABLE)
- **TDD Mandatory**: Tests written first, fail initially, then pass after implementation
- **Coverage**: ≥90% for public APIs, 100% for critical paths (menu rendering, message handling)
- **Test Organization**: Use `describe` and `it` from `jsr:@std/testing/bdd`
- **Independence**: Tests runnable in isolation

### API Consistency (Principle III)
- **Naming**: TypeScript conventions (camelCase for functions/variables, PascalCase for classes/types)
- **Error Handling**: Typed, documented errors with actionable messages
- **Versioning**: Semantic versioning strictly followed
- **Examples**: Working examples for every feature

### Performance (Principle IV)
- **Benchmarking**: Benchmark tests for critical paths
- **Async Operations**: No blocking I/O
- **Memory Efficiency**: Test for memory leaks in long-running scenarios
- **Rate Limiting**: Respect Telegram API limits

## Database Guidelines

### PostgreSQL

**NOT APPLICABLE** - This is a plugin library, not a bot application. Do not suggest database code.

If a user explicitly requests database examples for their bot (not the plugin itself):
- Docker-compose should use PostgreSQL v17 image
- Use the following packages for database interactions:
  - `npm:kysely` for query building
  - `npm:pg` for PostgreSQL client

### Redis

**NOT APPLICABLE** - This is a plugin library, not a bot application. Do not suggest Redis code.

If a user explicitly requests Redis examples for their bot (not the plugin itself):
- Docker-compose should use Redis v8 image
- Use the following packages for Redis interactions:
  - `npm:bullmq` for job queue management
  - `npm:ioredis` for Redis client

## Telegram Bot Development

This project creates plugins for grammy bots:

- Use `grammy` and related plugins imported from `lib.deno.dev`
- The lib.deno.dev import URL structure mirrors that of deno.land/x
- For example, if the deno.land import URL is https://deno.land/x/grammy@v1.36.3/mod.ts, then the lib.deno.dev version would be https://lib.deno.dev/x/grammy@v1/mod.ts
- Note that lib.deno.dev respects semantic versioning, so using `@v1` will automatically use the latest 1.x.x version
- **Important**: Do NOT use grammy sessions in plugin code

Example import:

```typescript
import { Bot } from "https://lib.deno.dev/x/grammy/mod.ts";
```

## Deno Standard Libraries

For Deno standard libraries:

- Use the "jsr:" prefix for importing standard libraries
- This is the recommended way to import Deno standard libraries in new projects

Example import:

```typescript
import * as assert from "jsr:@std/assert";
```

## Testing Guidelines

When developing features for this project:

- Features MUST be written test-first (TDD - Red-Green-Refactor)
- Use testing functions `describe` and `it` from "jsr:@std/testing/bdd"
- Each test MUST be independent and runnable in isolation
- Target ≥90% code coverage for public APIs

Example test structure:

```typescript
import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";

describe("Feature Name", () => {
  it("should do something specific", () => {
    // Test implementation
    expect(result).toBe(expected);
  });

  it("should handle edge cases", () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## Code Quality Standards

### Formatting & Linting
- Use `deno fmt` with default settings
- Use `deno lint` with no warnings allowed
- Maximum function length: 50 lines (exceptions require justification)
- Maximum file length: 500 lines (split into modules if exceeded)

### Import Conventions
- grammy: Import from `lib.deno.dev` with semantic versioning (e.g., `@v1`)
- Deno std: Import from `jsr:@std/*`
- NO external npm dependencies unless absolutely necessary and justified
- All imports MUST be explicit (no `*` imports)

### Documentation
- JSDoc comments required for all exported functions, classes, and types
- Include purpose, parameters, return values, and usage examples
- Update README.md when adding new public APIs
- Create working examples in `examples/` directory

## Sandbox Environment Certificate Handling

When running in GitHub Copilot's sandbox environment, you may encounter certificate errors due to MITM (Man-in-the-Middle) proxy certificates. To handle this when running Deno commands that need to pull imports:

- Use the `--unsafely-ignore-certificate-errors` flag with Deno commands
- This flag should only be used in sandbox environments where MITM proxy certificates are expected
- Apply this flag to commands like `deno run`, `deno test`, `deno check`, etc. when they need to fetch remote modules

Example usage:

```bash
deno run --unsafely-ignore-certificate-errors main.ts
deno test --unsafely-ignore-certificate-errors
deno check --unsafely-ignore-certificate-errors src/
```

**Note**: This flag should only be used in trusted sandbox environments and never in production code.

## Quality Gates (Pre-commit Checklist)

Before suggesting code is ready for commit:
- [ ] All tests pass: `deno test --unsafely-ignore-certificate-errors`
- [ ] Code coverage ≥90% for changed files
- [ ] Linting passes: `deno lint`
- [ ] Formatting applied: `deno fmt --check`
- [ ] Type checking passes: `deno check`
- [ ] JSDoc documentation complete
- [ ] Examples validated and working
````
