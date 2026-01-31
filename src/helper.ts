import type {
  ModelOption,
  ModelMap,
  NormalizedMap,
  MapItem,
  ModelConstructor,
  HandleOption,
} from './types'
import { Constructs, isObject } from './check'

/**
 * 解析模型配置选项
 * @param options 配置选项
 * @returns 标准化后的配置
 */
export function parseModelOptions (options?: ModelOption): ModelOption {
  const opt: ModelOption = Object.assign(
    {
      parseToModel: true,
      handler: 'update',
    },
    options,
  )

  const handlers = ['update', 'merge', 'attr']
  if (!opt.handler || !handlers.includes(opt.handler)) opt.handler = 'update'

  return opt
}

/**
 * 解析并标准化模型映射定义
 * @param map 模型映射定义
 * @param isModel 检查是否为模型实例的函数，避免循环依赖
 * @returns 标准化后的映射
 */
export function parseModelMap<M extends ModelMap> (
  map: M,
  isModel: (val: any) => boolean,
): NormalizedMap<M> {
  const res = Object.assign({}, map) as any

  Object.keys(res).forEach((key) => {
    let mapItem = res[key] as MapItem
    const type = typeof mapItem

    if (type === 'string' || type === 'number') {
      mapItem = {
        key: mapItem as unknown as string,
      } as MapItem
      res[key] = mapItem
    } else if (
      Array.isArray(mapItem) ||
      type === 'function' ||
      Constructs.includes(mapItem as ModelConstructor) ||
      isModel(mapItem)
    ) {
      mapItem = {
        key,
        model: mapItem,
      } as MapItem
      res[key] = mapItem
    }

    if (!mapItem.key && !mapItem.get) {
      mapItem.key = key
    }
  })

  return res
}

/**
 * 将原始值解析为指定模型构造函数对应的模型值
 * @param model 构造函数
 * @param value 原始值
 * @returns 解析后的值
 */
export function parseValueToModel (model: ModelConstructor, value: any): any {
  let result = value
  switch (model) {
    case Array:
      result = value && Array.isArray(value) ? value.slice() : []
      break
    case Object:
      result = value && isObject(value) ? { ...value } : {}
      break
    case String:
      result = String(value ?? '')
      break
    case Number:
      result = parseFloat(value)
      if (isNaN(result)) result = 0
      break
    case Boolean:
      result = String(value) === 'true' || String(value) === '1'
      break
    case Date:
      if (/^\d+$/.test(String(value))) {
        result = new Date(parseInt(value))
      } else {
        result = new Date(value || undefined)
      }
      break
  }

  return result
}

/**
 * 创建继承/摘选后的模型实例辅助函数
 */
export function createExtendedModel (
  ModelClass: any,
  originalMap: any,
  originalOption: any,
  config: {
    type: 'extends' | 'pick' | 'omit'
    keys?: any[] | any
    map?: any
    opt?: any
  },
): any {
  const { type, keys, map, opt } = config
  let newMap: any = {}

  if (type === 'extends') {
    newMap = { ...originalMap, ...map }
  } else if (type === 'pick') {
    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        if (key in originalMap) {
          newMap[key] = originalMap[key]
        }
      })
    }
    newMap = { ...newMap, ...map }
  } else if (type === 'omit') {
    newMap = { ...originalMap }
    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        delete newMap[key]
      })
    } else if (keys) {
      delete newMap[keys]
    }
    newMap = { ...newMap, ...map }
  }

  return new ModelClass(newMap, { ...originalOption, ...opt })
}

/**
 * 核心转换逻辑辅助函数（从 convertField 抽离）
 */
export function resolveConvertValue (
  value: any,
  cfg: MapItem,
  convertToModel: boolean,
  isModel: (val: any) => boolean,
): any {
  const modelIsArray = Array.isArray(cfg.model)
  const model = (modelIsArray ? (cfg.model as ModelConstructor[])[0] : cfg.model) as ModelConstructor
  const isModelVal = model && isModel(model)

  if (!modelIsArray) {
    if (value && isModelVal) {
      return (model as any).toRaw(value)
    }
    return convertToModel ? parseValueToModel(model, value) : value
  }

  const list = Array.isArray(value) ? value : (value == null ? [] : [value])
  return list.map((item: any) => {
    if (item && isModelVal) {
      return (model as any).toRaw(item)
    }
    return convertToModel ? parseValueToModel(model, item) : item
  })
}

/**
 * 核心解析逻辑辅助函数（从 setValue 抽离）
 */
export function resolveSetValue (
  target: any,
  field: string,
  value: any,
  cfg: MapItem,
  opt: HandleOption,
  isModel: (val: any) => boolean,
): any {
  const model = cfg.model as ModelConstructor

  if (!model) return value

  if (Constructs.includes(model)) {
    return parseValueToModel(model, value)
  }

  const isModelVal = isModel(model)
  const modelIsArray = Array.isArray(cfg.model)

  if (Array.isArray(value) || modelIsArray) {
    if (value == null) {
      return []
    }
    const list = Array.isArray(value) ? value : [value]
    const aryModel = modelIsArray ? (cfg.model as ModelConstructor[])[0] : model
    if (aryModel && isModel(aryModel)) {
      return (aryModel as any).parseList(list, opt)
    }
    return list.map((v: any) => parseValueToModel(aryModel, v))
  }

  if (isObject(value) || isObject(model) || isModelVal) {
    if (value && value.$model && isModel(value.$model)) {
      return value.$model.clone(value, true, opt.linkMap)
    }
    if (isModelVal) {
      if (target[field]?.$model === model) {
        return (model as any)[opt.handler!](target[field], value, opt)
      }
      return (model as any).parse(value, opt)
    }
    return Object.assign({}, value)
  }

  return value
}
