const XLSX = require('xlsx');
const fs = require('fs');

const filePath = './test_data.xls';
const data = fs.readFileSync(filePath);
const workbook = XLSX.read(data, { type: 'buffer' });

console.log('=== 解析测试开始 ===\n');
console.log('发现Sheets:', workbook.SheetNames.length);

workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length === 0) return;
  
  // 简单检测表类型
  const content = jsonData.slice(0, 10).map(r => r.join(' ')).join(' ');
  let type = 'unknown';
  
  if (content.includes('资产负债')) type = 'balance';
  else if (content.includes('利润') || content.includes('损益')) type = 'income';
  else if (content.includes('现金') && content.includes('流量')) type = 'cashflow';
  else if (content.includes('科目') && content.includes('余额')) type = 'subject';
  else if (content.includes('明细') && (content.includes('借方') || content.includes('贷方'))) type = 'ledger';
  else if (content.includes('概要') && content.includes('本年累计')) type = 'summary';
  else if (content.includes('账龄') || content.includes('30天')) type = 'aging';
  
  console.log(`[${sheetName}] -> ${type} (${jsonData.length}行)`);
});

console.log('\n=== 解析完成 ===');
