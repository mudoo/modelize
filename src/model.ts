import type {
  DeepPartial,
  EnumKeys,
  HandleOption,
  MapItem,
  MapToResult,
  MapToType,
  IModel,
  NormalizedMap,
  ModelConstructor,
  ModelData,
  ModelMap,
  ModelOption,
  ParseOption,
  ReturnEnum,
} from './types'
import {
  checkType,
  getTypeName,
  isEmptyValue,
} from './check'
import {
  createExtendedModel,
  parseModelMap,
  parseModelOptions,
  resolveConvertValue,
  resolveSetValue,
} from './helper'
export type * from './types'

/**
 * 通用数据模型类，用于定义、解析、转换和操作数据模型。
 *
 * @typeParam T - 模型定义的 Map 类型，描述模型的字段及其映射关系。
 * @typeParam D - 由 T 映射得到的模型类型 MapToType<T>。
 * @typeParam S - 由 T 映射得到的源数据类型 MapToResult<T>。
 *
 * @example
 * 用法示例：
 * ```typescript
 * const userModel = Model.define({
 *   id: 'user_id',
 *   name: String,
 *   age: Number,
 *   birthday: {
 *     key: 'birth_day',
 *     model: Number,
 *   }
 * });
 *
 * type UserVO = typeof userModel.type;
 * type UserDTO = typeof userModel.rawType;
 *
 * const user = userModel.parse({ user_id: 1, name: 'Tom', age: 18 });
 * const rawData = userModel.toRaw(user);
 * ```
 */
export class Model<T extends ModelMap, D extends MapToType<T> = MapToType<T>, S extends MapToResult<T> = MapToResult<T>> implements IModel<T, D> {
  /** 调试模式：类型不匹配时输出警告 */
  static debug: boolean = false
  /** 严格模式：类型不匹配时抛出错误 */
  static strict: boolean = false

  /** 枚举方法 */
  static Enum: any
  /** 注册枚举方法 */
  static useEnum (enumFn: any) {
    this.Enum = enumFn
  }

  /**
   * 定义模型
   *
   * @param map 模型定义
   * @param opt 模型配置
   * @returns 模型实例
   */
  static define<const T extends ModelMap> (map: T, opt?: ModelOption) {
    return new this(map, opt)
  }

  /** 无任何值，仅用于提取源数据类型：type TestDTO = typeof TestModel.rawType */
  declare readonly rawType: S
  /** 无任何值，仅用于提取模型类型：type TestVO = typeof TestModel.type */
  declare readonly type: D
  readonly option: ModelOption = {}
  readonly map: NormalizedMap<T> = {} as any
  readonly mapKeys: string[] = []
  readonly mapEntries: [string, MapItem][] = []
  private readonly accessorEntries: [string, MapItem][] = []

  /**
   * 数据模型
   * @param data 数据对象，包含数据各个属性
   * @param options 模型选项
   */
  constructor (map: T, opt?: ModelOption) {
    this.option = parseModelOptions(opt)
    this.map = parseModelMap(map, (val) => val instanceof Model)

    // 缓存模型定义
    this.mapKeys = Object.keys(this.map)
    this.mapKeys.forEach((key) => {
      const cfg = this.map[key] as MapItem
      this.mapEntries.push([key, cfg])
      if (cfg.get || cfg.set) {
        this.accessorEntries.push([key, cfg])
      }
    })
  }

  /**
   * 继承部分模型
   *
   * @param keys 继承字段列表
   * @param map 新的模型Map
   * @param opt 模型选项
   * @returns 返回新的模型实例
   */
  extends<K extends keyof T, const M extends ModelMap>(
    keys: K[],
    map: M,
    opt?: ModelOption
  ): Model<Omit<Pick<T, K>, keyof M> & M>

  /**
   * 继承模型
   * @param map 新的模型Map
   * @param opt 模型选项
   * @returns 返回新的模型实例
   */
  extends<const M extends ModelMap>(map: M, opt?: ModelOption): Model<Omit<T, keyof M> & M>
  extends<K extends keyof T, const M extends ModelMap> (
    keysOrMap: K[] | M,
    mapOrOpt?: M | ModelOption,
    opt?: ModelOption,
  ): any {
    if (Array.isArray(keysOrMap)) {
      return this.pickExtends(keysOrMap, mapOrOpt as M, opt)
    } else {
      return createExtendedModel(this.constructor, this.map, this.option, {
        type: 'extends',
        map: keysOrMap,
        opt: mapOrOpt,
      })
    }
  }

  /**
   * 摘选模型字段
   *
   *
   * @param keys 摘选字段列表
   * @returns 返回新的模型实例
   */
  pickExtends<K extends keyof T>(keys: K[]): Model<Pick<T, K>>

  /**
   * 继承摘选模型字段
   *
   *
   * @param keys 摘选字段列表
   * @param map 新的模型Map
   * @param opt 模型选项
   * @returns 返回新的模型实例
   */
  pickExtends<K extends keyof T, const M extends ModelMap>(
    keys: K[],
    map: M,
    opt?: ModelOption
  ): Model<Omit<Pick<T, K>, keyof M> & M>

  pickExtends<K extends keyof T, const M extends ModelMap> (keys: K[], map?: M, opt?: ModelOption): any {
    return createExtendedModel(this.constructor, this.map, this.option, {
      type: 'pick',
      keys,
      map,
      opt,
    })
  }

  /**
   * 省略模型定义中的某些字段
   *
   * @param keys 字段列表或单个字段
   * @returns 返回新的模型实例
   */
  omitExtends<K extends keyof T>(keys: K[]): Model<Omit<T, K>>
  /**
   * 省略模型定义中的某些字段
   *
   * @param keys 字段列表或单个字段
   * @param map 新的模型Map
   * @param opt 模型选项
   * @returns 返回新的模型实例
   */
  omitExtends<K extends keyof T, const M extends ModelMap>(
    keys: K[] | K,
    map?: M,
    opt?: ModelOption
  ): Model<Omit<T, K> & M>

  omitExtends<K extends keyof T, const M extends ModelMap> (keys: K[] | K, map?: M, opt?: ModelOption): any {
    return createExtendedModel(this.constructor, this.map, this.option, {
      type: 'omit',
      keys,
      map,
      opt,
    })
  }

  /**
   * 初始化数据（模型字段）
   *
   * @param data 数据
   * @param options 操作选项
   * @returns
   */
  init (data: DeepPartial<D>, options?: ParseOption) {
    return this.parse(data, {
      handler: 'merge',
      ...options,
    })
  }

  /**
   * 解析数据（源数据字段）
   *
   * @param data 数据
   * @param options 操作选项
   * @returns
   */
  parse<R extends D & { $model: Model<T> }> (data: ModelData = {}, options?: ParseOption): R {
    const target = {} as R

    // 支持getter/setter
    this.accessorEntries.forEach(([key, mapItem]) => {
      Object.defineProperty(target, key, { enumerable: true, ...mapItem, ...options?.propertyAttributes })
    })

    const handler = options?.handler || this.option.handler
    // 更新数据
    this[handler!](target, data, {
      skipNull: false,
      ...options,
    })

    // 模型设置
    Object.defineProperty(target, '$model', {
      value: this,
      enumerable: false,
      configurable: true,
    })

    return target
  }

  /**
   * 解析列表
   *
   * @param list 数据列表
   * @param options 操作选项
   * @returns
   */
  parseList (list: ModelData[], options?: ParseOption): D[] {
    if (!list || !list.length) return []
    return list.map((item) => this.parse(item, options))
  }

  /**
   * 更新数据（源数据字段名）
   *
   * @param target 数据源
   * @param data 更新数据
   * @param options 操作选项
   * @returns
   */
  update (target: ModelData, data: ModelData, options?: HandleOption): D {
    if (this.option.onBeforeUpdate) {
      data = this.option.onBeforeUpdate(target, data)
    }
    if (!data) data = {}
    this.mapEntries.forEach(([key, cfg]) => {
      this.setValue(target, key, data[cfg.key!], data, {
        ...options,
        handler: 'update',
      }, cfg)
    })
    this.option.onDataChange?.(data)
    return target as D
  }

  /**
   * 合并数据（模型属性名）
   *
   * @param target 数据源
   * @param data 更新数据
   * @param options 操作选项
   * @returns
   */
  merge (target: ModelData, data: ModelData, options?: HandleOption): D {
    if (!data) return target as D
    this.mapEntries.forEach(([key, cfg]) => {
      this.setValue(target, key, data[key], data, {
        ...options,
        handler: 'merge',
      }, cfg)
    })
    this.option.onDataChange?.(target, data)
    return target as D
  }

  /**
   * 设置属性（不局限于模型属性）
   *
   * @param target 数据源
   * @param data 更新数据
   * @param options 操作选项
   * @returns
   */
  attr (target: ModelData, data: ModelData, options?: HandleOption): D {
    if (!data) return target as D
    Object.keys(data).forEach((key) => {
      this.setValue(target, key, data[key], data, {
        ...options,
        handler: 'attr',
      })
    })
    this.option.onDataChange?.(data)
    return target as D
  }

  /**
   * 清空数据
   *
   * @param target 数据源
   * @param all 是否清除所有属性，包含非模型属性
   * @param useModel 是否使用模型进行重新赋值，默认false
   * @returns
   */
  clear (target: ModelData, all?: boolean, useModel?: boolean): D {
    const keys = all ? Object.keys(target) : this.mapKeys
    keys.forEach((key) => {
      const cfg = Object.getOwnPropertyDescriptor(target, key)
      if (cfg?.get && !cfg.set) return
      if (useModel) {
        this.setValue(target, key, undefined, {}, { skipNull: false })
      } else {
        target[key] = undefined
      }
    })
    this.option.onDataChange?.(target)
    return target as D
  }

  /**
   * 克隆(数据浅克隆)
   *
   * @param target 数据源
   * @param all 是否克隆所有数据，包含null
   * @returns
   */
  clone (target: ModelData, all?: boolean, linkMap = new WeakMap()): D {
    const linkInstance = linkMap.get(this)
    if (linkInstance) return linkInstance

    const model = (target.$model || this) as this
    const res = model.parse({}, model.option)
    const options: HandleOption = {
      skipNull: false,
      linkMap,
    }

    if (all) {
      this.attr(res, target, options)
    } else {
      this.merge(res, target, options)
    }

    return res as D
  }

  /**
   * 设置字段值
   * @param target 数据源
   * @param field 数据字段
   * @param value 字段值
   * @param data 数据对象
   * @param opt 赋值选项
   * @returns
   */
  // eslint-disable-next-line max-lines-per-function
  private setValue (target: ModelData, field: string, value?: any, data: ModelData = {}, opt?: HandleOption, cfg?: MapItem): D {
    opt = {
      skipNull: true,
      ...this.option,
      ...opt,
    } as HandleOption

    // 跳过null
    if (opt.skipNull && value == null) return target as D

    if (!cfg) cfg = (this.map[field] || {}) as MapItem

    // 类型检查
    const isDebug = opt.debug ?? (this.constructor as typeof Model).debug
    const isStrict = opt.strict ?? (this.constructor as typeof Model).strict

    if ((isDebug || isStrict) && cfg.model) {
      if (!checkType(cfg.model, value)) {
        const msg = `[modelize] Type mismatch for field "${field}": expected ${getTypeName(cfg.model)}, got ${Object.prototype.toString.call(value)}`
        if (isStrict) {
          throw new TypeError(msg)
        } else {
          console.warn(msg)
        }
      }
    }

    if (cfg.get && !cfg.set) return target as D
    // 配置数据解析，直接使用解析后数据
    if (cfg.parse) {
      target[field] = cfg.parse.call(target, value, data, field, cfg)
      return target as D
    }

    // 使用默认值
    if (value == null && (cfg.default != null || cfg.optional || !opt.parseToModel)) {
      if (typeof cfg.default === 'function') {
        value = cfg.default.call(target, field, value, data, cfg)
      } else {
        value = cfg.default
      }
      target[field] = value
      return target as D
    }

    target[field] = resolveSetValue(target, field, value, cfg, opt, (val) => val instanceof Model)
    return target as D
  }

  /**
   * 将field数据转为源数据接收格式
   * @param target 数据源
   * @param field 数据字段
   * @param value 数值，未传默认取当前实例中的field值
   * @returns 转换后的数据
   */
  private convertField (target: ModelData, field: string, value?: any, cfg: MapItem = this.map[field] as MapItem): any {
    if (value == null) value = target[field]

    if (cfg.convert != null) {
      if (!cfg.convert) return
      return cfg.convert.call(target, value, field, cfg)
    }

    const modelIsArray = Array.isArray(cfg.model)
    const model = (modelIsArray ? (cfg.model as ModelConstructor[])[0] : cfg.model) as ModelConstructor

    // 如果配置了optional，检查是否为空值
    if (cfg.optional && isEmptyValue(value, model, modelIsArray)) {
      return
    }

    return resolveConvertValue(value, cfg, !!this.option.convertToModel, (val) => val instanceof Model)
  }

  /**
   * 转换为源数据
   *
   * @param target 数据源
   * @param mergeData 合并数据
   * @returns
   */
  convert (target: ModelData, mergeData?: Partial<D>): S {
    const data = {} as any
    this.mapEntries.forEach(([k, cfg]) => {
      if (cfg.get && !cfg.key) return
      const key = cfg.key || k
      data[key] = this.convertField(target, k, mergeData?.[k as keyof D], cfg)
    })
    return data
  }

  /**
   * 转换为源数据，convert别名
   */
  toRaw = this.convert
  toDto = this.convert

  /**
   * 获取模型属性
   * @param target 数据源
   * @param keys 属性列表
   * @param toRaw 是否转换为源数据字段
   * @returns 选择后的对象
   */
  pick<K extends keyof D>(target: ModelData, keys: K[]): Pick<D, K>
  pick<K extends keyof D>(target: ModelData, keys: K[], toRaw: false): Pick<D, K>
  pick<K extends keyof T>(target: ModelData, keys: K[], toRaw: true): MapToResult<Pick<T, K>>
  pick<K extends keyof D> (target: ModelData, keys: K[], toRaw: boolean = false): any {
    const data = {} as any

    keys.forEach((key) => {
      const cfg = (this.map[key as string] || {}) as MapItem
      const k = toRaw ? cfg.key || key : key
      data[k] = toRaw ? this.convertField(target, key as string, undefined, cfg) : target[key as string]
    })

    return data
  }

  /**
   * 排除模型属性
   * @param target 数据源
   * @param keys 属性列表
   * @param toRaw 是否转换为源数据字段
   * @returns 选择后的对象
   */
  omit<K extends keyof D>(target: ModelData, keys: K[]): Omit<D, K>
  omit<K extends keyof D>(target: ModelData, keys: K[], toRaw: false): Omit<D, K>
  omit<K extends keyof T>(target: ModelData, keys: K[], toRaw: true): MapToResult<Omit<T, K>>
  omit<K extends keyof D> (target: ModelData, keys: K[], toRaw: boolean = false): any {
    const data = {} as any

    this.mapKeys.forEach((key) => {
      if (keys.includes(key as unknown as K)) return

      const cfg = (this.map[key] || {}) as MapItem
      if (cfg.get && !cfg.key) return
      const k = toRaw ? cfg.key || key : key
      data[k] = toRaw ? this.convertField(target, key as string, undefined, cfg) : target[key as string]
    })

    return data
  }

  // 枚举缓存
  private readonly $enum: Record<string, any> = {}
  /**
   * 获取枚举
   * @param field 枚举字段
   * @returns 返回枚举实例
   */
  enum<K extends keyof EnumKeys<T>> (field: K): ReturnEnum<EnumKeys<T>[K]> {
    const key = field as string
    if (this.$enum[key]) return this.$enum[key]
    const cfg = this.map[key] as MapItem

    if (typeof cfg === 'string' || !cfg.enum) return undefined as never

    const Enum = (this.constructor as typeof Model).Enum
    if (!Enum) {
      throw new Error('[modelize] Enum function not found. Please call Model.useEnum(Enum) first.')
    }

    this.$enum[key] = Enum(cfg.enum)
    return this.$enum[key]
  }
}

export default Model
