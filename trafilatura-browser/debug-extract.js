// 临时调试文件
import { extract } from './src/core/extract.js';

const html = '<div><p>测试</p></div>';

console.log('Testing extract with:', html);

try {
  const result = extract(html);
  console.log('Result:', result);
  console.log('Result type:', typeof result);
  console.log('Result length:', result ? result.length : 0);
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}

