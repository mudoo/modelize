/**
 * 剔除对象中的空值（null、undefined、''）
 * @param target 源对象
 * @param recursive 递归，true = 不限制
 * @returns 新对象，剔除空值属性
 */
export function removeEmptyValues<T extends object> (target: T, recursive: boolean | number = false): Partial<T> {
  let depth = 0
  if (typeof recursive === 'boolean') {
    depth = recursive ? Infinity : 0
  } else if (typeof recursive === 'number' && recursive > 0) {
    depth = recursive
  }

  function remove (obj: any, currentDepth: number): any {
    const result: any = Array.isArray(obj) ? [] : {}
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      if (value != null && value !== '') {
        if (currentDepth > 0 && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const cleaned = remove(value, currentDepth - 1)
          if (Object.keys(cleaned).length > 0) {
            result[key] = cleaned
          }
        } else {
          result[key] = value
        }
      }
    }
    return result
  }
  return remove(target, depth)
}
