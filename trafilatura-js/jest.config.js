/**
 * Jest 测试配置
 */

module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // 覆盖率收集
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/index.js', // 主入口只是导出，不需要覆盖率
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // 忽略转换的模块
  transformIgnorePatterns: ['node_modules/'],

  // 详细输出
  verbose: true,

  // 测试超时时间
  testTimeout: 10000,
};

