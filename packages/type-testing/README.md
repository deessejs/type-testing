# @deessejs/type-testing

![Type Testing](./public/icon.png)

A micro library for compile-time type testing in TypeScript.

[![npm version](https://img.shields.io/npm/v/@deessejs/type-testing.svg)](https://www.npmjs.com/package/@deessejs/type-testing)
[![npm bundle size](https://img.shields.io/bundlejs/size/@deessejs/type-testing)](https://www.npmjs.com/package/@deessejs/type-testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/deessejs/type-testing/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @deessejs/type-testing
```

Or with pnpm:

```bash
pnpm add @deessejs/type-testing
```

Or with yarn:

```bash
yarn add @deessejs/type-testing
```

## Quick Start

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

## Core Types

### Type Equality

```typescript
import { Equal, NotEqual, SimpleEqual } from '@deessejs/type-testing'

// Strict equality (handles any, never, etc.)
Equal<string, string>           // true
Equal<string, number>           // false

// Inequality check
NotEqual<string, number>        // true

// Simple equality (for plain objects)
SimpleEqual<{ a: string }, { a: string }>  // true
```

### Special Type Detection

```typescript
import {
  IsAny,
  IsNever,
  IsUnknown,
  IsVoid,
  IsUndefined,
  IsNull,
  IsNullable,
  IsOptional
} from '@deessejs/type-testing'

IsAny<any>                      // true
IsNever<never>                  // true
IsUnknown<unknown>             // true
IsVoid<void>                    // true
IsUndefined<undefined>          // true
IsNull<null>                    // true

// Nullable = null | undefined
IsNullable<string | null>       // true
IsNullable<string | undefined>  // true

// Optional = may include undefined
IsOptional<string | undefined> // true
```

### Union, Tuple & Array

```typescript
import { IsUnion, IsTuple, IsArray } from '@deessejs/type-testing'

// Unions
IsUnion<'a' | 'b'>               // true
IsUnion<'a'>                     // false

// Tuples (fixed-length arrays)
IsTuple<[string, number]>        // true
IsTuple<[]>                      // true
IsTuple<string[]>                // false

// Arrays (dynamic-length)
IsArray<string[]>                // true
IsArray<[string]>                // false
```

### Type Inhabitation

```typescript
import { IsInhabited, IsUninhabited } from '@deessejs/type-testing'

// Has at least one value
IsInhabited<string>              // true
IsInhabited<never>               // false

// Has no values (never)
IsUninhabited<never>             // true
IsUninhabited<string>            // false
```

### Property Testing

```typescript
import { HasProperty, PropertyType } from '@deessejs/type-testing'

// Check if type has a property
HasProperty<{ a: string }, 'a'>  // true
HasProperty<{ a: string }, 'b'>  // false

// Get property type
PropertyType<{ a: string }, 'a'> // string
```

### Property Modifiers

```typescript
import { IsReadonly, IsRequired, IsPublic, IsPrivate, IsProtected } from '@deessejs/type-testing'

// Check if all properties are readonly
IsReadonly<{ readonly a: string }>  // true
IsReadonly<{ a: string }>          // false

// Check if all properties are required
IsRequired<{ a: string }>          // true
IsRequired<{ a?: string }>        // false

// Check property visibility (uses naming convention)
IsPublic<{ a: string }, 'a'>       // true
IsPrivate<{ __private: string }, '__private'>  // true
IsProtected<{ _protected: string }, '_protected'> // true
```

> **Note**: `IsPublic`, `IsPrivate`, and `IsProtected` use TypeScript's private field naming convention (`__` prefix) and common JavaScript convention (`_` prefix for protected). These are naming-convention-based checks, not actual TypeScript access modifiers (which don't exist for object properties).

### Function Types

```typescript
import { Parameters, ReturnType, Parameter } from '@deessejs/type-testing'

// Get parameters as tuple
Parameters<(a: string, b: number) => void>  // [string, number]

// Get return type
ReturnType<(a: string) => number>           // number

// Get parameter at index
Parameter<(a: string, b: number), 0>        // string
Parameter<(a: string, b: number), 1>         // number
```

### Length

```typescript
import { Length } from '@deessejs/type-testing'

Length<['a', 'b', 'c']>            // 3
Length<[]>                          // 0
```

### Deep Type Manipulation

```typescript
import { DeepReadonly, DeepPartial, RequiredKeys, OptionalKeys } from '@deessejs/type-testing'

// Make all properties readonly recursively
DeepReadonly<{ a: string; b: { c: number } }>
// { readonly a: string; readonly b: { readonly c: number } }

// Make all properties optional recursively
DeepPartial<{ a: string; b: { c: number } }>
// { a?: string; b?: { c?: number } | undefined }

// Get keys of required properties
RequiredKeys<{ a: string; b?: number }>  // 'a'

// Get keys of optional properties
OptionalKeys<{ a: string; b?: number }>  // 'b'
```

### Constructor & Abstract Types

```typescript
import { IsConstructor, IsAbstract } from '@deessejs/type-testing'

class Foo {}
abstract class Bar {}

IsConstructor<typeof Foo>    // true
IsConstructor<Foo>          // false (instance)
IsAbstract<typeof Bar>      // true
IsAbstract<typeof Foo>     // false
```

### Special Equality

```typescript
import { IsNeverEqual } from '@deessejs/type-testing'

// Check if both types are never
// Differs from Equal<never, never> which returns false
IsNeverEqual<never, never>     // true
IsNeverEqual<any, any>        // false (any is not never)
```

## Runtime Type Checking

The library also provides runtime type checking utilities:

```typescript
import {
  // Type check functions returning TypeCheckResult objects
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isNull,
  isUndefined,

  // Boolean type guards (for use in conditionals)
  isStringGuard,
  isNumberGuard,
  isBooleanGuard,
  isObjectGuard,
  isArrayGuard,
  isNullGuard,
  isUndefinedGuard,
  isSymbolGuard,
  isBigIntGuard,
  isFunctionGuard
} from '@deessejs/type-testing'

// TypeCheckResult objects
const stringResult = isString('hello')
stringResult.matches   // true
stringResult.value     // 'hello'
stringResult.typeName   // 'string'

// Boolean type guards
if (isStringGuard(value)) {
  // value is narrowed to string here
}
```

## Chainable API

### check() - Soft type checking

```typescript
import { check } from '@deessejs/type-testing'

// Type equality
check<string>().equals<string>()           // passes
check<string>().equals<number>()            // fails at compile time

// Type extends
check<string>().extends<string>()          // passes
check<string>().extends<any>()              // passes

// Property check
check<{ a: string }>().hasProperty('a')    // passes
check<{ a: string }>().hasProperty('b')     // fails

// Special types
check<any>().isAny()                        // passes
check<never>().isNever()                    // passes
check<unknown>().isUnknown()                // passes

// Nullable/Optional
check<string | null>().isNullable()         // passes
check<string | undefined>().isOptional()     // passes

// Union/Tuple/Array
check<'a' | 'b'>().isUnion()                // passes
check<[string, number]>().isTuple()         // passes
check<string[]>().isArray()                  // passes
```

### assert() - Strict type checking

Similar to `check()` but throws at compile time on failure with a clearer error message.

```typescript
import { assert } from '@deessejs/type-testing'

// Fails with a clear error message
assert<string>().equals<number>()           // compile error
assert<{ a: string }>().hasProperty('b')    // compile error
```

### expect() - BDD-style API

```typescript
import { expect } from '@deessejs/type-testing'

// Compare two types
expect<string, string>().toBeEqual()         // passes
expect<string, number>().toBeNotEqual()     // passes

// Type extends
expect<string>().toExtend<string>()          // passes

// Special types
expect<any>().toBeAny()                      // passes
expect<never>().toBeNever()                  // passes

// Nullable/Optional
expect<string | null>().toBeNullable()       // passes
expect<string | undefined>().toBeOptional()  // passes
```

## Vitest Integration

The library provides a native Vitest integration with custom matchers for a more familiar testing experience.

### Installation

```bash
npm install @deessejs/type-testing
```

### Quick Start

```typescript
import { expectType } from '@deessejs/type-testing/vitest'

// Type equality
expectType<string>().toBeType<string>()
expectType<string>().toNotBeType<number>()

// Type extends
expectType<string>().toExtend<string>()
expectType<string>().toNotExtend<number>()

// Property check
expectType<{ a: string }>().toHaveProperty('a')

// Special types
expectType<any>().toBeAny()
expectType<never>().toBeNever()
expectType<unknown>().toBeUnknown()
expectType<void>().toBeVoid()
expectType<undefined>().toBeUndefined()
expectType<null>().toBeNull()

// Nullable/Optional
expectType<string | null>().toBeNullable()
expectType<{ a?: string }>().toBeOptional()

// Structure
expectType<string | number>().toBeUnion()
expectType<[string, number]>().toBeTuple()
expectType<string[]>().toBeArray()

// Inhabitation
expectType<string>().toBeInhabited()
expectType<never>().toBeUninhabited()
```

### Using with Vitest's expect.extend

You can also extend Vitest's expect with the matchers:

```typescript
import { expect, test } from 'vitest'
import { toBeType, toHaveProperty } from '@deessejs/type-testing/vitest'

expect.extend({ toBeType, toHaveProperty })

test('type checks', () => {
  expect<string>().toBeType<string>()
  expect<{ a: string }>().toHaveProperty('a')
})
```

### Setup File

For automatic matcher registration, add the setup file to your Vitest config:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['@deessejs/type-testing/vitest/setup']
  }
})
```

Or import it in your setup file:

```typescript
// setup.ts
import '@deessejs/type-testing/vitest/setup'
```

### Available Matchers

| Matcher | Description |
|---------|-------------|
| `toBeType<T>()` | Asserts type equality |
| `toNotBeType<T>()` | Asserts type inequality |
| `toExtend<T>()` | Asserts type extends another |
| `toNotExtend<T>()` | Asserts type does not extend another |
| `toHaveProperty<K>()` | Asserts property exists |
| `toBeAny()` | Asserts type is `any` |
| `toBeNever()` | Asserts type is `never` |
| `toBeUnknown()` | Asserts type is `unknown` |
| `toBeVoid()` | Asserts type is `void` |
| `toBeUndefined()` | Asserts type is `undefined` |
| `toBeNull()` | Asserts type is `null` |
| `toBeNullable()` | Asserts type is nullable |
| `toBeOptional()` | Asserts type is optional |
| `toBeUnion()` | Asserts type is a union |
| `toBeTuple()` | Asserts type is a tuple |
| `toBeArray()` | Asserts type is an array |
| `toBeInhabited()` | Asserts type is inhabited |
| `toBeUninhabited()` | Asserts type is uninhabited |

> **Note**: The `toNotBeType` matcher follows a different pattern than standard Vitest (`not.toBeType`). This is intentional as it provides better TypeScript inference. Use `toNotBeType` instead of `.not.toBeType`.

## Compile-time Assertions

### ExpectTrue & ExpectEqual

```typescript
import { ExpectTrue, ExpectEqual } from '@deessejs/type-testing'

// Assert a type is true
type Test1 = ExpectTrue<true>                // true

// Assert equality - throws if not equal
type Test2 = ExpectEqual<string, string>    // string

// Using with type tests
type IsString<T> = ExpectEqual<T, string>
type Result = IsString<string>              // string (passes)
```

### expectFalse

```typescript
import { expectFalse } from '@deessejs/type-testing'

// Assert T is false at compile time
expectFalse<false>()                        // passes
expectFalse<true>()                         // compile error
```

## API Reference

### Types

| Type | Description |
|------|-------------|
| `Equal<T, U>` | Strict equality check |
| `NotEqual<T, U>` | Inequality check |
| `SimpleEqual<T, U>` | Simple equality for plain types |
| `IsNeverEqual<T, U>` | Check if both types are `never` |
| `IsAny<T>` | Check if type is `any` |
| `IsNever<T>` | Check if type is `never` |
| `IsUnknown<T>` | Check if type is `unknown` |
| `IsVoid<T>` | Check if type is `void` |
| `IsUndefined<T>` | Check if type is `undefined` |
| `IsNull<T>` | Check if type is `null` |
| `IsNullable<T>` | Check if type is `null \| undefined` |
| `IsOptional<T>` | Check if type may be `undefined` |
| `IsUnion<T>` | Check if type is a union |
| `IsTuple<T>` | Check if type is a tuple |
| `IsArray<T>` | Check if type is an array |
| `IsInhabited<T>` | Check if type has at least one value |
| `IsUninhabited<T>` | Check if type has no values |
| `HasProperty<T, K>` | Check if type has property K |
| `PropertyType<T, K>` | Get type of property K |
| `IsReadonly<T>` | Check if all properties are readonly |
| `IsRequired<T>` | Check if all properties are required |
| `IsPublic<T, K>` | Check if property is public |
| `IsPrivate<T, K>` | Check if property is private (naming convention) |
| `IsProtected<T, K>` | Check if property is protected (naming convention) |
| `DeepReadonly<T>` | Make all properties readonly recursively |
| `DeepPartial<T>` | Make all properties optional recursively |
| `RequiredKeys<T>` | Get keys of required properties |
| `OptionalKeys<T>` | Get keys of optional properties |
| `Parameters<T>` | Get function parameters as tuple |
| `ReturnType<T>` | Get function return type |
| `Parameter<T, N>` | Get parameter at index N |
| `IsConstructor<T>` | Check if type is a constructor |
| `IsAbstract<T>` | Check if type is abstract |
| `Length<T>` | Get tuple/array length |
| `ExpectTrue<T>` | Assert T is true |
| `ExpectEqual<T, U>` | Assert T equals U |

### Functions

| Function | Description |
|----------|-------------|
| `check<T>()` | Create a chainable type checker |
| `assert<T>()` | Create an assert type checker (throws on failure) |
| `expect<T, U>()` | Create an expect-style type checker |
| `expectFalse<T>()` | Assert T is false at compile time |

## License

MIT
