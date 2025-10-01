import { Model, bool2intField, JSONField, splitField } from '../src'
import test from './test'

// 单元测试
const testRules = {
  // 扩展字段转换测试
  JSONField: [
    {
      title: 'JSONField parse string',
      handler () {
        const TestModel = Model.define({
          cc: 'cc',
          config: JSONField('user_config'),
          config2: JSONField({ key: 'user_config2' }),
        })
        const sourceConfig = '{"theme":"dark","notifications":true}'
        const data = TestModel.parse({
          user_config: sourceConfig,
          user_config2: sourceConfig,
        })
        const dto = TestModel.toServer(data)

        return (
          data.config.theme === 'dark' &&
          data.config.notifications === true &&
          data.config2.notifications === true &&
          data.config2.notifications === true &&
          dto.user_config === sourceConfig &&
          dto.user_config2 === sourceConfig
        )
      },
      result: true,
    },
    {
      title: 'JSONField parse object',
      handler () {
        const TestModel = Model.define({
          config: JSONField('user_config'),
        })
        const sourceConfig = { theme: 'light', notifications: false }
        const data = TestModel.parse({
          user_config: sourceConfig,
        })
        const dto = TestModel.toServer(data)

        return (
          data.config.theme === 'light' &&
          data.config.notifications === false &&
          dto.user_config === JSON.stringify(sourceConfig)
        )
      },
      result: true,
    },
    {
      title: 'JSONField parse array',
      handler () {
        const TestModel = Model.define({
          config: JSONField('user_config'),
        })
        const sourceConfig = ['theme', 'notifications']
        const data = TestModel.parse({
          user_config: sourceConfig,
        })
        const dto = TestModel.toServer(data)

        return (
          Array.isArray(data.config) &&
          data.config.length === 2 &&
          data.config[0] === 'theme' &&
          data.config[1] === 'notifications' &&
          dto.user_config === JSON.stringify(sourceConfig)
        )
      },
      result: true,
    },
    {
      title: 'JSONField removeEmptyValues',
      handler () {
        const TestModel = Model.define({
          config: JSONField('user_config', {
            removeEmpty: true,
            recursion: true,
          }),
        })
        const sourceData = {
          a: 1,
          b: null,
          c: undefined,
          d: 0,
          e: '',
          f: false,
          g: true,
          h: {
            i: 1,
            j: null,
            k: undefined,
            l: 0,
            m: '',
            n: false,
            o: true,
            p: {
              q: 1,
              r: null,
              s: undefined,
              t: 0,
              u: '',
              v: false,
              w: true,
            },
          },
        }
        const data = TestModel.parse({
          user_config: sourceData,
        })
        const dto = TestModel.toServer(data)

        return (
          data.config.a === 1 && data.config.d === 0 && data.config.e === '' &&
          data.config.h.i === 1 && data.config.h.p.q === 1 &&
          data.config.h.j === null && data.config.h.p.u === '' &&
          dto.user_config === '{"a":1,"d":0,"f":false,"g":true,"h":{"i":1,"l":0,"n":false,"o":true,"p":{"q":1,"t":0,"v":false,"w":true}}}'
        )
      },
      result: true,
    },
  ],
  splitField: [
    {
      title: 'splitField parse string',
      handler () {
        const TestModel = Model.define({
          tags: splitField('user_tags'),
          tags2: splitField('user_tags2'),
        })
        const sourceTags = 'tag1, tag2, tag3'
        const data = TestModel.parse({
          user_tags: sourceTags,
          user_tags2: sourceTags,
        })
        const dto = TestModel.toServer(data)

        return (
          Array.isArray(data.tags) &&
          data.tags.length === 3 &&
          data.tags[0] === 'tag1' &&
          dto.user_tags === sourceTags
        )
      },
      result: true,
    },
    {
      title: 'splitField parse array',
      handler () {
        const TestModel = Model.define({
          tags: splitField('user_tags'),
        })
        const sourceTags = ['tag1', 'tag2', 'tag3']
        const data = TestModel.parse({
          user_tags: sourceTags,
        })
        const dto = TestModel.toServer(data)

        return (
          Array.isArray(data.tags) &&
          data.tags.length === 3 &&
          data.tags[0] === 'tag1' &&
          dto.user_tags === sourceTags.join(', ')
        )
      },
      result: true,
    },
  ],
  bool2intField: [
    {
      title: 'bool2intField parse',
      handler () {
        const TestModel = Model.define({
          isActive: bool2intField('is_active'),
          isActive2: bool2intField('is_active2'),
        })
        const data = TestModel.parse({
          is_active: 1,
          is_active2: true,
        })
        return data.isActive === true && data.isActive2 === true
      },
      result: true,
    },
    {
      title: 'bool2intField convert',
      handler () {
        const TestModel = Model.define({
          isActive: bool2intField('is_active'),
          isActive2: bool2intField('is_active2'),
        })
        const data = TestModel.parse({
          is_active: 1,
          is_active2: true,
        })
        const dto = TestModel.toServer(data)
        return dto.is_active === 1 && dto.is_active2 === 1
      },
      result: true,
    },
  ],
}

describe('Extend', test(testRules))
