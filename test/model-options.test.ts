import Model from '../src/model'
import { CategoryModel, UserBaseModel, userData, UserModel } from './test-data'
import test from './test'
import * as assert from 'assert'

const testRules = {
  options: [{
    title: 'Model.parse({}, { parseToModel: false })',
    handler () {
      return JSON.stringify(UserModel.parse({}, { parseToModel: false }))
    },
    result: '{"name":"","friends":[],"friendCount":0}',
  }, {
    title: 'parse with custom handler',
    handler () {
      const data = UserModel.parse({
        name: '帅小伙',
        gender: 1,
      }, { handler: 'merge' })
      return data.name === '帅小伙' && data.gender === 1
    },
    result: true,
  }, {
    title: 'field optional',
    handler () {
      const UserModel2 = UserBaseModel.extends({
        category: {
          model: CategoryModel,
          optional: true,
        },
        age: {
          key: 'user_age',
          model: Number,
          optional: true,
        },
        nickName: {
          key: 'user_nick_name',
          model: String,
          optional: true,
        },
        tags: {
          key: 'user_tags',
          model: [String],
          optional: true,
        },
      })

      const user2 = UserModel2.parse({
        user_age: 19,
        user_nick_name: '',
        user_tags: [],
      })
      const user2DTO = UserModel2.toRaw(user2)

      return user2.name === '' && user2DTO.user_name === '' &&
        user2.age === 19 && user2DTO.user_age === 19 &&
        user2.gender === 0 && user2DTO.user_gender === 0 &&
        user2.category === undefined && user2DTO.category === undefined &&
        user2.nickName === '' && user2DTO.user_nick_name === undefined &&
        user2.tags?.length === 0 && user2DTO.user_tags === undefined
    },
    result: true,
  }, {
    title: 'field convert: false',
    handler () {
      const UserModel2 = UserBaseModel.extends({
        age: {
          key: 'user_age',
          model: Number,
          convert: false,
        },
        nickName: {
          key: 'user_nick_name',
          model: String,
          convert: false,
        },
        tags: {
          key: 'user_tags',
          model: [String],
          convert: false,
        },
      })

      const user2 = UserModel2.parse({
        user_age: 19,
        user_nick_name: '',
        user_tags: [],
      })
      const user2DTO = UserModel2.toRaw(user2)

      return user2.name === '' && user2DTO.user_name === '' &&
        user2.age === 19 && user2DTO.user_age === undefined &&
        user2.gender === 0 && user2DTO.user_gender === 0 &&
        user2.nickName === '' && user2DTO.user_nick_name === undefined &&
        user2.tags?.length === 0 && user2DTO.user_tags === undefined
    },
    result: true,
  }, {
    title: 'parseToModel: false',
    handler () {
      const UserModel2 = UserBaseModel.extends({
        age: {
          key: 'user_age',
          model: Number,
        },
        age2: {
          key: 'user_age2',
          model: Number,
        },
        age3: {
          key: 'user_age3',
          model: Number,
        },
      }, {
        parseToModel: false,
      })

      const user2 = UserModel2.parse({
        user_id: 2,
        user_name: '帅小伙',
        user_gender: 1,
        user_age2: '19',
      })

      const userData2 = UserModel2.toRaw(user2)

      return user2.age === undefined && user2.age2 === 19 && user2.age3 === undefined &&
             userData2.user_age === undefined && userData2.user_age2 === 19 && userData2.user_age3 === undefined
    },
    result: true,
  }, {
    title: 'convertToModel: true',
    handler () {
      const UserModel2 = UserBaseModel.extends({
        age: {
          key: 'user_age',
          model: Number,
        },
        age2: {
          key: 'user_age2',
          model: Number,
        },
        age3: {
          key: 'user_age3',
          model: Number,
        },
      }, {
        convertToModel: true,
      })

      const user2 = UserModel2.parse({
        user_id: 2,
        user_name: '帅小伙',
        user_gender: 1,
        user_age2: '19',
      })

      const userData2 = UserModel2.toRaw(user2)

      return user2.age === 0 && user2.age2 === 19 && user2.age3 === 0 &&
             userData2.user_age === 0 && userData2.user_age2 === 19 && userData2.user_age3 === 0
    },
    result: true,
  }, {
    title: 'parse with propertyAttributes',
    handler () {
      const data = UserModel.parse(userData, {
        propertyAttributes: {
          configurable: true,
          enumerable: true,
        },
      })
      const descriptor = Object.getOwnPropertyDescriptor(data, 'genderName')
      return descriptor?.configurable === true && descriptor?.enumerable === true
    },
    result: true,
  }, {
    title: 'readonly (get without set)',
    handler () {
      const ReadonlyModel = Model.define({
        name: {
          get () {
            return 'fixed'
          },
        },
      })
      const data = ReadonlyModel.parse({ name: 'new' })
      const raw = ReadonlyModel.toRaw(data)

      // @ts-expect-error: name is readonly
      assert.throws(() => { data.name = 'new' }, TypeError)

      return data.name === 'fixed' && raw.name === undefined
    },
    result: true,
  }, {
    title: 'readonly (explicit readonly: true)',
    handler () {
      const ReadonlyModel = Model.define({
        name: {
          key: 'user_name',
          model: String,
          readonly: true,
        },
      })
      const data = ReadonlyModel.parse({ user_name: 'test' })

      // only type error
      // @ts-expect-error: name is readonly
      data.name = 'new'

      return data.name === 'new'
    },
    result: true,
  }],
}

describe('Model Options', test(testRules))
