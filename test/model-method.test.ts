import { FriendModel, userData, UserModel } from './test-data'
import test from './test'

const user = UserModel.parse(userData)

// 方法测试
const testRules = {
  methods: [{
    title: 'pick',
    handler () {
      const picked = UserModel.pick(user, ['name', 'gender'])
      const pickedRaw = UserModel.pick(user, ['name', 'gender'], true)
      return picked.name === '张三' &&
             picked.gender === 1 &&
             pickedRaw.user_name === '张三' &&
             pickedRaw.user_gender === 1
    },
    result: true,
  }, {
    title: 'clear',
    handler () {
      const testUser = UserModel.parse(userData)
      UserModel.clear(testUser)
      return testUser.name === undefined &&
             testUser.gender === undefined &&
             testUser.birthday === undefined
    },
    result: true,
  }, {
    title: 'clear with useModel',
    handler () {
      const testUser = UserModel.parse(userData)
      UserModel.clear(testUser, false, true)
      return testUser.name === '' &&
             testUser.gender === 0 &&
             testUser.tags.length === 0
    },
    result: true,
  }, {
    title: 'update',
    handler () {
      UserModel.update(user, {
        user_name: '张三丰',
        user_gender: 0,
      })

      return user.name === '张三丰' && user.gender === 0
    },
  }, {
    title: 'update sub model',
    handler () {
      UserModel.update(user, {
        best_friend: {
          user_name: '李四玲',
        },
      })
      UserModel.update(user, {
        best_friend: {
          user_id: 10020,
        },
      })

      const res = JSON.stringify(user.bestFriend)
      FriendModel.update(user.bestFriend, {
        id: undefined,
        user_name: '',
      }, {
        skipNull: false,
      })
      return res
    },
    result: '{"id":10020,"name":"李四玲","gender":2}',
  }, {
    title: 'merge',
    handler () {
      UserModel.merge(user, {
        wealth: 2,
      })
      UserModel.merge(user, {
        gender: 0,
        remark: '阳光帅气', // 这个属性会被丢弃
      })

      // @ts-expect-error: 不存在属性测试
      return user.wealth === 2 && user.remark === undefined && user.gender === 0
    },
  }, {
    title: 'attr',
    handler () {
      UserModel.attr(user, {
        wealth: 20,
      })
      UserModel.attr(user, {
        gender: 1,
        remark: '阳光帅气多金', // 这个属性会被设置
      })

      // @ts-expect-error: 不存在属性测试
      return user.wealth === 20 && user.remark === '阳光帅气多金' && user.gender === 1
    },
  }, {
    title: 'attr model',
    handler () {
      return JSON.stringify(UserModel.attr(user, { test: 11 }))
    },
    result: '{"id":456,"name":"张三丰","gender":1,"wealth":20,"tags":[],"categories":[],"friends":[{"id":789,"name":"李四","gender":2},{"id":890,"name":"王五","gender":1}],"bestFriend":{"name":"","gender":0},"friendCount":2,"birthday":795196800000,"remark":"阳光帅气多金","test":11}',
  }, {
    title: 'clone',
    handler () {
      // user.bestFriend.friend = user // 测试无限套用克隆
      const user2 = UserModel.clone(user, true) // user2将会是个新的实例
      user2.name = '李雷'

      return user.name === '张三丰' && user2.name === '李雷'
    },
  }, {
    title: 'clear',
    handler () {
      const user2 = UserModel.clone(user, true)
      user2.name = '韩梅梅'
      UserModel.clear(user2, true)

      return JSON.stringify(user2)
    },
    result: '{}',
  }, {
    title: 'reset: 重置数据(重置为默认值)',
    handler () {
      const user2 = UserModel.clone(user, true)
      user2.name = '韩梅梅'
      UserModel.clear(user2, true, true)

      return !user2.name && user2.friends.length === 0
    },
  }, {
    title: 'toRaw',
    handler () {
      const data = UserModel.toRaw(user, {
        wealth: 100,
      })
      const bestFriend = data.best_friend

      return data.user_name === '张三丰' && data.user_id === user.id && data.wealth === 100 && bestFriend.user_id === user.bestFriend.id && bestFriend.user_name === user.bestFriend.name
    },
    result: true,
  }, {
    title: 'convert别名',
    handler () {
      const data = {
        wealth: 100,
      }
      const convertData = JSON.stringify(UserModel.convert(user, data))
      const converttoRawData = JSON.stringify(UserModel.toRaw(user, data))
      return convertData === converttoRawData
    },
    result: true,
  }, {
    title: 'pick',
    handler () {
      return JSON.stringify(UserModel.pick(user, [
        'id',
        'name',
        'gender',
        'genderName',
      ]))
    },
    result: '{"id":456,"name":"张三丰","gender":1,"genderName":"男"}',
  }, {
    title: 'pick toRaw',
    handler () {
      return JSON.stringify(UserModel.pick(user, [
        'id',
        'name',
        'gender',
        'genderName',
      ], true))
    },
    result: '{"user_id":456,"user_name":"张三丰","user_gender":1,"genderName":"男"}',
  }, {
    title: 'omit',
    handler () {
      return JSON.stringify(UserModel.omit(user, [
        'bestFriend',
        'categories',
        'friends',
        'tags',
      ]))
    },
    result: '{"id":456,"name":"张三丰","gender":1,"wealth":20,"friendCount":2,"birthday":795196800000}',
  }, {
    title: 'omit toRaw',
    handler () {
      return JSON.stringify(UserModel.omit(user, [
        'bestFriend',
        'categories',
        'friends',
        'tags',
      ], true))
    },
    result: '{"user_id":456,"user_name":"张三丰","user_gender":1,"wealth":20,"friend_count":2,"birth_day":795196800000}',
  }],
}

describe('Method', test(testRules))
