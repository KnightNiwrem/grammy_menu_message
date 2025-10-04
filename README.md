# grammy_menu_message

A plugin library for [grammy](https://grammy.dev) Telegram bot framework.

## Development

This project follows strict development principles defined in `.specify/memory/constitution.md`:

- **Test-First Development (TDD)**: All features written with tests first (Red-Green-Refactor)
- **Type Safety**: Strict TypeScript with no implicit `any` types
- **Code Quality**: ≥90% test coverage, strict linting and formatting
- **Performance**: Benchmarked critical paths, async-first, memory efficient

### Prerequisites

- [Deno](https://deno.land/) (latest stable version)

### Testing

```bash
# Run all tests
deno test --unsafely-ignore-certificate-errors

# Run tests with coverage
deno test --coverage --unsafely-ignore-certificate-errors

# Run linting
deno lint

# Run formatting check
deno fmt --check

# Type checking
deno check src/
```

### Project Structure

```
src/           # Source code
tests/         # Test files
benchmarks/    # Performance benchmarks
examples/      # Usage examples
.specify/      # Project specifications and templates
```

## Contributing

All contributions must follow the project constitution at `.specify/memory/constitution.md`. Key requirements:

1. Write tests first (TDD mandatory)
2. Maintain ≥90% code coverage
3. Follow TypeScript naming conventions
4. Add JSDoc comments to all public APIs
5. Include working examples
6. Pass all quality gates (tests, linting, formatting, type checking)

See `.github/copilot-instructions.md` for detailed coding guidelines.

## License

See [LICENSE](LICENSE) file.