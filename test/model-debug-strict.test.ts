import Model from '../src/model'
import * as assert from 'assert'

describe('Model Debug and Strict Mode', () => {
  const TestModel = Model.define({
    name: String,
    age: Number,
    isStudent: Boolean,
    birthday: Date,
    tags: [String],
    info: Object,
  })

  describe('Debug Mode', () => {
    let warnMsgs: string[] = []
    const originalWarn = console.warn

    beforeEach(() => {
      warnMsgs = []
      console.warn = (...args: any[]) => {
        warnMsgs.push(args.join(' '))
      }
    })

    afterEach(() => {
      console.warn = originalWarn
      Model.debug = false
    })

    it('should warn when type mismatches in global debug mode', () => {
      Model.debug = true
      TestModel.parse({ name: { first: 'John' } })
      assert.ok(warnMsgs.some(msg => msg.includes('[modelize] Type mismatch for field "name"')))
    })

    it('should warn when type mismatches in option debug mode', () => {
      const model = Model.define({ name: String }, { debug: true })
      model.parse({ name: [] })
      assert.ok(warnMsgs.some(msg => msg.includes('[modelize] Type mismatch for field "name"')))
    })

    it('should NOT warn when type matches', () => {
      Model.debug = true
      TestModel.parse({ name: 'John', age: 20 })
      assert.strictEqual(warnMsgs.length, 0)
    })

    it('should NOT warn when value is null/undefined', () => {
      Model.debug = true
      TestModel.parse({ name: null })
      assert.strictEqual(warnMsgs.length, 0)
    })

    it('should warn for serious mismatch: Number expected, got Object', () => {
      Model.debug = true
      TestModel.parse({ age: {} })
      assert.ok(warnMsgs.some(msg => msg.includes('expected Number, got [object Object]')))
    })

    it('should warn for serious mismatch: Array expected, got String', () => {
      Model.debug = true
      TestModel.parse({ tags: 'not-an-array' })
      assert.ok(warnMsgs.some(msg => msg.includes('expected Array<String>, got [object String]')))
    })
  })

  describe('Strict Mode', () => {
    afterEach(() => {
      Model.strict = false
    })

    it('should throw error when type mismatches in global strict mode', () => {
      Model.strict = true
      assert.throws(() => {
        TestModel.parse({ name: {} })
      }, TypeError)
    })

    it('should throw error when type mismatches in option strict mode', () => {
      const model = Model.define({ name: String }, { strict: true })
      assert.throws(() => {
        model.parse({ name: [] })
      }, TypeError)
    })

    it('should throw error for invalid number string in strict mode', () => {
      Model.strict = true
      assert.throws(() => {
        TestModel.parse({ age: 'abc' })
      }, /expected Number/)
    })

    it('should throw error for invalid date string in strict mode', () => {
      Model.strict = true
      assert.throws(() => {
        TestModel.parse({ birthday: 'invalid-date' })
      }, /expected Date/)
    })

    it('should NOT throw error when type matches', () => {
      Model.strict = true
      assert.doesNotThrow(() => {
        TestModel.parse({ name: 'John', age: '20' }) // age '20' is convertible
      })
    })
  })
})
