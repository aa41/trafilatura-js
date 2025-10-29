#!/bin/bash

# Trafilatura.js 测试运行脚本
# 提供更友好的测试运行方式

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 打印标题
print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# 检查 Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    print_success "Node.js 版本: $NODE_VERSION"
}

# 检查依赖
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "依赖未安装，正在安装..."
        npm install
    else
        print_success "依赖已安装"
    fi
}

# 运行所有测试
run_all_tests() {
    print_header "运行所有测试"
    npm test
}

# 运行特定测试文件
run_specific_test() {
    print_header "运行测试: $1"
    npm test -- "$1"
}

# 运行测试覆盖率
run_coverage() {
    print_header "运行测试覆盖率分析"
    npm run test:coverage
    
    if [ -f "coverage/lcov-report/index.html" ]; then
        print_success "覆盖率报告已生成"
        print_info "查看报告: coverage/lcov-report/index.html"
        
        # 尝试在浏览器中打开
        if command -v open &> /dev/null; then
            open coverage/lcov-report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open coverage/lcov-report/index.html
        fi
    fi
}

# 监听模式
run_watch() {
    print_header "启动测试监听模式"
    print_info "文件改动时自动运行测试"
    print_info "按 Ctrl+C 退出"
    npm run test:watch
}

# 运行单元测试
run_unit_tests() {
    print_header "运行单元测试"
    npm test -- tests/unit/
}

# 运行集成测试
run_integration_tests() {
    print_header "运行集成测试"
    npm test -- tests/integration/
}

# 快速测试（只测试改动的文件）
run_quick_test() {
    print_header "快速测试（只测试改动的文件）"
    npm test -- --onlyChanged
}

# 清理测试缓存
clean_cache() {
    print_header "清理测试缓存"
    npm test -- --clearCache
    print_success "缓存已清理"
}

# 生成测试报告
generate_report() {
    print_header "生成测试报告"
    npm test -- --json --outputFile=test-results.json
    print_success "报告已生成: test-results.json"
}

# 显示帮助信息
show_help() {
    echo "Trafilatura.js 测试脚本"
    echo ""
    echo "用法: ./scripts/test.sh [选项]"
    echo ""
    echo "选项:"
    echo "  all              运行所有测试（默认）"
    echo "  unit             只运行单元测试"
    echo "  integration      只运行集成测试"
    echo "  coverage, cov    运行测试并生成覆盖率报告"
    echo "  watch, w         监听模式，文件改动时自动测试"
    echo "  quick, q         快速测试（只测试改动的文件）"
    echo "  clean            清理测试缓存"
    echo "  report           生成 JSON 格式测试报告"
    echo "  <file>           运行特定测试文件"
    echo "  help, -h, --help 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./scripts/test.sh                    # 运行所有测试"
    echo "  ./scripts/test.sh coverage           # 生成覆盖率报告"
    echo "  ./scripts/test.sh watch              # 监听模式"
    echo "  ./scripts/test.sh text-utils.test.js # 运行特定测试"
    echo ""
}

# 主函数
main() {
    # 确保在项目根目录
    if [ ! -f "package.json" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 检查环境
    check_node
    check_dependencies
    
    # 根据参数执行相应操作
    case "${1:-all}" in
        all)
            run_all_tests
            ;;
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        coverage|cov)
            run_coverage
            ;;
        watch|w)
            run_watch
            ;;
        quick|q)
            run_quick_test
            ;;
        clean)
            clean_cache
            ;;
        report)
            generate_report
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            run_specific_test "$1"
            ;;
    esac
}

# 运行主函数
main "$@"

