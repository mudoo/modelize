/* eslint-disable no-use-before-define, @typescript-eslint/no-unused-vars */
import type { ArrayToMap, EnumInit, EnumValue, IEnum, NativeEnumMembers, ValueTypeFromSingleInit } from 'enum-plus'

export interface IModel<T extends ModelMap, D extends MapToType<T> = MapToType<T>, S extends MapToResult<T> = MapToResult<T>>{
  /** 源数据类型 */
  readonly rawType: S;
  /** 模型类型 */
  readonly type: D;
  /** 模型字段映射 */
  readonly map: NormalizedMap<T>;
  /** 模型选项 */
  readonly option: ModelOption;
}

/** 判断是否为模型 */
export type IsModel<T> = T extends IModel<infer U, infer V> ? true : false;
/** 判断是否为数组 */
type IsArray<T> = T extends readonly any[] ? true : false
/** 兼容只读和普通数组 */
type AnyArray<T = any> = T[] | readonly T[]
/** 判断某项是否可选 */
type IsOptional<T> =
  T extends { optional: infer O } ?
    O extends true ? true : false :
  T extends { get: (...args: any) => any } ? true : false;

/** 判断某项是否只读 */
export type IsReadonly<T> =
  T extends { readonly: true } ? true :
  T extends { get: (...args: any) => any } ?
    T extends { set: (...args: any) => void } ? false : true
  : false;

/** 宽化类型 */
type Widen<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends Date ? Date :
  T

// 定义允许的构造函数类型
export type ModelConstructor =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor
  | (new (...args: any[]) => any)
  | IModel<any, any, any> // 支持Model类的实例

/** MapItem: model 可为单个构造函数或构造函数数组 */
export interface MapItem {
  [key: string]: any
  /** 源字段名 */
  key?: string
  /** 数据类型，String/Number/Boolean/Date/Array/Object等原生数据类型，或自定义Model等 */
  model?: ModelConstructor | AnyArray<ModelConstructor>
  /** 默认值或默认值生成函数 */
  default?: ((key: string, value: any, data: any, field: string) => any) | any
  /** 解析函数，用于自定义数据解析逻辑 */
  parse?: (this: any, value: any, data: any, field: string, cfg: MapItem) => any
  /** 转换函数，用于转换为源数据，false则toRaw时不赋值 */
  convert?: ((this: any, value: any, field: string, cfg: MapItem) => any) | false
  /** 是否可选，值可能为undefined（parse会是undefined，convert会忽略空值），若需默认值，请配合 default或parse 使用 */
  optional?: boolean
  /** 是否只读，映射后的类型将带有 readonly 修饰符 */
  readonly?: boolean
  /** 配置getter */
  get?: (this: any) => any
  /** 配置setter */
  set?: (this: any, val: any) => void
  /** 枚举值，支持enum推导 */
  enum?: Record<string, string | number | EnumItem> | AnyArray<EnumListItem>
}

/** 模型定义Map */
export type ModelMap = Record<string, string | number | MapItem | IModel<any, any, any>>

/** 标准化后的模型定义Map */
export type NormalizedMap<T extends ModelMap> = {
  [K in keyof T]: T[K] extends string | number ? { key: T[K] } : T[K]
}

/** 模型数据 */
export type ModelData = Record<string, any>

/**
 * 模型选项
 */
export interface ModelOption {
  [key: string]: any
  /** 解析时是否自动转成模型数据，为空或数据类型不匹配时，将自动转为指定模型数据。若明确设置了default，为空时依然使用default值。默认true */
  parseToModel?: boolean
  /** 转换为源数据时，是否自动转成模型格式数据。默认false */
  convertToModel?: boolean
  /** 实例化时所使用的数据赋值方法，支持update、merge、attr。默认update */
  handler?: 'update' | 'merge' | 'attr'
  /** 调试模式：类型不匹配时输出警告。优先级高于Model.debug */
  debug?: boolean
  /** 严格模式：类型不匹配时抛出错误。优先级高于Model.strict */
  strict?: boolean
  /**
   * 前置数据解析，用于前置处理实例化所需的数据(update)
   *
   * @param target 数据源
   * @param data 下发数据
   * @returns 返回处理后的数据
   */
  onBeforeUpdate?: (target: any, data: any) => any
  /**
   * 更新数据后回调，new实例化时也会执行
   *
   * @param target 数据源
   * @param data 下发数据
   */
  onDataChange?: (target: any, data?: any) => void
}

/**
 * 操作选项
 */
export interface HandleOption extends ModelOption {
  /** 是否跳过空数据 */
  skipNull?: boolean
  linkMap?: any
}

/**
 * 解析选项
 */
export interface ParseOption extends HandleOption {
  /** getter/setter defineProperty选项 */
  propertyAttributes?: {
    configurable?: boolean
    enumerable?: boolean
    writable?: boolean
  }
}

export type SafeInstanceType<T> = T extends new (...args: any[]) => any
  ? InstanceType<T> extends unknown
    ? any
    : InstanceType<T>
  : never;

/** 类型映射：将原生构造函数转换为对应的基本类型 */
export type PrimitiveType<T, R = false> =
  T extends DateConstructor ? Date :
  T extends ObjectConstructor ? Record<string, any> :
  T extends ArrayConstructor ? any[] :
  T extends StringConstructor ? string :
  T extends NumberConstructor ? number :
  T extends BooleanConstructor ? boolean :
  T extends IModel<any, any, any> ? (R extends true ? T['rawType'] : T['type']) :  // Model 实例
  T extends new (...args: any[]) => any ? SafeInstanceType<T> :  // 自定义Model
  any

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

type ExtractParseOrConvert<T, R> =
  T extends IModel<any, any, any> ? never :
  R extends true
    ? (T extends { convert: (...args: any) => infer R } ? R : never)
    : (T extends { parse: (...args: any) => infer R } ? R : never);

export type MapType<T, R = false> =
  T extends IModel<any, any, any> ? PrimitiveType<T, R> :
  T extends string ? any :                                        // [key]: 'map_key'
  T extends { enum: infer O } ? MapEnum<O, Omit<T, 'enum'>, R> :  // { enum: { ... } } 支持object，推导为key联合类型
  T extends { model: AnyArray<infer C> } ? PrimitiveType<C, R>[] :      // { model: [Model] -> Model[] }
  T extends { model: infer C } ? PrimitiveType<C, R> :            // { model: Model }
  T extends { get: (...args: any) => infer I } ? I :              // { get: () => any }
  T extends DateConstructor ? Date :
  ExtractParseOrConvert<T, R> extends never
  ? (
      T extends { default: (...args: any) => infer I } ? I :        // { default: () => any }
      T extends { default: any } ? Widen<T['default']> :            // { default: any }
      T extends AnyArray<infer C> ? PrimitiveType<C, R>[] :               // [key]: [Model] -> Model[]
      PrimitiveType<T, R>                                           // [key]: Model)
    )
  : ExtractParseOrConvert<T, R>;

/** MapToType: 自动推导Map类型 */
export type MapToType<T extends ModelMap> =
  {
    readonly [K in keyof T as
      IsOptional<T[K]> extends true ? never : (IsReadonly<T[K]> extends true ? K : never)
    ]: MapType<T[K]>
  } & {
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? never : (IsReadonly<T[K]> extends true ? never : K)
    ]: MapType<T[K]>
  } & {
    readonly [K in keyof T as
      IsOptional<T[K]> extends true ? (IsReadonly<T[K]> extends true ? K : never) : never
    ]?: MapType<T[K]>
  } & {
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? (IsReadonly<T[K]> extends true ? never : K) : never
    ]?: MapType<T[K]>
  }

export type ExtractKey<T, K> =
  T extends { key: infer C extends PropertyKey } ? C :
  T extends PropertyKey ? T :
  K extends PropertyKey ? K :
  never

/** MapToResult: 自动推导Map数据类型 */
export type MapToResult<T extends ModelMap> =
  {
    readonly [K in keyof T as
      IsOptional<T[K]> extends true ? never : (IsReadonly<T[K]> extends true ? ExtractKey<T[K], K> : never)
    ]: MapType<T[K], true>
  } & {
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? never : (IsReadonly<T[K]> extends true ? never : ExtractKey<T[K], K>)
    ]: MapType<T[K], true>
  } & {
    readonly [K in keyof T as
      IsOptional<T[K]> extends true ? (IsReadonly<T[K]> extends true ? ExtractKey<T[K], K> : never) : never
    ]?: MapType<T[K], true>
  } & {
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? (IsReadonly<T[K]> extends true ? never : ExtractKey<T[K], K>) : never
    ]?: MapType<T[K], true>
  }

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

export type DeepPartial<T, Depth extends number = 3> =
  [Depth] extends [never]
    ? T
    : T extends object
      ? T extends IModel<any, any, any>
        ? DeepPartial<T['type'], PrevDepth[Depth]>
        : { [K in keyof T]?: DeepPartial<T[K], PrevDepth[Depth]> }
      : T;

type PrevDepth = [never, 0, 1, 2, 3];
