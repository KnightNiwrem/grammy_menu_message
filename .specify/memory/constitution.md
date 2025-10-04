<!--
Sync Impact Report:
Version: 1.0.0 (Initial Constitution)
Modified Principles: N/A (Initial creation)
Added Sections:
  - Core Principles (Code Quality, Test-First Development, API Consistency, Performance Standards)
  - Quality Standards
  - Development Workflow
  - Governance
Removed Sections: N/A
Templates Status:
  ✅ plan-template.md - Constitution Check section will reference these principles
  ✅ spec-template.md - Requirements will align with quality and testing standards
  ✅ tasks-template.md - Task categories aligned with TDD and quality gates
Follow-up TODOs: None
-->

# grammy_menu_message Plugin Library Constitution

## Core Principles

### I. Code Quality First
All code MUST meet the following non-negotiable standards:
- **Type Safety**: Strict TypeScript with no implicit `any` types; all public APIs MUST have explicit type annotations
- **Self-Contained**: Plugin MUST NOT introduce external runtime dependencies beyond grammy core and Deno standard library
- **Modular Design**: Clear separation of concerns; each module has a single, well-defined purpose
- **Documentation**: Every exported function, class, and type MUST have JSDoc comments explaining purpose, parameters, return values, and usage examples

**Rationale**: As a plugin library, users depend on our code quality. Poor typing leads to runtime errors; external dependencies create version conflicts; unclear documentation wastes developer time.

### II. Test-First Development (NON-NEGOTIABLE)
Test-Driven Development is mandatory for all features:
- **Red-Green-Refactor Cycle**: Tests MUST be written first, fail initially, then pass after implementation
- **Test Coverage**: Minimum 90% code coverage for all public APIs; 100% for critical paths (menu rendering, message handling)
- **Test Organization**: Use `describe` and `it` from `jsr:@std/testing/bdd` for all tests; group related tests logically
- **Test Independence**: Each test MUST be runnable in isolation; no shared state between tests

**Rationale**: Plugin APIs are consumed by external developers. Bugs in production waste many developers' time. TDD catches issues before they reach users and serves as living documentation.

### III. API Consistency & User Experience
User-facing APIs MUST provide predictable, intuitive experiences:
- **Naming Conventions**: Use clear, descriptive names following TypeScript conventions (camelCase for functions/variables, PascalCase for classes/types)
- **Error Handling**: All errors MUST be typed and documented; provide actionable error messages with context
- **Backward Compatibility**: Follow semantic versioning strictly; MAJOR bump for breaking changes, MINOR for new features, PATCH for bug fixes
- **Examples First**: Every feature MUST include working examples in documentation showing common use cases

**Rationale**: Inconsistent APIs frustrate users and increase support burden. Well-documented, stable APIs build trust and adoption.

### IV. Performance Standards
Performance MUST be measured and maintained:
- **Benchmarking**: Performance-critical paths (menu rendering, message updates) MUST have benchmark tests
- **No Blocking Operations**: All I/O operations MUST be async; no synchronous file or network operations
- **Memory Efficiency**: Plugins MUST NOT leak memory; test for memory leaks in long-running scenarios
- **Telegram API Limits**: MUST respect Telegram rate limits; implement automatic throttling/queuing where needed

**Rationale**: Poor performance degrades bot user experience. Blocking operations can freeze entire bots. Memory leaks cause production crashes.

## Quality Standards

### Code Style
- Use Deno's built-in formatter (`deno fmt`) with default settings
- Use Deno's built-in linter (`deno lint`) with no warnings allowed
- Maximum function length: 50 lines (exceptions require justification in code review)
- Maximum file length: 500 lines (split into multiple modules if exceeded)

### Import Conventions
- grammy core and plugins: Import from `lib.deno.dev` with semantic versioning (e.g., `@v1`)
- Deno standard libraries: Import from `jsr:@std/*`
- NO external npm dependencies unless absolutely necessary and justified
- All imports MUST be explicit; no `*` imports

### Security
- NO credential storage or sensitive data logging
- All user input MUST be validated and sanitized
- Security vulnerabilities MUST be addressed within 48 hours of discovery

## Development Workflow

### Feature Development
1. **Specification**: Write feature spec using `.specify/templates/spec-template.md`
2. **Planning**: Create implementation plan using `.specify/templates/plan-template.md`
3. **Test Design**: Write comprehensive test cases that fail (Red phase)
4. **Implementation**: Write minimal code to pass tests (Green phase)
5. **Refactoring**: Improve code quality while maintaining passing tests (Refactor phase)
6. **Documentation**: Update README, API docs, and add usage examples
7. **Review**: All code changes require review against this constitution

### Testing Gates
Before any PR can be merged:
- [ ] All tests pass: `deno test --unsafely-ignore-certificate-errors`
- [ ] Code coverage ≥90% for changed files
- [ ] Linting passes: `deno lint`
- [ ] Formatting applied: `deno fmt --check`
- [ ] Type checking passes: `deno check`
- [ ] Documentation updated
- [ ] Examples validated

### Review Process
All code reviews MUST verify:
- Constitution compliance (all principles followed)
- Test coverage meets standards
- APIs are intuitive and well-documented
- No performance regressions
- Security considerations addressed

## Governance

This constitution supersedes all other development practices and guidelines.

### Amendment Process
1. Amendments MUST be proposed with clear rationale and impact analysis
2. Amendments require approval from project maintainers
3. Breaking amendments require migration plan and user communication
4. Version bumps follow semantic versioning:
   - **MAJOR**: Backward-incompatible principle changes or removals
   - **MINOR**: New principles added or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic improvements

### Compliance
- All PRs and reviews MUST verify compliance with this constitution
- Exceptions MUST be documented and justified in PR descriptions
- Technical debt introduced MUST have remediation plan and timeline
- Use `.github/copilot-instructions.md` for AI coding assistant guidance

### Constitution Review
This constitution MUST be reviewed and updated:
- When new patterns emerge from project experience
- When principles conflict with practical needs
- Annually to ensure continued relevance
- After any major version release

**Version**: 1.0.0 | **Ratified**: 2025-10-03 | **Last Amended**: 2025-10-03