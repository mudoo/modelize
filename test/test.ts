import * as assert from 'assert'

interface TestRule {
  /** 测试标题 */
  title?: string
  /** 测试结果, 默认为true */
  result?: any
  /** 测试处理函数 */
  handler: () => any
}

interface TestRules {
  [key: string]: TestRule[]
}

/**
 *
 * @param {Function} handle 测试处理函数
 * @param {Array} rules 测试规则
 * rules = {
 *   title: '测试标题',
 *   result: 结果,
 *   handle: function(ruleResult) {
 *     // 处理rule执行后的结果
 *   }
 * }
 */
export default function test (testRules: TestRules) {
  return () => {
    for (const k in testRules) {
      if (!Object.prototype.hasOwnProperty.call(testRules, k)) continue
      const rules = testRules[k]
      // test(storage[k], rules, storage)

      describe(k, () => {
        rules.forEach((rule, i) => {
          const value = rule.handler()
          let result = rule.result
          if (typeof result === 'function') {
            result = rule.result(value)
          }
          if (result === undefined) result = true

          const title = (rule.title || k + '-' + i) + ` => ${JSON.stringify(result)}`

          it(title, function () {
            assert.equal(value, result)
          })
        })
      })
    }
  }
}
