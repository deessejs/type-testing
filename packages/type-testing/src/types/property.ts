/**
 * Property testing utilities.
 */

import type { Equal } from './equality.js'

/**
 * Checks if a type has a specific property.
 */
export type HasProperty<T, K extends PropertyKey> = K extends keyof T ? true : false

/**
 * Gets the type of a specific property from a type.
 */
export type PropertyType<T, K extends keyof T> = T[K]

/**
 * Checks if all properties of a type are readonly.
 *
 * @example
 * ```typescript
 * type Test = IsReadonly<{ readonly a: string }> // true
 * type Test2 = IsReadonly<{ a: string }> // false
 * ```
 */
export type IsReadonly<T> = Equal<{
  [K in keyof T]: T[K]
}, {
  readonly [K in keyof T]: T[K]
}> extends true ? true : false

/**
 * Checks if all properties of a type are required (not optional).
 *
 * @example
 * ```typescript
 * type Test = IsRequired<{ a: string }> // true
 * type Test2 = IsRequired<{ a?: string }> // false
 * ```
 */
export type IsRequired<T> = Equal<{
  [K in keyof T]-?: T[K]
}, {
  [K in keyof T]: T[K]
}> extends true ? true : false

/**
 * Checks if a property is public (not private or protected).
 *
 * @example
 * ```typescript
 * type Test = IsPublic<{ a: string }, 'a'> // true
 * ```
 */
export type IsPublic<T, K extends PropertyKey> = K extends keyof T
  ? K extends `__${string}`
    ? false
    : true
  : false

/**
 * Checks if a property is private.
 *
 * @example
 * ```typescript
 * type Test = IsPrivate<{ __private: string }, '__private'> // true
 * type Test2 = IsPrivate<{ a: string }, 'a'> // false
 * ```
 */
export type IsPrivate<T, K extends PropertyKey> = K extends keyof T
  ? K extends `__${string}`
    ? true
    : false
  : false

/**
 * Checks if a property is protected.
 * Uses the naming convention: properties starting with `_` (but not `__`)
 * are considered protected.
 *
 * Note: TypeScript doesn't have actual `protected` access modifiers for
 * object properties - this uses the common naming convention where
 * protected properties are prefixed with `_`.
 *
 * @example
 * ```typescript
 * type Test = IsProtected<{ _protected: string }, '_protected'> // true
 * type Test2 = IsProtected<{ a: string }, 'a'> // false
 * type Test3 = IsProtected<{ __private: string }, '__private'> // false (private)
 * ```
 */
export type IsProtected<T, K extends PropertyKey> = K extends keyof T
  ? K extends `_${string}`
    ? K extends `__${string}`
      ? false
      : true
    : false
  : false
