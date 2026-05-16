/* eslint-disable no-use-before-define, @typescript-eslint/no-unused-vars */
import type { ArrayToMap, EnumInit, EnumValue, IEnum, NativeEnumMembers, ValueTypeFromSingleInit } from 'enum-plus'
import type { Model } from '../model'
import type { AnyArray, IsArray, MapItem, MapType, ModelMap, MapToType, MapToResult } from '../types'

declare module '../model' {
  interface Model<T extends ModelMap, D extends MapToType<T>, S extends MapToResult<T>> {
    /** 枚举缓存 */
    $enum: Record<string, any>
    /**
     * 获取枚举
     * @param field 枚举字段
     * @returns 返回枚举实例
     */
    enum<K extends keyof EnumKeys<T>> (field: K): ReturnEnum<EnumKeys<T>[K]>
  }
}

export type EnumItem = {
  key?: string
  value?: any
  label?: any
}
export type EnumListItem = {
  key: string
  value?: any
  label?: any
}

export type MapEnumItem<T, V = false> =
  T extends AnyArray<infer C> ? ValueTypeFromSingleInit<C> :
  T extends Record<string, infer C>
    ? V extends true
      ? ValueTypeFromSingleInit<C>
      : keyof T
    : never

export type MapEnum<T, O = null, R = false> =
  O extends null
    ? MapEnumItem<T>
    : O extends MapItem
      ? IsArray<MapType<O, R>> extends true
        ? MapEnumItem<T, true>[]
        : MapEnumItem<T, true>
      : never

/** 获取含有枚举的字段名 */
export type EnumKeys<T> = {
  [K in keyof T as T[K] extends { enum: any } ? K : never]: T[K]
}

/** 枚举类型（对象形式） */
export type EnumType<
  T extends EnumInit<K, V>,
  K extends keyof T = keyof T,
  V extends EnumValue = ValueTypeFromSingleInit<T[K], K>,
> = IEnum<T, K, V> & NativeEnumMembers<T, K, V>;

/** 枚举类型（数组形式） */
export type EnumList<
  A extends AnyArray<Record<string, any>>,
  // @ts-expect-error: ArrayToMap
  Map extends EnumInit<K, V> = ArrayToMap<A>,
  K extends keyof Map = keyof Map,
  V extends EnumValue = ValueTypeFromSingleInit<Map[K], K>,
> = IEnum<Map, K, V> & NativeEnumMembers<Map, K, V>;

/** 枚举方法返回类型 */
export type ReturnEnum<T> =
  T extends { enum: infer E }
    ? E extends AnyArray<Record<string, any>>
      ? EnumList<E>
      : E extends Record<string, any>
        ? EnumType<E>
        : never
    : never;

/**
 * 枚举插件
 * @param Enum enum-plus 的 Enum 函数
 * @returns 插件函数
 */
export function EnumPlugin (Enum: any) {
  return (BaseModel: typeof Model) => {
    // 注入静态属性
    (BaseModel as any).Enum = Enum

    // 注入实例方法
    BaseModel.prototype.enum = function<K extends keyof EnumKeys<any>> (this: any, field: K): ReturnEnum<EnumKeys<any>[K]> {
      const key = field as string
      if (!this.$enum) {
        Object.defineProperty(this, '$enum', {
          value: {},
          enumerable: false,
          writable: true,
          configurable: true,
        })
      }
      if (this.$enum[key]) return this.$enum[key]
      const cfg = this.map[key] as MapItem

      if (typeof cfg === 'string' || !cfg.enum) return undefined as never

      const EnumFn = (this.constructor as any).Enum
      if (!EnumFn) {
        throw new Error('[modelize] Enum function not found. Please call Model.usePlugin(EnumPlugin(Enum)) first.')
      }

      this.$enum[key] = EnumFn(cfg.enum)
      return this.$enum[key]
    }
  }
}
