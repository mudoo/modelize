# Modelize

一个 TypeScript 数据模型工具库，用于定义、解析、转换和操作数据模型。支持字段映射、类型转换、模型扩展等功能。

## 特性

- 🎯 **字段映射**：轻松映射服务端字段与前端模型
- 🔄 **类型转换**：自动类型转换和验证
- 🧩 **模型扩展**：支持模型继承和字段选择
- 📦 **嵌套模型**：支持嵌套对象和数组模型
- 🎨 **自定义处理**：支持自定义 parse 和 convert 函数
- 🔧 **辅助函数**：提供 JSON、数组分割、布尔值转换等工具函数

## 安装

```bash
npm install modelize-ts
```

## 基础用法

### 定义模型

```typescript
import Model from 'modelize-ts';

// 定义用户模型
const UserModel = Model.define({
  // 简单字段映射
  id: 'user_id',

  // 带默认值的字段
  name: {
    key: 'user_name',
    default: '',
  },

  // 指定类型的字段
  gender: {
    key: 'user_gender',
    model: Number,
  },

  // 数组字段
  tags: {
    key: 'user_tags',
    model: [String],
    default: () => [],
  },
});

type UserVO = typeof UserModel.type;
type UserDTO = typeof UserModel.rawType;
```

### 解析数据

```typescript
// 解析服务端数据
const user = UserModel.parse({
  user_id: 123,
  user_name: '张三',
  user_gender: 1,
  user_tags: ['前端', 'TypeScript'],
});

console.log(user.id);     // 123
console.log(user.name);   // '张三'
console.log(user.gender); // 1
console.log(user.tags);   // ['前端', 'TypeScript']

// 解析数组数据
const users = UserModel.parseList([
  { user_id: 1, user_name: '张三', user_gender: 1 },
  { user_id: 2, user_name: '李四', user_gender: 2 },
]);
```

### 转换为服务端格式

```typescript
// 将模型数据转换回服务端格式
const serverData = UserModel.toServer(user);
console.log(serverData);
// { user_id: 123, user_name: '张三', user_gender: 1, user_tags: ['前端', 'TypeScript'] }

// 可以在转换时合并额外数据
const serverData2 = UserModel.toServer(user, {
  extra_field: 'value',
});
```

## 高级功能

### 嵌套模型

```typescript
// 定义分类模型
const CategoryModel = Model.define({
  id: 'category_id',
  name: 'category_name',
});

// 在用户模型中使用嵌套模型
const UserModel = Model.define({
  id: 'user_id',
  name: 'user_name',

  // 单个嵌套模型
  category: {
    key: 'user_category',
    model: CategoryModel,
  },

  // 嵌套模型数组
  categories: {
    key: 'user_categories',
    model: [CategoryModel],
  },
});
```

### 自定义解析和转换

```typescript
const UserModel = Model.define({
  // 使用 parse 函数自定义解析逻辑
  birthday: {
    key: 'birth_day',
    parse(value) {
      // 将日期字符串转为时间戳
      return value ? new Date(value).getTime() : value;
    },
    convert(value) {
      // 将时间戳转回日期字符串
      return value ? new Date(value).toLocaleDateString() : value;
    },
  },

  // 使用 default 函数动态计算默认值
  friendCount: {
    key: 'friend_count',
    default(key, value, data) {
      return (data.friends_list || []).length;
    },
  },
});
```

### Getter 和 Setter

```typescript
const UserModel = Model.define({
  gender: {
    key: 'user_gender',
    model: Number,
  },

  // 定义 getter 计算属性
  genderName: {
    get() {
      return this.gender === 1 ? '男' : '女';
    },
  },

  // 定义 getter 和 setter
  fullName: {
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
    set(value) {
      const [firstName, lastName] = value.split(' ');
      this.firstName = firstName;
      this.lastName = lastName;
    },
  },
});
```

### 模型扩展

```typescript
// 基础模型
const UserBaseModel = Model.define({
  id: 'user_id',
  name: 'user_name',
});

// 扩展模型，添加新字段
const ExtendedUserModel = UserBaseModel.extends({
  age: {
    key: 'user_age',
    model: Number,
    default: 0,
  },
  email: 'user_email',
});

// 选择指定字段扩展
const PickedModel = UserBaseModel.pickExtends(['id', 'name'], {
  age: { key: 'user_age', model: Number },
});

// 排除指定字段扩展
const OmittedModel = UserBaseModel.omitExtends(['name'], {
  age: { key: 'user_age', model: Number },
});
```

### 枚举类型

```typescript
const UserModel = Model.define({
  status: {
    key: 'user_status',
    enum: {
      active: { value: 1, label: '活跃' },
      inactive: { value: 0, label: '未活跃' },
      banned: { value: -1, label: '已封禁' },
    },
  },
});

// 获取枚举
const StatusEnum = UserModel.enum('status');
console.log(StatusEnum.active);           // 1
console.log(StatusEnum.label('active'));  // '活跃'
console.log(StatusEnum.label(1));         // '活跃'
```

## 模型方法

### 数据操作

```typescript
// update - 使用服务端格式更新数据
UserModel.update(user, {
  user_name: '新名字',
  user_gender: 2,
});

// merge - 使用模型格式合并数据（只更新已定义字段）
UserModel.merge(user, {
  name: '新名字',
  gender: 2,
});

// attr - 设置任意属性（包括未定义字段）
UserModel.attr(user, {
  name: '新名字',
  customField: '自定义值', // 模型外字段也可以设置
});

// clear - 清空数据
UserModel.clear(user);

// clear with reset - 重置为默认值
UserModel.clear(user, false, true);

// clone - 克隆数据
const cloned = UserModel.clone(user);
```

### 字段选择

```typescript
// pick - 选择指定字段
const picked = UserModel.pick(user, ['id', 'name', 'gender']);
// { id: 123, name: '张三', gender: 1 }

// pick 转为服务端格式
const pickedServer = UserModel.pick(user, ['id', 'name'], true);
// { user_id: 123, user_name: '张三' }

// omit - 排除指定字段
const omitted = UserModel.omit(user, ['tags', 'categories']);

// omit 转为服务端格式
const omittedServer = UserModel.omit(user, ['tags'], true);
```

## 配置选项

### 字段配置参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 服务端字段名 |
| `model` | `Constructor` | 数据类型（String/Number/Boolean/Array/自定义Model） |
| `default` | `any \| Function` | 默认值或默认值生成函数 |
| `parse` | `Function` | 解析函数，用于自定义数据解析逻辑 |
| `convert` | `Function` | 转换函数，用于转换为服务端数据 |
| `optional` | `boolean` | 是否可选，为 true 时值可能为 undefined |
| `autoParse` | `boolean` | 是否自动解析为模型数据，默认 true |
| `autoConvert` | `boolean` | 转换为服务端数据时是否自动转换，默认 false |
| `get` | `Function` | Getter 函数 |
| `set` | `Function` | Setter 函数 |
| `enumerable` | `boolean` | 是否可枚举，默认 true |
| `configurable` | `boolean` | 是否可配置 |
| `writable` | `boolean` | 是否可写入 |
| `enum` | `Object \| Array` | 枚举值定义 |

### 模型选项

| 参数 | 类型 | 说明 |
|------|------|------|
| `autoParse` | `boolean` | 解析时是否自动转为模型数据，默认 true |
| `autoConvert` | `boolean` | 转换时是否自动转换为服务端数据，默认 false |
| `handler` | `'update' \| 'merge' \| 'attr'` | 实例化时的数据赋值方法，默认 'update' |
| `onBeforeUpdate` | `Function` | 更新前的数据预处理函数 |
| `onDataChange` | `Function` | 数据更新后的回调函数 |

## 辅助工具

### JSONField - JSON 字段处理

将 JSON 字符串与对象相互转换：

```typescript
import { JSONField } from 'modelize-ts';

const UserModel = Model.define({
  profile: JSONField('user_profile'),
});

// 解析时自动将 JSON 字符串转为对象
const user = UserModel.parse({
  user_profile: '{"hobby":"编程","age":25}',
});
console.log(user.profile); // { hobby: '编程', age: 25 }

// 转换时自动将对象转为 JSON 字符串
const serverData = UserModel.toServer(user);
console.log(serverData.user_profile); // '{"hobby":"编程","age":25}'
```

### splitField - 字符串分割

将分隔符字符串与数组相互转换：

```typescript
import { splitField } from 'modelize-ts';

const UserModel = Model.define({
  tags: splitField('user_tags', ','),
});

// 解析时自动分割字符串为数组
const user = UserModel.parse({
  user_tags: 'JavaScript, TypeScript, Node.js',
});
console.log(user.tags); // ['JavaScript', 'TypeScript', 'Node.js']

// 转换时自动将数组连接为字符串
const serverData = UserModel.toServer(user);
console.log(serverData.user_tags); // 'JavaScript,TypeScript,Node.js'
```

### bool2intField - 布尔值转数字

将布尔值与数字（1/0）相互转换：

```typescript
import { bool2intField } from 'modelize-ts';

const UserModel = Model.define({
  isActive: bool2intField('is_active'),
});

// 解析时将 1/0 转为布尔值
const user = UserModel.parse({
  is_active: 1,
});
console.log(user.isActive); // true

// 转换时将布尔值转为 1/0
const serverData = UserModel.toServer(user);
console.log(serverData.is_active); // 1
```

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 生成测试覆盖率报告
npm run cover

# 代码规范检查
npm run lint
```

## License

MIT
