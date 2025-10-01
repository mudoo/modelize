import { UserBaseModel } from './test-data'
import test from './test'

// 单元测试
const testRules = {
  // 继承
  extends: [{
    title: 'extends',
    handler () {
      const ExtendedUser = UserBaseModel.extends({
        age: {
          key: 'user_age',
          model: Number,
          default: 0,
        },
        fullInfo: {
          get () {
            return `${this.name}(${this.age}岁)`
          },
        },
      })
      const extUser = ExtendedUser.parse({
        user_name: '测试用户',
        user_age: 25,
      })
      return extUser.fullInfo === '测试用户(25岁)' && extUser.age === 25
    },
    result: true,
  }, {
    title: 'extends pick',
    handler () {
      const ChildModel = UserBaseModel.extends(['id', 'name'], {
        age: {
          key: 'user_age',
          model: Number,
          default: 0,
        },
      })

      const instance = ChildModel.parse({
        user_id: 1,
        user_name: 'test',
        user_age: 20,
        user_gender: 1,
      })

      return instance.id === 1 &&
             instance.name === 'test' &&
             instance.age === 20 &&
             // @ts-expect-error: 不存在属性测试
             instance.gender === undefined
    },
    result: true,
  }],

  // pickExtends
  pickExtends: [{
    title: 'pickExtends',
    handler () {
      const ChildModel = UserBaseModel.pickExtends(['id', 'name'], {
        age: {
          key: 'user_age',
          model: Number,
          default: 0,
        },
      })

      const instance = ChildModel.parse({
        user_id: 1,
        user_name: 'test',
        user_age: 20,
        user_gender: 1,
      })

      return instance.id === 1 &&
             instance.name === 'test' &&
             instance.age === 20 &&
             // @ts-expect-error: 不存在属性测试
             instance.gender === undefined
    },
    result: true,
  }],

  // omitExtends
  omitExtends: [{
    title: 'omitExtends',
    handler () {
      const ChildModel = UserBaseModel.omitExtends(['gender'], {
        age: {
          key: 'user_age',
          model: Number,
          default: 0,
        },
      })

      const instance = ChildModel.parse({
        user_id: 1,
        user_name: 'test',
        user_age: 20,
        email: 'test@example.com',
        user_gender: 1,
      })

      return instance.id === 1 &&
             instance.name === 'test' &&
             instance.age === 20 &&
             // @ts-expect-error: 不存在属性测试
             instance.gender === undefined &&
             // @ts-expect-error: 不存在属性测试
             instance.email === undefined
    },
    result: true,
  }],
}

describe('Extend', test(testRules))
