import Model from '../src/model'
import { CategoryModel, userData, UserModel } from './test-data'
import test from './test'

const user = UserModel.parse(userData)

// 单元测试
const testRules = {
  // 实例化测试
  instance: [{
    title: 'Model.parse()',
    handler () {
      return JSON.stringify(UserModel.parse())
    },
    result: '{"name":"","gender":0,"wealth":0,"tags":[],"categories":[],"friends":[],"bestFriend":{"name":"","gender":0},"friendCount":0}',
  }, {
    title: 'init',
    handler () {
      const data = UserModel.init({
        name: '帅小伙',
        gender: 1,
      })
      return data.name === '帅小伙' && data.gender === 1
    },
    result: true,
  }, {
    title: 'normal',
    handler () {
      return JSON.stringify(user)
    },
    result: '{"id":456,"name":"张三","gender":1,"wealth":0,"tags":[],"categories":[],"friends":[{"id":789,"name":"李四","gender":2},{"id":890,"name":"王五","gender":1}],"bestFriend":{"id":789,"name":"李四","gender":2},"friendCount":2,"birthday":795196800000}',
  }, {
    title: 'array',
    handler () {
      const ArrayModel = Model.define({
        list: {
          key: 'data_list',
          model: Array,
        },
      })

      const list = ['张三', 0, 1, true, false]
      const aryData = ArrayModel.parse({
        data_list: list,
      })

      return aryData.list.every((item, index) => item === list[index])
    },
    result: true,
  }, {
    title: 'array string',
    handler () {
      const ArrayModel = Model.define({
        list: {
          key: 'data_list',
          model: [String],
        },
      })

      const list = ['张三', 0, 1, true, false]
      const aryData = ArrayModel.parse({
        data_list: list,
      })

      return aryData.list.every((item, index) => item === String(list[index]))
    },
    result: true,
  }, {
    title: 'array number',
    handler () {
      const ArrayModel = Model.define({
        list: {
          key: 'data_list',
          model: [Number],
        },
      })

      const list = ['张三', 0, 1, true, false]
      const aryData = ArrayModel.parse({
        data_list: list,
      })

      return aryData.list.every((item, index) => item === (parseFloat(String(list[index])) || 0))
    },
    result: true,
  }, {
    title: 'array boolean',
    handler () {
      const ArrayModel = Model.define({
        list: {
          key: 'data_list',
          model: [Boolean],
        },
      })

      const list = ['张三', 0, 1, true, false]
      const aryData = ArrayModel.parse({
        data_list: list,
      })

      return aryData.list.every((item, index) => item === (String(list[index]) === 'true' || String(list[index]) === '1'))
    },
    result: true,
  }, {
    title: 'date string',
    handler () {
      const DateModel = Model.define({
        time: {
          model: Date,
        },
      })

      const dateStr = '2024-01-01'
      const timeData = DateModel.parse({
        time: dateStr,
        date: dateStr,
      })

      const time = timeData.time
      return time instanceof Date && time.getTime() === new Date(dateStr).getTime()
    },
    result: true,
  }, {
    title: 'date number',
    handler () {
      const DateModel = Model.define({
        time: {
          model: Date,
        },
      })

      const timestamp = 1704067200000
      const timeData = DateModel.parse({
        time: timestamp,
      })

      const time = timeData.time
      return time instanceof Date && time.getTime() === timestamp
    },
    result: true,
  }, {
    title: 'array date',
    handler () {
      const ArrayModel = Model.define({
        list: {
          model: [Date],
        },
      })

      const list = ['2024-01-01', 1704067200000]
      const aryData = ArrayModel.parse({
        list,
      })

      return aryData.list.every((item: any) => item instanceof Date)
    },
    result: true,
  }, {
    title: 'object',
    handler () {
      const ObjectModel = Model.define({
        info: Object,
      })

      const info = { a: 1, b: '2' }
      const data = ObjectModel.parse({
        info,
      })

      return data.info !== info && JSON.stringify(data.info) === JSON.stringify(info)
    },
    result: true,
  }, {
    title: 'object empty',
    handler () {
      const ObjectModel = Model.define({
        info: Object,
      })

      const data = ObjectModel.parse({
        info: [],
      })

      return JSON.stringify(data.info) === '{}'
    },
    result: true,
  }, {
    title: 'get',
    handler () {
      const cat = CategoryModel.parse({
        category_id: 1,
        category_name: 'test',
      })
      return cat.unique === cat.value && cat.value === '1$test' && cat.id === 1 && cat.name === 'test'
    },
    result: true,
  }, {
    title: 'set',
    handler () {
      const cat = CategoryModel.parse({
        category_id: 1,
        category_name: 'test',
      })

      cat.value = '2$aaa'
      return cat.unique === cat.value && cat.value === '2$aaa' && cat.id === '2' && cat.name === 'aaa'
    },
    result: true,
  }, {
    title: 'parseList',
    handler () {
      return JSON.stringify(UserModel.parseList([
        { user_id: 789, user_name: '李四', user_gender: 2, adult: 1 },
        { user_id: 890, user_name: '王五', user_gender: 1, adult: 0 },
      ]))
    },
    result: '[{"id":789,"name":"李四","gender":2,"wealth":0,"tags":[],"categories":[],"friends":[],"bestFriend":{"name":"","gender":0},"friendCount":0},{"id":890,"name":"王五","gender":1,"wealth":0,"tags":[],"categories":[],"friends":[],"bestFriend":{"name":"","gender":0},"friendCount":0}]',
  }, {
    title: 'clone',
    handler () {
      const cloned = UserModel.clone(user)
      return cloned !== user &&
             cloned.name === user.name &&
             cloned.birthday === user.birthday
    },
    result: true,
  }],
}

describe('Model', test(testRules))
