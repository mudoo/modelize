import Model from '../src/model'
import test from './test'

// 单元测试
const testRules = {
  // 枚举
  enum: [{
    title: 'string number boolean',
    handler () {
      const ExtendedUser = Model.define({
        testEnum: {
          key: 'test_enum',
          enum: {
            a: 'a1',
            b: 1,
            c: { value: true },
            d: { value: false },
          },
        },
      })

      const data = ExtendedUser.enum('testEnum')
      return (
        data.a === 'a1' && data.label('a') === 'a' && data.label('a1') === 'a' &&
        data.b === 1 && data.label('b') === 'b' && data.label(1) === 'b' &&
        data.c === true && data.label('c') === 'c' && data.label(true) === 'c' &&
        data.d === false && data.label('d') === 'd' && data.label(false) === 'd'
      )
    },
    result: true,
  }, {
    title: 'object enum',
    handler () {
      const ExtendedUser = Model.define({
        testEnum: {
          key: 'test_enum',
          enum: {
            a: {
              value: 'a1',
              label: 'A',
            },
            b: {
              value: 1,
              label: 'B',
            },
            c: {
              value: true,
              label: 'C',
            },
            d: {
              value: false,
              label: 'D',
            },
          },
        },
      })

      const data = ExtendedUser.enum('testEnum')
      return (
        data.a === 'a1' && data.label('a') === 'A' && data.label('a1') === 'A' &&
        data.b === 1 && data.label('b') === 'B' && data.label(1) === 'B' &&
        data.c === true && data.label('c') === 'C' && data.label(true) === 'C' &&
        data.d === false && data.label('d') === 'D' && data.label(false) === 'D'
      )
    },
    result: true,
  }, {
    title: 'array enum',
    handler: () => {
      const ExtendedUser = Model.define({
        testEnum: {
          key: 'test_enum',
          enum: [
            { key: 'a', value: 'a1', label: 'A' },
            { key: 'b', value: 1, label: 'B' },
            { key: 'c', value: true, label: 'C' },
            { key: 'd', value: false, label: 'D' },
          ],
        },
      })

      const data = ExtendedUser.enum('testEnum')
      return (
        data.a === 'a1' && data.label('a') === 'A' && data.label('a1') === 'A' &&
        data.b === 1 && data.label('b') === 'B' && data.label(1) === 'B' &&
        data.c === true && data.label('c') === 'C' && data.label(true) === 'C' &&
        data.d === false && data.label('d') === 'D' && data.label(false) === 'D'
      )
    },
  }],
}

describe('Enum', test(testRules))
