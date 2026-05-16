import { Enum } from 'enum-plus'
import { $td } from './enum'
import Model from '../src/model'
import test from './test'
import { UserModel } from './test-data'
import { EnumPlugin } from 'src'

Model.usePlugin(EnumPlugin(Enum))

// 单元测试
const testRules = {
  // 枚举
  enum: [{
    title: 'string number boolean',
    handler () {
      const TestEnum = Model.define({
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

      type TestEnumVO = typeof TestEnum.type
      const test: TestEnumVO['testEnum'] = 'a1'

      const testEnum = TestEnum.enum('testEnum')
      return (
        test === 'a1' &&
        testEnum.a === 'a1' && testEnum.label('a') === 'a' && testEnum.label('a1') === 'a' &&
        testEnum.b === 1 && testEnum.label('b') === 'b' && testEnum.label(1) === 'b' &&
        testEnum.c === true && testEnum.label('c') === 'c' && testEnum.label(true) === 'c' &&
        testEnum.d === false && testEnum.label('d') === 'd' && testEnum.label(false) === 'd'
      )
    },
    result: true,
  }, {
    title: 'object enum',
    handler () {
      const TestEnum = UserModel.extends({
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

      type TestEnumVO = typeof TestEnum.type
      const test: TestEnumVO['testEnum'] = 'a1'

      const testEnum = TestEnum.enum('testEnum')
      return (
        test === 'a1' &&
        testEnum.a === 'a1' && testEnum.label('a') === 'A' && testEnum.label('a1') === 'A' &&
        testEnum.b === 1 && testEnum.label('b') === 'B' && testEnum.label(1) === 'B' &&
        testEnum.c === true && testEnum.label('c') === 'C' && testEnum.label(true) === 'C' &&
        testEnum.d === false && testEnum.label('d') === 'D' && testEnum.label(false) === 'D'
      )
    },
    result: true,
  }, {
    title: 'array enum',
    handler: () => {
      const TestEnum = Model.define({
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

      type TestEnumVO = typeof TestEnum.type
      const test: TestEnumVO['testEnum'] = 'a1'

      const testEnum = TestEnum.enum('testEnum')
      return (
        test === 'a1' &&
        testEnum.a === 'a1' && testEnum.label('a') === 'A' && testEnum.label('a1') === 'A' &&
        testEnum.b === 1 && testEnum.label('b') === 'B' && testEnum.label(1) === 'B' &&
        testEnum.c === true && testEnum.label('c') === 'C' && testEnum.label(true) === 'C' &&
        testEnum.d === false && testEnum.label('d') === 'D' && testEnum.label(false) === 'D'
      )
    },
  }, {
    title: 'enum custom label',
    handler: () => {
      const TestEnum = Model.define({
        testEnum: {
          key: 'test_enum',
          enum: {
            a: { value: 'a1', label: $td('A') },
            b: { value: 1, label: $td('B') },
            c: { value: true, label: $td('C') },
            d: { value: false, label: $td('D') },
          },
        },
      })

      type TestEnumVO = typeof TestEnum.type
      const test: TestEnumVO['testEnum'] = 'a1'

      const testEnum = TestEnum.enum('testEnum')
      return (
        test === 'a1' &&
        testEnum.a === 'a1' && testEnum.label('a') === 'A' && testEnum.label('a1') === 'A' &&
        testEnum.b === 1 && testEnum.label('b') === 'B' && testEnum.label(1) === 'B' &&
        testEnum.c === true && testEnum.label('c') === 'C' && testEnum.label(true) === 'C' &&
        testEnum.d === false && testEnum.label('d') === 'D' && testEnum.label(false) === 'D'
      )
    },
  }],
}

describe('Enum', test(testRules))
