/**
 * Special type detection utilities.
 */

import type { Equal } from './equality.js'

/**
 * Checks if a type is `any`.
 * Uses the technique: 0 extends (1 & T) ? true : false
 *
 * @example
 * ```typescript
 * check<any>().isAny() // passes
 * check<string>().isAny() // fails
 * ```
 */
export type IsAny<T> = 0 extends (1 & T) ? true : false

/**
 * Checks if a type is `never`.
 *
 * @example
 * ```typescript
 * check<never>().isNever() // passes
 * check<string>().isNever() // fails
 * ```
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * Checks if a type is `unknown`.
 *
 * @example
 * ```typescript
 * check<unknown>().isUnknown() // passes
 * ```
 */
export type IsUnknown<T> = [unknown] extends [T] ? ([T] extends [unknown] ? true : false) : false

/**
 * Checks if a type is `void`.
 */
export type IsVoid<T> = Equal<T, void>

/**
 * Checks if a type is `undefined`.
 */
export type IsUndefined<T> = Equal<T, undefined>

/**
 * Checks if a type is `null`.
 */
export type IsNull<T> = Equal<T, null>

/**
 * Checks if a type is `null` or `undefined`.
 */
export type IsNullable<T> = [null] extends [T] ? true : ([undefined] extends [T] ? true : false)

/**
 * Checks if a type is optional (may be undefined).
 */
export type IsOptional<T> = [undefined] extends [T] ? true : false
