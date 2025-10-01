import { MapItem } from './types'
import { removeEmptyValues } from './utils'

type JSONOptions = {
  /** 是否清除空数据 */
  removeEmpty: boolean
  /** 递归，true = 不限制 */
  recursion?: boolean | number
}

export function JSONField<K extends string>(key: K, options?: JSONOptions): {
  key: K
  parse(val: Record<string, any> | string): any
  convert(val: Record<string, any>): string
}
export function JSONField<const M extends MapItem>(attrs: M, options?: JSONOptions): M & {
  parse(val: Record<string, any> | string): any
  convert(val: Record<string, any>): string
}
/**
 * 将字符串转为JSON对象
 * @param attrs 字段名/配置
 */
export function JSONField (attrs: string | MapItem, options?: JSONOptions) {
  if (typeof attrs === 'string') attrs = { key: attrs }
  return {
    parse (val: Record<string, any> | string, data: any, field: string): any {
      if (!val) {
        if (typeof attrs.default === 'function') {
          return attrs.default(attrs.key, val, data, field)
        }
        return attrs.default
      }
      if (typeof val !== 'string') val = JSON.stringify(val)
      return JSON.parse(val)
    },
    convert (val: Record<string, any>): string {
      if (!val) return ''
      if (typeof val === 'string') return val
      if (options?.removeEmpty) {
        val = removeEmptyValues(val, options.recursion)
      }
      return JSON.stringify(val)
    },
    ...attrs,
  }
}

export function splitField<K extends string>(key: K, splitter?: string): {
  key: K
  parse(val: string[] | string): string[]
  convert(val: string[] | string): string
}
export function splitField<const M extends MapItem>(attrs: MapItem, splitter?: string): M & {
  parse(val: string[] | string): string[]
  convert(val: string[] | string): string
}
/**
 * 将字符串转为数组
 * @param attrs 字段名/配置
 * @param splitter 分隔符
 */
export function splitField (attrs: string | MapItem, splitter: string = ', ') {
  if (typeof attrs === 'string') attrs = { key: attrs }
  return {
    parse (val: string[] | string): string[] {
      if (!val) return []
      if (Array.isArray(val)) return val
      return val.split(splitter.trim()).map(k => k.trim())
    },
    convert (val: string[] | string): string {
      if (!val || !val.length) return ''
      if (typeof val === 'string') return val
      return val.join(splitter)
    },
    ...attrs,
  }
}

export function bool2intField<K extends string>(key: K, splitter?: string): {
  key: K
  parse(val: boolean | number): boolean
  convert(val: boolean | number): 1 | 0
}
export function bool2intField<const M extends MapItem>(attrs: MapItem, splitter?: string): M & {
  parse(val: boolean | number): boolean
  convert(val: boolean | number): 1 | 0
}
/**
 * 将布尔值转为1/0
 * @param attrs 字段名/配置
 */
export function bool2intField (attrs: string | MapItem) {
  if (typeof attrs === 'string') attrs = { key: attrs }
  return {
    parse (v = attrs.default) {
      return !!v
    },
    convert (v: boolean | number) {
      return v ? 1 : 0
    },
    ...attrs,
  }
}
