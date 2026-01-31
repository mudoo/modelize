import { ModelConstructor } from './types'

/** 允许的构造函数类型 */
export const Constructs: ModelConstructor[] = [String, Number, Boolean, Array, Object, Date]

// 验证是否Object
export function isObject (data: any): boolean {
  return Object.prototype.toString.call(data) === '[object Object]'
}

/**
 * 获取类型名称
 * @param model 模型定义
 * @returns 类型名称
 */
export function getTypeName (model: any): string {
  if (Array.isArray(model)) {
    return `Array<${getTypeName(model[0])}>`
  }
  // 检查是否为 Model 实例 (通过特征检查避免循环依赖)
  if (model && typeof model === 'object' && 'map' in model && 'parse' in model) {
    return 'Model'
  }
  if (typeof model === 'function') {
    return model.name || 'Unknown'
  }
  return String(model)
}

/**
 * 检查数据类型是否匹配
 * @param model 模型定义
 * @param value 数据值
 * @returns 是否匹配
 */
export function checkType (model: any, value: any): boolean {
  if (value == null) return true

  // 数组模型
  if (Array.isArray(model)) {
    return Array.isArray(value)
  }

  // 基础类型
  if (model === String) {
    return typeof value !== 'object'
  }

  if (model === Number) {
    if (typeof value === 'object') return false
    if (typeof value === 'string' && value.trim() === '') return true
    const num = Number(value)
    return !isNaN(num)
  }

  if (model === Boolean) {
    return typeof value !== 'object'
  }

  if (model === Date) {
    if (value instanceof Date) return true
    if (typeof value === 'object') return false
    const date = new Date(value)
    return !isNaN(date.getTime())
  }

  if (model === Array) {
    return Array.isArray(value)
  }

  if (model === Object) {
    return typeof value === 'object' && !Array.isArray(value)
  }

  // 模型实例 (通过特征检查避免循环依赖)
  if (model && typeof model === 'object' && 'map' in model && 'parse' in model) {
    return typeof value === 'object'
  }

  return true
}

/**
 * 判断值是否为空
 * @param value 值
 * @param model 模型类型
 * @param modelIsArray 是否为数组模型
 * @returns 是否为空
 */
export function isEmptyValue (value: any, model: ModelConstructor, modelIsArray: boolean): boolean {
  // null 或 undefined 视为空
  if (value == null) return true

  // 数组模型或 Array 类型：空数组视为空
  if (modelIsArray || model === Array) {
    return Array.isArray(value) && value.length === 0
  }

  // Object 类型：空对象视为空
  if (model === Object) {
    return typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
  }

  // String 类型：空字符串视为空
  if (model === String) {
    return value === ''
  }

  return false
}
