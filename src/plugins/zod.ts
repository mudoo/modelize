/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Model } from '../model'
import { buildObjectSchema, validateTarget, validateSingleField, buildFormRules } from '../validate'
import type { FormRules, FormRulesOptions, ValidateOptions, ValidationResult } from '../validate'
import type { HandleOption, MapItem, ModelMap, MapToType, MapToResult, ModelData } from '../types'

declare module '../model' {
  interface Model<T extends ModelMap, D extends MapToType<T>, S extends MapToResult<T>> {
    /** schema 缓存 */
    $schema: any
    /**
     * 获取自动生成的 Zod object schema（需先调用 Model.usePlugin(ZodPlugin(z))）
     * @returns Zod object schema，未注册 Zod 时返回 undefined
     */
    readonly schema: any
    /**
     * 校验目标数据
     * @param target 待校验数据
     * @param options 校验选项
     * @returns 校验结果 { success, errors? }
     */
    validate (target: ModelData, options?: ValidateOptions): ValidationResult
    /**
     * 校验单个字段
     * @param target 待校验数据
     * @param field 字段名
     * @returns 校验结果 { success, errors? }
     */
    validateField (target: ModelData, field: string): ValidationResult
    /**
     * 生成表单校验规则（兼容 Element UI / Ant Design / Naive UI 等 async-validator 系框架）
     * @param options 规则生成选项
     * @returns 表单规则对象 { [field]: Rule[] }
     */
    toFormRules (options?: FormRulesOptions): FormRules
  }
}

/**
 * Zod 校验插件
 * @param z Zod 实例
 * @returns 插件函数
 */
export function ZodPlugin (z: any) {
  return (BaseModel: typeof Model) => {
    // 注入静态属性
    (BaseModel as any).Zod = z

    // 注册校验钩子，用于 setValue 中的自动校验
    if (!BaseModel.validators) {
      BaseModel.validators = []
    }

    BaseModel.validators.push(function (this: any, field: string, value: any, cfg: MapItem, opt: HandleOption) {
      if (!cfg.schema) return false // 没有 schema，不处理

      const Zod = (this.constructor as any).Zod
      if (Zod) {
        const result = cfg.schema.safeParse(value)
        if (!result.success) {
          const msg = `[modelize] Validation failed for field "${field}": ${result.error.issues[0]?.message}`
          const isStrict = opt.strict ?? (this.constructor as any).strict
          if (isStrict) {
            throw new TypeError(msg)
          } else {
            console.warn(msg)
          }
        }
        return true // 已处理校验
      } else {
        // 有 schema 但没注册 Zod，如果处于严格模式，应该报错提示
        const isStrict = opt.strict ?? (this.constructor as any).strict
        const isDebug = opt.debug ?? (this.constructor as any).debug
        if (isStrict || isDebug) {
          const msg = `[modelize] Validation failed for field "${field}": Zod is not registered. Call Model.usePlugin(ZodPlugin(z)) first.`
          if (isStrict) {
            throw new TypeError(msg)
          } else {
            console.warn(msg)
          }
          return true // 已处理（报错或警告）
        }
      }
      return false
    })

    // 注入 schema getter
    Object.defineProperty(BaseModel.prototype, 'schema', {
      get () {
        const Zod = (this.constructor as any).Zod
        if (!Zod) return undefined
        if (!this.$schema) {
          this.$schema = buildObjectSchema(this.map as Record<string, any>, {
            map: this.map as Record<string, any>,
            z: Zod,
            isModel: (val: any) => val instanceof BaseModel,
          })
        }
        return this.$schema
      },
      configurable: true,
      enumerable: false,
    })

    // 注入 validate 方法
    BaseModel.prototype.validate = function (target: any, options?: ValidateOptions): ValidationResult {
      const Zod = (this.constructor as any).Zod
      if (!Zod) {
        throw new Error('[modelize] validate() requires ZodPlugin. Call Model.usePlugin(ZodPlugin(z)) first.')
      }
      return validateTarget(target, {
        map: this.map as Record<string, any>,
        z: Zod,
        isModel: (val: any) => val instanceof BaseModel,
        schema: this.schema,
      }, options)
    }

    // 注入 validateField 方法
    BaseModel.prototype.validateField = function (target: any, field: string): ValidationResult {
      const Zod = (this.constructor as any).Zod
      if (!Zod) {
        throw new Error('[modelize] validateField() requires ZodPlugin. Call Model.usePlugin(ZodPlugin(z)) first.')
      }
      return validateSingleField(target, field, {
        map: this.map as Record<string, any>,
        z: Zod,
        isModel: (val: any) => val instanceof BaseModel,
        schema: this.schema,
      })
    }

    // 注入 toFormRules 方法
    BaseModel.prototype.toFormRules = function (options?: FormRulesOptions): FormRules {
      const Zod = (this.constructor as any).Zod
      return buildFormRules({
        map: this.map as Record<string, any>,
        z: Zod,
        isModel: (val: any) => val instanceof BaseModel,
        schema: this.schema,
      }, options)
    }
  }
}
