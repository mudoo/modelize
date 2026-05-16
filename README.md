# Modelize

一个 TypeScript 数据模型工具库，用于定义、解析、转换和操作数据模型。支持字段映射、类型转换、模型扩展等功能。

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

// 模型类型
type UserVO = typeof UserModel.type;
// 源数据类型
type UserDTO = typeof UserModel.rawType;
```

### 解析数据

```typescript
// 解析源数据
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

### 转换为源数据格式

```typescript
// 将模型数据转换回源数据格式
const rawData = UserModel.toRaw(user);
console.log(rawData);
// { user_id: 123, user_name: '张三', user_gender: 1, user_tags: ['前端', 'TypeScript'] }

// 可以在转换时合并额外数据
const rawData2 = UserModel.toRaw(user, {
  gender: 2,
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
更多用法请参考：[enum-plus](https://github.com/shijistar/enum-plus)

```typescript
import { Model, EnumPlugin } from 'modelize'
import { Enum } from 'enum-plus'

Model.usePlugin(EnumPlugin(Enum))

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

### Debug 和 Strict 模式

用于在开发阶段或生产环境中检测数据的一致性。

- **Debug 模式**：当原始数据类型与模型配置严重不匹配时（如预期 `Number` 却收到 `Object`），在控制台输出警告。
- **Strict 模式**：当类型严重不匹配时直接抛出 `TypeError` 错误，确保数据强一致性。

#### 全局配置
```typescript
Model.debug = true;  // 开启全局调试模式
Model.strict = true; // 开启全局严格模式
```

#### 局部配置
```typescript
const UserModel = Model.define({
  name: String,
}, {
  debug: true,  // 仅对此模型开启调试
  strict: true, // 仅对此模型开启严格模式
});
```

### 数据校验（Zod 集成）

支持以非强依赖的方式集成 [Zod](https://zod.dev) 作为校验引擎，提供整体校验、单字段校验能力。Zod 为可选依赖，未安装时不影响其他功能。

#### 安装 Zod（可选）

```bash
npm install zod
```

#### 注册

```typescript
import { z } from 'zod';
import { Model, ZodPlugin } from 'modelize';

Model.usePlugin(ZodPlugin(z));
```

#### 定义 schema

支持两种方式：

- **自动推导**：根据 `model` 自动映射 Zod schema（如 `String` → `z.string()`）
- **自定义覆盖**：通过 `schema` 字段指定更精确的校验规则

```typescript
const UserModel = Model.define({
  name: { model: String, schema: z.string().min(2).max(20) },
  email: { model: String, schema: z.string().email() },
  age: { model: Number, schema: z.number().min(0).max(150) },
  tags: [String],                                    // 自动推导: z.array(z.string())
  nickname: { model: String, optional: true },       // 自动推导: z.string().optional().nullable()
});
```

自动推导映射规则：

| model 定义 | 推导的 Zod Schema |
|---|---|
| `String` | `z.string()` |
| `Number` | `z.number()` |
| `Boolean` | `z.boolean()` |
| `Date` | `z.coerce.date()` |
| `Array` / `[Type]` | `z.array(...)` |
| `Object` | `z.record(z.string(), z.any())` |
| 嵌套 Model | 递归 `z.object(...)` |
| `optional: true` | 外层包裹 `.optional().nullable()` |

#### 校验数据

```typescript
const user = UserModel.parse(rawData);

// 整体校验
const result = UserModel.validate(user);
// { success: false, errors: [{ field: 'email', message: 'Invalid email', code: 'invalid_string' }] }

// 单字段校验
const fieldResult = UserModel.validateField(user, 'email');
// { success: false, errors: [{ field: 'email', message: 'Invalid email' }] }

// 仅校验指定字段（适合表单逐字段校验）
UserModel.validate(user, { fields: ['name', 'email'] });

// 遇到首个错误即停止
UserModel.validate(user, { abortEarly: true });
```

#### 获取 schema（可复用）

```typescript
const schema = UserModel.schema;

// 可直接用于 API 路由校验
app.post('/users', (req, res) => {
  const result = schema.safeParse(req.body);
  // ...
});

// 可组合使用 Zod 原生能力
const CreateUserSchema = schema.extend({ password: z.string().min(8) });
const UpdateUserSchema = schema.partial();
```

#### 与 Strict 模式联动

当字段配置了 `schema` 时，Strict/Debug 模式下 `parse()` 会自动使用 Zod schema 校验（替代默认的 `checkType`），提供更精确的错误信息：

```typescript
Model.strict = true;

const UserModel = Model.define({
  email: { model: String, schema: z.string().email() },
});

UserModel.parse({ email: 'not-email' });
// TypeError: [modelize] Validation failed for field "email": Invalid email
```

### 表单校验规则生成

`toFormRules()` 方法将模型定义转换为 Element UI / Ant Design / Naive UI 等基于 async-validator 的表单校验规则。无需 Zod 也可生成基础规则，注册 Zod 后自动增强。

```typescript
const UserModel = Model.define({
  name: { model: String, schema: z.string().min(2).max(20) },
  email: { model: String, schema: z.string().email() },
  age: { model: Number, schema: z.number().min(0).max(150) },
  nickname: { model: String, optional: true },
});

// 生成规则
const rules = UserModel.toFormRules();
// {
//   name: [
//     { required: true, message: 'name is required', trigger: 'blur' },
//     { type: 'string', message: 'name must be a valid string', trigger: 'blur' },
//     { trigger: 'blur', validator: fn }  -- Zod schema 校验
//   ],
//   email: [ ... ],
//   age: [ ... ],
//   nickname: [  -- optional 字段无 required 规则
//     { type: 'string', ... },
//     { trigger: 'blur', validator: fn }
//   ],
// }
```

#### 在 Element UI 中使用

```html
<template>
  <el-form :model="form" :rules="rules">
    <el-form-item label="姓名" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" />
    </el-form-item>
  </el-form>
</template>

<script setup>
const rules = UserModel.toFormRules({ trigger: 'blur' });
</script>
```

#### 在 Ant Design 中使用

```tsx
<Form rules={UserModel.toFormRules({ trigger: 'change' })}>
  <Form.Item name="name" label="姓名">
    <Input />
  </Form.Item>
</Form>
```

#### 配置选项

```typescript
// 自定义触发方式
UserModel.toFormRules({ trigger: 'change' });

// 自定义必填提示（模板字符串，{field} 替换为字段名）
UserModel.toFormRules({ requiredMessage: '{field}不能为空' });

// 自定义必填提示（函数）
UserModel.toFormRules({ requiredMessage: (field) => `请输入${field}` });

// 仅生成指定字段的规则
UserModel.toFormRules({ fields: ['name', 'email'] });
```

## 模型方法

### 数据操作

```typescript
// update - 使用源数据格式更新数据
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

// pick 转为源数据格式
const pickedRaw = UserModel.pick(user, ['id', 'name'], true);
// { user_id: 123, user_name: '张三' }

// omit - 排除指定字段
const omitted = UserModel.omit(user, ['tags', 'categories']);

// omit 转为源数据格式
const omittedRaw = UserModel.omit(user, ['tags'], true);
```

## 配置选项

### 字段配置参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 源字段名 |
| `model` | `Constructor` | 数据类型（String/Number/Boolean/Date/Array/自定义Model） |
| `default` | `any \| Function` | 默认值或默认值生成函数 |
| `parse` | `Function` | 解析函数，用于自定义数据解析逻辑 |
| `convert` | `false \| Function` | 转换函数，用于转换为源数据，false则toRaw时不赋值 |
| `optional` | `boolean` | 是否可选，值可能为undefined（parse会是undefined，convert会忽略空值），若需默认值，请配合 default或parse 使用 |
| `readonly` | `boolean` | 是否只读，映射后的类型将带有 readonly 修饰符 |
| `get` | `Function` | Getter 函数 |
| `set` | `Function` | Setter 函数 |
| `enum` | `Object \| Array` | 枚举值定义 |
| `schema` | `ZodType` | Zod schema，用于自定义校验规则（需先调用 `Model.useZod(z)` 注册） |

### 模型选项

| 参数 | 类型 | 说明 |
|------|------|------|
| `parseToModel` | `boolean` | 解析时是否自动转成模型数据，为空或数据类型不匹配时，将自动转为指定模型数据。若明确设置了default，为空时依然使用default值。默认true |
| `convertToModel` | `boolean` | 转换为源数据时，是否自动转成模型格式数据。默认false |
| `handler` | `'update' \| 'merge' \| 'attr'` | 实例化时的数据赋值方法，默认 'update' |
| `debug` | `boolean` | 调试模式：类型不匹配时输出警告。优先级高于 `Model.debug` |
| `strict` | `boolean` | 严格模式：类型不匹配时抛出错误。优先级高于 `Model.strict` |
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
const rawData = UserModel.toRaw(user);
console.log(rawData.user_profile); // '{"hobby":"编程","age":25}'
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
const rawData = UserModel.toRaw(user);
console.log(rawData.user_tags); // 'JavaScript,TypeScript,Node.js'
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
const rawData = UserModel.toRaw(user);
console.log(rawData.is_active); // 1
```

## License

MIT
