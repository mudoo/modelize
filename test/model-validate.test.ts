import Model from '../src/model'
import { ZodPlugin } from '../src/plugins/zod'
import * as assert from 'assert'
import { z } from 'zod'

describe('Model Validate (Zod Integration)', () => {
  before(() => {
    Model.usePlugin(ZodPlugin(z))
  })

  after(() => {
    (Model as any).Zod = undefined
  })

  describe('Model.usePlugin(ZodPlugin(z))', () => {
    it('should register Zod instance', () => {
      assert.strictEqual((Model as any).Zod, z)
    })
  })

  describe('Auto Schema Generation', () => {
    const TestModel = Model.define({
      name: String,
      age: Number,
      active: Boolean,
      birthday: Date,
      tags: [String],
      scores: [Number],
      info: Object,
    })

    it('should auto generate schema from map', () => {
      const schema = TestModel.schema
      assert.ok(schema)
    })

    it('should validate string field correctly', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: true, birthday: new Date(), tags: [], scores: [], info: {} })
      assert.strictEqual(result.success, true)
    })

    it('should fail when string field gets non-string', () => {
      const result = TestModel.validate({ name: 123, age: 1, active: true, birthday: new Date(), tags: [], scores: [], info: {} })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'name'))
    })

    it('should fail when number field gets non-number', () => {
      const result = TestModel.validate({ name: 'John', age: 'abc', active: true, birthday: new Date(), tags: [], scores: [], info: {} })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'age'))
    })

    it('should fail when boolean field gets non-boolean', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: 'yes', birthday: new Date(), tags: [], scores: [], info: {} })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'active'))
    })

    it('should coerce date from string', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: true, birthday: '2020-01-01', tags: [], scores: [], info: {} })
      assert.strictEqual(result.success, true)
    })

    it('should fail date for invalid string', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: true, birthday: 'invalid', tags: [], scores: [], info: {} })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'birthday'))
    })

    it('should validate array of strings', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: true, birthday: new Date(), tags: ['a', 'b'], scores: [1], info: {} })
      assert.strictEqual(result.success, true)
    })

    it('should fail when array element type mismatch', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: true, birthday: new Date(), tags: [1, 2], scores: [1], info: {} })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field.startsWith('tags')))
    })

    it('should fail when non-array provided for array field', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: true, birthday: new Date(), tags: 'not-array', scores: [1], info: {} })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'tags'))
    })

    it('should validate object field', () => {
      const result = TestModel.validate({ name: 'John', age: 1, active: true, birthday: new Date(), tags: [], scores: [], info: { key: 'value' } })
      assert.strictEqual(result.success, true)
    })
  })

  describe('Custom Schema Override', () => {
    const UserModel = Model.define({
      name: { model: String, schema: z.string().min(2).max(20) },
      email: { model: String, schema: z.string().email() },
      age: { model: Number, schema: z.number().min(0).max(150) },
    })

    it('should use custom schema for validation', () => {
      const result = UserModel.validate({ name: 'Jo', email: 'test@example.com', age: 25 })
      assert.strictEqual(result.success, true)
    })

    it('should fail custom schema: string too short', () => {
      const result = UserModel.validate({ name: 'J', email: 'test@example.com', age: 25 })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'name'))
    })

    it('should fail custom schema: invalid email', () => {
      const result = UserModel.validate({ name: 'John', email: 'not-email', age: 25 })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'email'))
    })

    it('should fail custom schema: number out of range', () => {
      const result = UserModel.validate({ name: 'John', email: 'test@test.com', age: -1 })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'age'))
    })

    it('should fail custom schema: age too large', () => {
      const result = UserModel.validate({ name: 'John', email: 'test@test.com', age: 200 })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'age'))
    })
  })

  describe('Optional Fields', () => {
    const OptModel = Model.define({
      name: String,
      nickname: { model: String, optional: true },
    })

    it('should pass when optional field is undefined', () => {
      const result = OptModel.validate({ name: 'John' })
      assert.strictEqual(result.success, true)
    })

    it('should pass when optional field is null', () => {
      const result = OptModel.validate({ name: 'John', nickname: null })
      assert.strictEqual(result.success, true)
    })

    it('should fail when required field is missing', () => {
      const result = OptModel.validate({})
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'name'))
    })
  })

  describe('validateField() - Single Field', () => {
    const TestModel = Model.define({
      name: String,
      email: { model: String, schema: z.string().email() },
      age: Number,
    })

    it('should validate a single field successfully', () => {
      const result = TestModel.validateField({ name: 'John', email: 'test@test.com', age: 1 }, 'email')
      assert.strictEqual(result.success, true)
    })

    it('should fail a single field validation', () => {
      const result = TestModel.validateField({ name: 'John', email: 'not-email', age: 1 }, 'email')
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field === 'email'))
    })

    it('should pass for field without model/schema', () => {
      const model = Model.define({ id: 'user_id', name: String })
      const result = model.validateField({ name: 'test' }, 'id')
      assert.strictEqual(result.success, true)
    })
  })

  describe('ValidateOptions', () => {
    const TestModel = Model.define({
      name: { model: String, schema: z.string().min(2) },
      email: { model: String, schema: z.string().email() },
      age: { model: Number, schema: z.number().min(0) },
    })

    it('should validate only specified fields', () => {
      const result = TestModel.validate(
        { name: 'J', email: 'bad', age: -1 },
        { fields: ['name'] },
      )
      assert.strictEqual(result.success, false)
      assert.strictEqual(result.errors!.length, 1)
      assert.strictEqual(result.errors![0].field, 'name')
    })

    it('should abort early on first error', () => {
      const result = TestModel.validate(
        { name: 'J', email: 'bad', age: -1 },
        { abortEarly: true },
      )
      assert.strictEqual(result.success, false)
      assert.strictEqual(result.errors!.length, 1)
    })
  })

  describe('Nested Model Validation', () => {
    const AddressModel = Model.define({
      city: String,
      zip: { model: String, schema: z.string().regex(/^\d{5,6}$/) },
    })

    const UserModel = Model.define({
      name: String,
      address: { model: AddressModel as any },
    })

    it('should validate nested model', () => {
      const result = UserModel.validate({ name: 'John', address: { city: 'NYC', zip: '12345' } })
      assert.strictEqual(result.success, true)
    })

    it('should fail on nested model validation error', () => {
      const result = UserModel.validate({ name: 'John', address: { city: 'NYC', zip: 'bad' } })
      assert.strictEqual(result.success, false)
      assert.ok(result.errors!.some(e => e.field.includes('zip')))
    })
  })

  describe('Schema Getter', () => {
    it('should return undefined when Zod is not registered', () => {
      const original = (Model as any).Zod
      ;(Model as any).Zod = undefined

      const TestModel = Model.define({ name: String })
      assert.strictEqual(TestModel.schema, undefined)

      ;(Model as any).Zod = original
    })

    it('should return a Zod schema when registered', () => {
      const TestModel = Model.define({ name: String })
      const schema = TestModel.schema
      assert.ok(schema)
      assert.ok(schema.safeParse)
    })

    it('should cache schema on second access', () => {
      const TestModel = Model.define({ name: String })
      const schema1 = TestModel.schema
      const schema2 = TestModel.schema
      assert.strictEqual(schema1, schema2)
    })
  })

  describe('Error when Zod not registered', () => {
    it('should throw when validate is called without Zod', () => {
      const original = (Model as any).Zod
      ;(Model as any).Zod = undefined

      const TestModel = Model.define({ name: String })
      assert.throws(() => {
        TestModel.validate({ name: 'test' })
      }, /requires ZodPlugin/)

      ;(Model as any).Zod = original
    })

    it('should throw when validateField is called without Zod', () => {
      const original = (Model as any).Zod
      ;(Model as any).Zod = undefined

      const TestModel = Model.define({ name: String })
      assert.throws(() => {
        TestModel.validateField({ name: 'test' }, 'name')
      }, /requires ZodPlugin/)

      ;(Model as any).Zod = original
    })
  })

  describe('Integration with Strict Mode (schema in setValue)', () => {
    afterEach(() => {
      Model.strict = false
      Model.debug = false
    })

    it('should throw in strict mode when field has schema and value fails validation', () => {
      Model.strict = true
      const TestModel = Model.define({
        email: { key: 'email', model: String, schema: z.string().email() },
      })
      assert.throws(() => {
        TestModel.parse({ email: 'not-email' })
      }, /Validation failed for field "email"/)
    })

    it('should warn in debug mode when field has schema and value fails validation', () => {
      Model.debug = true
      const warnMsgs: string[] = []
      const originalWarn = console.warn
      console.warn = (...args: any[]) => { warnMsgs.push(args.join(' ')) }

      const TestModel = Model.define({
        email: { key: 'email', model: String, schema: z.string().email() },
      })
      TestModel.parse({ email: 'not-email' })

      console.warn = originalWarn
      assert.ok(warnMsgs.some(msg => msg.includes('Validation failed for field "email"')))
    })

    it('should NOT throw when schema validation passes', () => {
      Model.strict = true
      const TestModel = Model.define({
        email: { key: 'email', model: String, schema: z.string().email() },
      })
      assert.doesNotThrow(() => {
        TestModel.parse({ email: 'valid@example.com' })
      })
    })

    it('should fallback to checkType when no schema defined', () => {
      Model.strict = true
      const TestModel = Model.define({
        name: String,
      })
      assert.throws(() => {
        TestModel.parse({ name: {} })
      }, /Type mismatch/)
    })
  })

  describe('Getter-only Fields', () => {
    it('should skip getter-only fields in validation', () => {
      const TestModel = Model.define({
        firstName: String,
        lastName: String,
        fullName: {
          get () { return (this as any).firstName + ' ' + (this as any).lastName },
        },
      })
      const result = TestModel.validate({ firstName: 'John', lastName: 'Doe' })
      assert.strictEqual(result.success, true)
    })
  })

  describe('Fields without model/schema', () => {
    it('should skip fields with only key mapping', () => {
      const TestModel = Model.define({
        id: 'user_id',
        name: String,
      })
      const result = TestModel.validate({ name: 'John' })
      assert.strictEqual(result.success, true)
    })
  })

  describe('toFormRules()', () => {
    const UserModel = Model.define({
      name: { model: String, schema: z.string().min(2).max(20) },
      email: { model: String, schema: z.string().email() },
      age: { model: Number, schema: z.number().min(0).max(150) },
      nickname: { model: String, optional: true },
      tags: { model: [String] },
    })

    it('should generate rules for all typed fields', () => {
      const rules = UserModel.toFormRules()
      assert.ok(rules.name)
      assert.ok(rules.email)
      assert.ok(rules.age)
      assert.ok(rules.nickname)
      assert.ok(rules.tags)
    })

    it('should add required rule for non-optional fields', () => {
      const rules = UserModel.toFormRules()
      assert.ok(rules.name.some(r => r.required === true))
      assert.ok(rules.email.some(r => r.required === true))
      assert.ok(rules.age.some(r => r.required === true))
    })

    it('should NOT add required rule for optional fields', () => {
      const rules = UserModel.toFormRules()
      assert.ok(!rules.nickname.some(r => r.required === true))
    })

    it('should add async-validator type rule', () => {
      const rules = UserModel.toFormRules()
      assert.ok(rules.name.some(r => r.type === 'string'))
      assert.ok(rules.age.some(r => r.type === 'number'))
      assert.ok(rules.tags.some(r => r.type === 'array'))
    })

    it('should add zod validator function', () => {
      const rules = UserModel.toFormRules()
      assert.ok(rules.email.some(r => typeof r.validator === 'function'))
    })

    it('zod validator should pass for valid value', (done) => {
      const rules = UserModel.toFormRules()
      const zodRule = rules.email.find(r => typeof r.validator === 'function')!
      zodRule.validator!({}, 'test@example.com', (err?: string | Error) => {
        assert.strictEqual(err, undefined)
        done()
      })
    })

    it('zod validator should fail for invalid value', (done) => {
      const rules = UserModel.toFormRules()
      const zodRule = rules.email.find(r => typeof r.validator === 'function')!
      zodRule.validator!({}, 'not-email', (err?: string | Error) => {
        assert.ok(err instanceof Error)
        done()
      })
    })

    it('zod validator should pass for optional field with null', (done) => {
      const rules = UserModel.toFormRules()
      const zodRule = rules.nickname.find(r => typeof r.validator === 'function')!
      zodRule.validator!({}, null, (err?: string | Error) => {
        assert.strictEqual(err, undefined)
        done()
      })
    })

    it('should use custom trigger', () => {
      const rules = UserModel.toFormRules({ trigger: 'change' })
      assert.ok(rules.name.some(r => r.trigger === 'change'))
    })

    it('should use custom requiredMessage string', () => {
      const rules = UserModel.toFormRules({ requiredMessage: '{field}不能为空' })
      const reqRule = rules.name.find(r => r.required === true)!
      assert.strictEqual(reqRule.message, 'name不能为空')
    })

    it('should use custom requiredMessage function', () => {
      const rules = UserModel.toFormRules({ requiredMessage: (f) => `请输入${f}` })
      const reqRule = rules.name.find(r => r.required === true)!
      assert.strictEqual(reqRule.message, '请输入name')
    })

    it('should filter fields via options.fields', () => {
      const rules = UserModel.toFormRules({ fields: ['name', 'email'] })
      assert.ok(rules.name)
      assert.ok(rules.email)
      assert.strictEqual(rules.age, undefined)
      assert.strictEqual(rules.nickname, undefined)
    })

    it('should skip getter-only fields', () => {
      const TestModel = Model.define({
        firstName: String,
        fullName: {
          get () { return (this as any).firstName },
        },
      })
      const rules = TestModel.toFormRules()
      assert.ok(rules.firstName)
      assert.strictEqual(rules.fullName, undefined)
    })

    it('should skip fields without model/schema', () => {
      const TestModel = Model.define({
        id: 'user_id',
        name: String,
      })
      const rules = TestModel.toFormRules()
      assert.ok(rules.name)
      assert.strictEqual(rules.id, undefined)
    })

    it('should work without Zod registered (basic rules only)', () => {
      const original = (Model as any).Zod
      ;(Model as any).Zod = undefined

      const TestModel = Model.define({ name: String, age: { model: Number, optional: true } })
      const rules = TestModel.toFormRules()

      assert.ok(rules.name.some(r => r.required === true))
      assert.ok(rules.name.some(r => r.type === 'string'))
      assert.ok(!rules.name.some(r => typeof r.validator === 'function'))
      assert.ok(!rules.age.some(r => r.required === true))

      ;(Model as any).Zod = original
    })
  })
})
