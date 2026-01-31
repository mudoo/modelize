import Model from '../src/model'
import * as assert from 'assert'

describe('TypeScript Types', () => {
  it('Basic Type Mapping (MapToType)', () => {
    const SimpleModel = Model.define({
      id: Number,
      name: String,
      isActive: Boolean,
      createdAt: Date,
      tags: [String],
      meta: Object,
    })

    type SimpleVO = typeof SimpleModel.type

    // 验证属性存在且类型正确
    const vo: SimpleVO = {
      id: 1,
      name: 'John',
      isActive: true,
      createdAt: new Date(),
      tags: ['tag1'],
      meta: { key: 'value' },
    }

    assert.ok(SimpleModel)
    assert.ok(vo.id && vo.name && vo.isActive && vo.createdAt && vo.tags && vo.meta)
  })

  it('Nested Models', () => {
    const ChildModel = Model.define({
      id: Number,
    })
    const ParentModel = Model.define({
      child: ChildModel,
      children: [ChildModel],
    })

    type ParentVO = typeof ParentModel.type
    const vo: ParentVO = {
      child: { id: 1 },
      children: [{ id: 2 }],
    }

    assert.ok(ParentModel)
    assert.strictEqual(vo.child.id, 1)
    assert.strictEqual(vo.children[0].id, 2)
  })

  it('Complex Mapping (MapToType with MapItem)', () => {
    const ComplexModel = Model.define({
      userId: {
        key: 'user_id',
        model: Number,
      },
      nickName: {
        key: 'nick_name',
        model: String,
        optional: true,
      },
      role: {
        model: String,
        readonly: true,
      },
    })

    type ComplexVO = typeof ComplexModel.type

    const vo: ComplexVO = {
      userId: 123,
      role: 'admin',
    }
    // @ts-expect-error: nickName is string
    vo.nickName = 123
    vo.nickName = 'nick'

    // @ts-expect-error: role is readonly
    vo.role = 'user'

    assert.ok(ComplexModel)
    assert.strictEqual(vo.userId, 123)
  })

  it('Raw Data Type Mapping (MapToResult)', () => {
    const ComplexModelWithKeys = Model.define({
      id: 'user_id',
      name: {
        key: 'user_name',
        model: String,
      },
      age: {
        key: 'user_age',
        model: Number,
        optional: true,
      },
    })

    type ComplexDTO = typeof ComplexModelWithKeys.rawType

    const dto: ComplexDTO = {
      user_id: 456, // id: 'user_id' -> any
      user_name: 'John',
    }
    dto.user_age = 20

    assert.ok(ComplexModelWithKeys)
    assert.strictEqual(dto.user_id, 456)
  })

  it('Inheritance and Operations (extends, pick, omit)', () => {
    const Base = Model.define({
      id: Number,
      name: String,
    })

    const Extended = Base.extends({
      age: Number,
    })

    type ExtendedVO = typeof Extended.type
    const ext: ExtendedVO = {
      id: 1,
      name: 'a',
      age: 20,
    }

    const Picked = Base.pickExtends(['id'])
    type PickedVO = typeof Picked.type
    const picked: PickedVO = { id: 1 }
    // @ts-expect-error: name is omitted
    picked.name = 'a'

    const Omitted = Base.omitExtends(['name'])
    type OmittedVO = typeof Omitted.type
    const omitted: OmittedVO = { id: 1 }
    // @ts-expect-error: name is omitted
    omitted.name = 'a'

    assert.ok(Base && Extended && Picked && Omitted && ext && picked && omitted)
  })

  it('Enum Types', () => {
    const EnumModel = Model.define({
      status: {
        enum: {
          ACTIVE: 1,
          INACTIVE: 0,
        },
      },
      tags: {
        enum: [
          { key: 'A', value: 'a' },
          { key: 'B', value: 'b' },
        ],
      },
    })

    type EnumVO = typeof EnumModel.type
    const vo: EnumVO = {
      status: 1,
      tags: 'a',
    }
    // @ts-expect-error: status is value union (0 | 1)
    vo.status = 'ACTIVE'
    vo.status = 0

    assert.ok(EnumModel)
    assert.strictEqual(vo.status, 0)
  })
})
