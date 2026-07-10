<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/icon.png">
    <source media="(prefers-color-scheme: light)" srcset="public/icon.png">
    <img src="public/icon.png" alt="type-testing" width="150" height="150" style="border-radius: 50%;">
  </picture>
</p>

<h1 align="center">@deessejs/type-testing</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@deessejs/type-testing">
    <img src="https://img.shields.io/npm/v/@deessejs/type-testing" alt="npm Version">
  </a>
  <a href="https://www.npmjs.com/package/@deessejs/type-testing">
    <img src="https://img.shields.io/bundlejs/size/@deessejs/type-testing" alt="Bundle Size">
  </a>
  <a href="https://github.com/deessejs/type-testing/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/deessejs/type-testing/ci?label=tests" alt="Tests">
  </a>
  <a href="https://github.com/deessejs/type-testing/actions">
    <img src="https://img.shields.io/badge/coverage-100%25-brightgreen" alt="Coverage">
  </a>
  <a href="https://github.com/deessejs/type-testing/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/deessejs/type-testing" alt="License">
  </a>
</p>

> A micro library for compile-time type testing in TypeScript.

## Requirements

- TypeScript 5.0+

## Installation

```bash
# Install type-testing
npm install @deessejs/type-testing

# Or using pnpm
pnpm add @deessejs/type-testing

# Or using yarn
yarn add @deessejs/type-testing
```

## Usage

```typescript
import { Equal, check, assert, expect } from '@deessejs/type-testing'

// Simple type equality
type Test = Equal<string, string>  // true

// Chainable API
check<string>().equals<string>()   // passes

// Assert with clear errors
assert<{ a: string }>().hasProperty('a')

// Expect syntax
expect<string, string>().toBeEqual()
```

## Features

- **Type Equality** - Strict and simple equality checks
- **Special Type Detection** - IsAny, IsNever, IsUnknown, IsVoid, etc.
- **Union/Tuple/Array Detection** - IsUnion, IsTuple, IsArray
- **Type Inhabitation** - IsInhabited, IsUninhabited
- **Property Testing** - HasProperty, PropertyType
- **Property Modifiers** - IsReadonly, IsRequired, IsPublic, IsPrivate, IsProtected
- **Deep Type Manipulation** - DeepReadonly, DeepPartial, RequiredKeys, OptionalKeys
- **Function Types** - Parameters, ReturnType, Parameter
- **Constructor/Abstract** - IsConstructor, IsAbstract
- **Special Equality** - IsNeverEqual
- **Chainable API** - check(), assert(), expect() for fluent testing

## API Reference

### Types

| Type | Description |
|------|-------------|
| `Equal<T, U>` | Strict equality check |
| `NotEqual<T, U>` | Inequality check |
| `IsNeverEqual<T, U>` | Check if both types are `never` |
| `IsAny<T>` | Check if type is `any` |
| `IsNever<T>` | Check if type is `never` |
| `IsUnknown<T>` | Check if type is `unknown` |
| `IsNullable<T>` | Check if type is `null \| undefined` |
| `IsUnion<T>` | Check if type is a union |
| `IsTuple<T>` | Check if type is a tuple |
| `IsArray<T>` | Check if type is an array |
| `IsReadonly<T>` | Check if all properties are readonly |
| `IsRequired<T>` | Check if all properties are required |
| `IsPublic<T, K>` | Check if property is public |
| `IsPrivate<T, K>` | Check if property is private |
| `IsProtected<T, K>` | Check if property is protected |
| `DeepReadonly<T>` | Make all properties readonly recursively |
| `DeepPartial<T>` | Make all properties optional recursively |
| `RequiredKeys<T>` | Get keys of required properties |
| `OptionalKeys<T>` | Get keys of optional properties |
| `IsConstructor<T>` | Check if type is a constructor |
| `IsAbstract<T>` | Check if type is abstract |

### Functions

| Function | Description |
|----------|-------------|
| `check<T>()` | Create a chainable type checker |
| `assert<T>()` | Create an assert type checker (throws on failure) |
| `expect<T, U>()` | Create an expect-style type checker |

For complete documentation, see [packages/type-testing/README.md](packages/type-testing/README.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

- **Nesalia Inc.**

## Security

If you discover any security vulnerabilities, please send an e-mail to security@nesalia.com.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
