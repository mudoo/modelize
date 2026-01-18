/* eslint-disable no-use-before-define, @typescript-eslint/no-unused-vars */
import { ArrayToMap, EnumInit, EnumValue, IEnum, NativeEnumMembers, ValueTypeFromSingleInit } from 'enum-plus'

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
/** 判断某项是否可选 */
type IsOptional<T> =
  T extends { optional: infer O } ?
    O extends true ? true : false :
  T extends { get: (...args: any) => any } ? true : false;

/** 宽化类型 */
type Widen<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T

// 定义允许的构造函数类型
export type ModelConstructor =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | (new (...args: any[]) => any)
  | IModel<any> // 支持Model类的实例

/** MapItem: model 可为单个构造函数或构造函数数组 */
export interface MapItem {
  [key: string]: any
  /** 属性对应字段 */
  key?: string
  /** 属性对应类型，String/Number/Boolean/Array/Object等原生数据类型，或自定义Model等 */
  model?: ModelConstructor | ModelConstructor[]
  /** 属性默认值，当值为null时自动使用该值填充 */
  default?: ((key: string, value: any, data: any, field: string) => any) | any
  /** 实例化前解析数据(update调用) */
  parse?: (this: any, value: any, data: any, field: string, cfg: MapItem) => any
  /** 转为服务端字段时候调用，convert(value, field)，false则toServer时不赋值 */
  convert?: (this: any, value: any, field: string, cfg: MapItem) => any | boolean
  /** 字段是否可选，值可能为undefined，若为true且需默认值，请配合 default或parse 使用 */
  optional?: boolean
  /** 解析时是否自动转成模型数据，优先级高于模型选项 */
  autoParse?: boolean
  /** 转换为服务端数据时，是否自动转成模型数据 */
  autoConvert?: boolean
  /** 配置getter */
  get?: (this: any) => any
  /** 配置setter */
  set?: (this: any, val: any) => void
  /** 是否可配置 (getter/setter选项) */
  configurable?: boolean
  /** 是否可枚举，默认true (getter/setter选项) */
  enumerable?: boolean
  /** 是否可写入 (getter/setter选项) */
  writable?: boolean
  /** 枚举值，支持enum推导 */
  enum?: Record<string, string | number | EnumItem> | EnumListItem[]
}

/** 模型定义Map */
export type ModelMap = Record<string, string | number | MapItem>

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
  autoParse?: boolean
  /** 转换为服务端数据时，是否自动转成模型数据。默认false */
  autoConvert?: boolean
  /** 实例化时所使用的数据赋值方法，支持update、merge、attr。默认update */
  handler?: 'update' | 'merge' | 'attr'
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
  T extends ObjectConstructor ? Record<string, any> :
  T extends ArrayConstructor ? any[] :
  T extends StringConstructor ? string :
  T extends NumberConstructor ? number :
  T extends BooleanConstructor ? boolean :
  T extends new (...args: any[]) => any ? SafeInstanceType<T> :  // 自定义Model
  T extends IModel<any> ? R extends true ? MapToResult<T['map']> : T['type'] :  // Model
  any

export type EnumItem = {
  key?: string
  value?: any
  label?: string
}
export type EnumListItem = {
  key: string
  value?: any
  label?: string
}

export type MapEnumItem<T, V = false> =
  T extends (infer C)[] ? ValueTypeFromSingleInit<C> :
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
  R extends true
    ? (T extends { convert: (...args: any) => infer R } ? R : never)
    : (T extends { parse: (...args: any) => infer R } ? R : never);

export type MapType<T, R = false> =
  T extends string ? any :                                        // [key]: 'map_key'
  T extends { enum: infer O } ? MapEnum<O, Omit<T, 'enum'>, R> :  // { enum: { ... } } 支持object，推导为key联合类型
  T extends { model: (infer C)[] } ? PrimitiveType<C, R>[] :      // { model: [Model] -> Model[] }
  T extends { model: infer C } ? PrimitiveType<C, R> :            // { model: Model }
  T extends { get: (...args: any) => infer I } ? I :              // { get: () => any }
  ExtractParseOrConvert<T, R> extends never
  ? (
      T extends { default: (...args: any) => infer I } ? I :        // { default: () => any }
      T extends { default: any } ? Widen<T['default']> :            // { default: any }
      T extends (infer C)[] ? PrimitiveType<C, R>[] :               // [key]: [Model] -> Model[]
      PrimitiveType<T, R>                                           // [key]: Model)
    )
  : ExtractParseOrConvert<T, R>;

/** MapToType: 自动推导Map类型 */
export type MapToType<T extends ModelMap> =
  {
    // 必填项
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? never : K
    ]: MapType<T[K]>
  } & {
    // 可选项
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? K : never
    ]?: MapType<T[K]>
  }

export type ExtractKey<T> =
  T extends { key: infer C extends PropertyKey } ? C :
  T extends PropertyKey ? T :
  never

/** MapToResult: 自动推导Map数据类型 */
export type MapToResult<T extends ModelMap> =
  // 必填项
  {
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? never : ExtractKey<T[K]>
    ]: MapType<T[K], true>
  }
  &
  // 可选项
  {
    -readonly [K in keyof T as
      IsOptional<T[K]> extends true ? ExtractKey<T[K]> : never
    ]?: MapType<T[K], true>
  }

export type EnumKeys<T> = {
  [K in keyof T]:
    T[K] extends string ? never :
    T[K] extends { enum: any } ? K :
    never
}[keyof T]

/** 枚举类型（对象形式） */
export type EnumType<
  T extends EnumInit<K, V>,
  K extends keyof T = keyof T,
  V extends EnumValue = ValueTypeFromSingleInit<T[K], K>,
> = IEnum<T, K, V> & NativeEnumMembers<T, K, V>;

/** 枚举类型（数组形式） */
export type EnumList<
  A extends Record<string, any>[],
  // @ts-expect-error: ArrayToMap
  Map extends EnumInit<K, V> = ArrayToMap<A>,
  K extends keyof Map = keyof Map,
  V extends EnumValue = ValueTypeFromSingleInit<Map[K], K>,
> = IEnum<Map, K, V> & NativeEnumMembers<Map, K, V>;

/** 枚举方法返回类型 */
export type ReturnEnum<T> =
  T extends { enum: infer E } ?
    E extends Record<string, any>[] ?
      EnumList<E> :
    E extends Record<string, any> ?
      EnumType<E> :
    never
  : never

export type DeepPartial<T, Depth extends number = 3> = [Depth] extends [never]
  ? T
  : T extends object
  ? T extends IModel<any>
    ? DeepPartial<T['type'], PrevDepth[Depth]>
    : { [K in keyof T]?: DeepPartial<T[K], PrevDepth[Depth]> }
  : T;

type PrevDepth = [never, 0, 1, 2, 3];
