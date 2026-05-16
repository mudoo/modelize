import type { MapItem } from './types'

/**
 * 校验选项
 */
export interface ValidateOptions {
  /** 仅校验指定字段 */
  fields?: string[]
  /** 遇到首个错误即终止，默认 false */
  abortEarly?: boolean
}

/**
 * 字段校验错误
 */
export interface FieldError {
  /** 模型字段名 */
  field: string
  /** 错误信息 */
  message: string
  /** 期望的约束描述 */
  expected?: string
  /** 实际接收到的值 */
  received?: any
  /** Zod issue code */
  code?: string
}

/**
 * 校验结果
 */
export interface ValidationResult {
  success: boolean
  errors?: FieldError[]
}

/**
 * 表单规则项（兼容 Element UI / Ant Design / Naive UI 等 async-validator 系框架）
 */
export interface FormRuleItem {
  required?: boolean
  message?: string
  trigger?: string | string[]
  type?: string
  validator?: (rule: any, value: any, callback: (error?: string | Error) => void) => void | Promise<void>
}

/**
 * 表单规则集合
 */
export type FormRules = Record<string, FormRuleItem[]>

/**
 * toFormRules 选项
 */
export interface FormRulesOptions {
  /** 触发方式，默认 'blur' */
  trigger?: string | string[]
  /** 自定义 required 提示模板，{field} 会被替换为字段名 */
  requiredMessage?: string | ((field: string) => string)
  /** 仅生成指定字段的规则 */
  fields?: string[]
}

type IsModelFn = (val: any) => boolean

/**
 * 校验上下文接口
 */
export interface ValidationContext {
  map: Record<string, any>
  z: any
  isModel: IsModelFn
  visited?: WeakSet<any>
  schema?: any
}

/**
 * 根据单个字段配置构建 Zod schema
 */
export function buildFieldSchema (cfg: MapItem, ctx: ValidationContext): any {
  // 优先使用自定义 schema
  if (cfg.schema) return cfg.schema

  const { z, isModel } = ctx
  const model = cfg.model
  if (!model) return z.any()

  let schema: any

  // 数组类型: [String], [Number], [Model] 等
  if (Array.isArray(model)) {
    const innerModel = model[0]
    if (innerModel) {
      const innerSchema = buildFieldSchema({ model: innerModel } as MapItem, ctx)
      schema = z.array(innerSchema)
    } else {
      schema = z.array(z.any())
    }
  } else if (model === String) {
    schema = z.string()
  } else if (model === Number) {
    schema = z.number()
  } else if (model === Boolean) {
    schema = z.boolean()
  } else if (model === Date) {
    schema = z.coerce.date()
  } else if (model === Array) {
    schema = z.array(z.any())
  } else if (model === Object) {
    schema = z.record(z.string(), z.any())
  } else if (isModel(model)) {
    // 嵌套 Model 实例
    schema = buildObjectSchema((model as any).map, ctx)
  } else {
    schema = z.any()
  }

  // optional 处理
  if (cfg.optional) {
    schema = schema.optional().nullable()
  }

  return schema
}

/**
 * 根据整个 map 构建 Zod object schema
 */
export function buildObjectSchema (map: Record<string, any>, ctx: ValidationContext): any {
  const { z, visited: parentVisited } = ctx
  const visited = parentVisited || new WeakSet()
  const subCtx = { ...ctx, visited }

  // 循环引用检测
  if (map && typeof map === 'object') {
    if (visited.has(map)) return z.any()
    visited.add(map)
  }

  const shape: Record<string, any> = {}

  for (const field in map) {
    const cfg = map[field] as MapItem
    if (!cfg || typeof cfg !== 'object') continue

    // 跳过 getter-only 字段（计算属性）
    if (cfg.get && !cfg.set) continue

    // 跳过仅有 key 的映射字段（无类型约束）
    if (!cfg.model && !cfg.schema) continue

    shape[field] = buildFieldSchema(cfg, subCtx)
  }

  return z.object(shape).passthrough()
}

/**
 * 格式化 Zod 错误为 FieldError[]
 */
export function formatZodErrors (zodError: any): FieldError[] {
  const errors: FieldError[] = []

  for (const issue of zodError.issues) {
    const path = issue.path
    const field = path.length > 0
      ? path.map((p: any, i: number) => typeof p === 'number' ? `[${p}]` : (i > 0 ? `.${p}` : p)).join('')
      : 'unknown'

    errors.push({
      field,
      message: issue.message,
      expected: issue.expected,
      received: issue.received,
      code: issue.code,
    })
  }

  return errors
}

/**
 * 执行整体校验
 */
export function validateTarget (
  target: any,
  ctx: ValidationContext,
  options?: ValidateOptions,
): ValidationResult {
  const { map, schema } = ctx
  const objectSchema = schema || buildObjectSchema(map, ctx)

  // 如果指定了 fields，只校验指定字段
  if (options?.fields && options.fields.length > 0) {
    const results: FieldError[] = []
    for (const field of options.fields) {
      const fieldResult = validateSingleField(target, field, ctx, objectSchema)
      if (!fieldResult.success && fieldResult.errors) {
        results.push(...fieldResult.errors)
        if (options.abortEarly) {
          return { success: false, errors: results }
        }
      }
    }
    return results.length > 0
      ? { success: false, errors: results }
      : { success: true }
  }

  // 全量校验
  if (options?.abortEarly) {
    const result = objectSchema.safeParse(target)
    if (result.success) return { success: true }
    // abortEarly: 只返回第一个错误
    const firstIssue = result.error.issues[0]
    if (!firstIssue) return { success: false, errors: [] }
    return { success: false, errors: formatZodErrors({ issues: [firstIssue] }) }
  }

  const result = objectSchema.safeParse(target)
  if (result.success) return { success: true }
  return { success: false, errors: formatZodErrors(result.error) }
}

/**
 * 单字段校验
 */
export function validateSingleField (
  target: any,
  field: string,
  ctx: ValidationContext,
  schema?: any,
): ValidationResult {
  const { map, schema: ctxSchema } = ctx
  const cfg = map[field] as MapItem
  if (!cfg || typeof cfg !== 'object') {
    return { success: true }
  }

  if (!cfg.model && !cfg.schema) {
    return { success: true }
  }

  const currentSchema = schema || ctxSchema
  const fieldSchema = currentSchema?.shape?.[field] || buildFieldSchema(cfg, ctx)
  const value = target?.[field]
  const result = fieldSchema.safeParse(value)

  if (result.success) return { success: true }

  const errors = formatZodErrors(result.error).map(err => ({
    ...err,
    field, // 确保 field 名为模型字段名
  }))

  return { success: false, errors }
}

/**
 * 根据 model map 生成表单校验规则（兼容 Element UI / Ant Design / Naive UI 等 async-validator 系框架）
 */
export function buildFormRules (
  ctx: ValidationContext,
  options?: FormRulesOptions,
): FormRules {
  const { map, z, schema } = ctx
  const rules: FormRules = {}
  const trigger = options?.trigger ?? 'blur'
  const filterFields = options?.fields

  for (const field in map) {
    if (filterFields && !filterFields.includes(field)) continue

    const cfg = map[field] as MapItem
    if (!cfg || typeof cfg !== 'object') continue
    if (cfg.get && !cfg.set) continue
    if (!cfg.model && !cfg.schema) continue

    const fieldRules: FormRuleItem[] = []

    // required 规则
    if (!cfg.optional) {
      let message: string
      if (options?.requiredMessage) {
        message = typeof options.requiredMessage === 'function'
          ? options.requiredMessage(field)
          : options.requiredMessage.replace('{field}', field)
      } else {
        message = `${field} is required`
      }
      fieldRules.push({ required: true, message, trigger })
    }

    // 基础 type 规则（async-validator 内置类型）
    const typeRule = getAsyncValidatorType(cfg)
    if (typeRule) {
      fieldRules.push({ type: typeRule, message: `${field} must be a valid ${typeRule}`, trigger })
    }

    // Zod schema 自定义 validator
    if (z && (cfg.schema || cfg.model)) {
      const fieldSchema = schema?.shape?.[field] || buildFieldSchema(cfg, ctx)
      fieldRules.push({
        trigger,
        validator (_rule: any, value: any, callback: (error?: string | Error) => void) {
          // optional 字段允许空值通过
          if (cfg.optional && (value == null || value === '')) {
            callback()
            return
          }
          const result = fieldSchema.safeParse(value)
          if (result.success) {
            callback()
          } else {
            callback(new Error(result.error.issues[0]?.message || `${field} validation failed`))
          }
        },
      })
    }

    if (fieldRules.length > 0) {
      rules[field] = fieldRules
    }
  }

  return rules
}

/**
 * 推断 async-validator 内置类型
 */
function getAsyncValidatorType (cfg: MapItem): string | undefined {
  const model = cfg.model
  if (!model) return undefined
  if (Array.isArray(model)) return 'array'
  if (model === String) return 'string'
  if (model === Number) return 'number'
  if (model === Boolean) return 'boolean'
  if (model === Date) return 'date'
  if (model === Array) return 'array'
  if (model === Object) return 'object'
  return undefined
}
