import Model from '../src/model'

export const UserBaseModel = Model.define({
  id: 'user_id', // 只配置KEY，无数据值则为undefined

  // 配置了default，无数据值时使用默认值填充
  name: {
    key: 'user_name',
    default: '',
  },

  // 只配置model，若数据不是该类型，则转为该类型空值（Number=0，Boolean=false）
  gender: {
    key: 'user_gender',
    model: Number,
  },
})

export const FriendModel = UserBaseModel.extends({
  /* knownTime: {
    key: 'known_time',
    model: Number
  } */
})

export const CategoryModel = Model.define({
  id: 'category_id',
  name: 'category_name',

  unique: {
    get () {
      return this.id + '$' + this.name
    },
  },
  value: {
    get () {
      return this.unique
    },
    set (v) {
      if (v == null) return
      const [id, name] = v.split('$')
      this.id = id
      this.name = name
    },
  },
})

export const UserModel = UserBaseModel.extends({
  wealth: {
    key: 'wealth',
    model: Number,
  },

  // 可以是数组，没有数据的话，默认就是空的素组[]
  tags: {
    key: 'user_tags',
    model: Array,
  },

  // 若是自定义模型数组，可以这样定义model: Array(Model)
  categories: {
    key: 'user_category',
    model: Array(CategoryModel),
  },

  // default可以是个函数(key,value,data)。注意：Array/Object类型数据，务必使用工厂函数生成
  friends: {
    key: 'friends_list',
    // 也可以这样定义数组: [Model]
    model: [FriendModel],
    default () {
      return []
    },
  },
  bestFriend: {
    key: 'best_friend',
    model: FriendModel,
  },
  friendCount: {
    key: 'friend_count',
    default (key: string, value: any, data: { friends_list?: any[] }): number {
      return (data.friends_list || []).length
    },
  },

  // 支持parse/convert进行数据互转，实例化时parse解析，转为源数据时convert转换回去
  birthday: {
    key: 'birth_day',
    parse (value): number {
      return value ? new Date(value).getTime() : value
    },
    convert (value): string {
      if (!value) return value

      return value && value.toLocaleDateString ? value.toLocaleDateString() : value
    },
  },
  genderName: {
    get () {
      switch (this.gender) {
        case 1:
          return '男'
        case 2:
          return '女'
      }
    },
    enumerable: false,
  },
}, {
  // 前置数据解析，用于前置处理实例化所需的数据(update)
  onBeforeUpdate (target, data) {
    const newData = Object.assign({}, data)
    if (typeof newData.friends_list === 'string') newData.friends_list = JSON.parse(newData.friends_list)
    if (!newData.best_friend && newData.friends_list) newData.best_friend = newData.friends_list[0]
    return newData
  },

  // 更新数据后回调，new也会执行
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDataChange (data) {
    // data是经过onBeforeUpdate处理后的
    // 如果是调用clone而触发，那么data将是该模型实例
    // if (data instanceof User) return

    // switch (this.gender) {
    //   case 1:
    //     this.genderName = '男'
    //     break
    //   case 2:
    //     this.genderName = '女'
    //     break
    // }
  },
})

export const userData = {
  user_id: 456,
  user_name: '张三',
  user_gender: 1,
  friends_list: '[{"user_id":789,"user_name":"李四","user_gender":2},{"user_id":890,"user_name":"王五","user_gender":1}]',
  birth_day: '1995-3-15',

  create_time: 1710123456789,
}
