import { useState, useMemo } from 'react';
import { formatCurrencyUniform } from '@/utils/excelParser';
import { analyzeLedger, type LedgerData, type LedgerAnalysis } from '@/utils/ledgerAnalysis';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  ArrowLeft,
  FileText,
  Hash,
  DollarSign,
  CheckCircle
} from 'lucide-react';

interface LedgerViewerProps {
  ledgers: LedgerData[];
  onClose?: () => void;
}

export const LedgerViewer: React.FC<LedgerViewerProps> = ({ ledgers, onClose }) => {
  const [selectedLedger, setSelectedLedger] = useState<LedgerData | null>(null);
  
  if (ledgers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>未找到明细分类账数据</p>
        <p className="text-sm mt-2">请确保Excel文件中包含"明细分类账"工作表</p>
      </div>
    );
  }
  
  // 如果已选择具体科目，显示明细
  if (selectedLedger) {
    return (
      <LedgerDetail 
        ledger={selectedLedger} 
        onBack={() => setSelectedLedger(null)} 
      />
    );
  }
  
  // 显示科目列表
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">明细分类账</h3>
          <p className="text-sm text-gray-500">共 {ledgers.length} 个科目</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            返回
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ledgers.map((ledger, index) => (
          <LedgerCard 
            key={index} 
            ledger={ledger} 
            onClick={() => setSelectedLedger(ledger)}
          />
        ))}
      </div>
    </div>
  );
};

// 科目卡片
const LedgerCard: React.FC<{ ledger: LedgerData; onClick: () => void }> = ({ ledger, onClick }) => {
  const analysis = useMemo(() => analyzeLedger(ledger), [ledger]);
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{ledger.subjectName}</h4>
            <p className="text-xs text-gray-500">{ledger.subjectCode}</p>
          </div>
          <Eye className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-xs text-gray-500">借方</p>
            <p className="font-medium text-blue-700">{formatCurrencyUniform(ledger.totalDebit)}</p>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <p className="text-xs text-gray-500">贷方</p>
            <p className="font-medium text-red-700">{formatCurrencyUniform(ledger.totalCredit)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{ledger.entries.length}笔交易</span>
          {analysis.counterpartyAnalysis.length > 0 && (
            <>
              <span>•</span>
              <span>{analysis.counterpartyAnalysis.length}个往来单位</span>
            </>
          )}
          {analysis.anomalies.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {analysis.anomalies.length}个异常
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 明细详情
const LedgerDetail: React.FC<{ ledger: LedgerData; onBack: () => void }> = ({ ledger, onBack }) => {
  const analysis = useMemo(() => analyzeLedger(ledger), [ledger]);
  
  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div>
          <h3 className="text-lg font-medium">{ledger.subjectName}</h3>
          <p className="text-sm text-gray-500">{ledger.subjectCode} • {ledger.period}</p>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="期初余额" 
          value={ledger.beginningBalance} 
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard 
          title="借方发生额" 
          value={ledger.totalDebit} 
          type="positive"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard 
          title="贷方发生额" 
          value={ledger.totalCredit} 
          type="negative"
          icon={<TrendingUp className="w-4 h-4 rotate-180" />}
        />
        <StatCard 
          title="交易笔数" 
          value={ledger.entries.length} 
          isCount
          icon={<Hash className="w-4 h-4" />}
        />
      </div>
      
      {/* 详细分析 */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">交易明细</TabsTrigger>
          <TabsTrigger value="counterparties">往来单位</TabsTrigger>
          <TabsTrigger value="large">大额交易</TabsTrigger>
          <TabsTrigger value="anomalies">异常检测</TabsTrigger>
        </TabsList>
        
        {/* 交易明细 */}
        <TabsContent value="transactions">
          <TransactionTable entries={ledger.entries} />
        </TabsContent>
        
        {/* 往来单位 */}
        <TabsContent value="counterparties">
          <CounterpartyTable counterparties={analysis.counterpartyAnalysis} />
        </TabsContent>
        
        {/* 大额交易 */}
        <TabsContent value="large">
          <LargeTransactionTable transactions={analysis.largeTransactions} />
        </TabsContent>
        
        {/* 异常检测 */}
        <TabsContent value="anomalies">
          <AnomalyList anomalies={analysis.anomalies} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// 统计卡片
const StatCard: React.FC<{
  title: string;
  value: number;
  type?: 'positive' | 'negative' | 'neutral';
  isCount?: boolean;
  icon: React.ReactNode;
}> = ({ title, value, type = 'neutral', isCount, icon }) => {
  const colorClass = type === 'positive' 
    ? 'text-green-600' 
    : type === 'negative' 
      ? 'text-red-600' 
      : 'text-gray-900';
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <p className={`text-xl font-bold ${colorClass}`}>
        {isCount ? value : formatCurrencyUniform(value)}
      </p>
    </div>
  );
};

// 交易明细表
const TransactionTable: React.FC<{ entries: LedgerData['entries'] }> = ({ entries }) => {
  const filteredEntries = entries.filter(e => 
    !e.summary.includes('期初') && 
    !e.summary.includes('合计') && 
    !e.summary.includes('累计')
  );
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">日期</TableHead>
                <TableHead className="w-20">凭证号</TableHead>
                <TableHead>摘要</TableHead>
                <TableHead>辅助核算</TableHead>
                <TableHead className="text-right">借方</TableHead>
                <TableHead className="text-right">贷方</TableHead>
                <TableHead className="text-right">余额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell className="text-sm">{entry.date}</TableCell>
                  <TableCell className="text-sm text-gray-500">{entry.voucherNo}</TableCell>
                  <TableCell className="text-sm">{entry.summary}</TableCell>
                  <TableCell className="text-sm text-gray-500">{entry.auxiliary}</TableCell>
                  <TableCell className="text-right text-sm">
                    {entry.debit > 0 && (
                      <span className="text-green-600">{formatCurrencyUniform(entry.debit)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {entry.credit > 0 && (
                      <span className="text-red-600">{formatCurrencyUniform(entry.credit)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrencyUniform(entry.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// 往来单位表
const CounterpartyTable: React.FC<{ counterparties: LedgerAnalysis['counterpartyAnalysis'] }> = ({ 
  counterparties 
}) => {
  if (counterparties.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>未识别到往来单位信息</p>
      </div>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>往来单位</TableHead>
                <TableHead className="text-right">借方（收款）</TableHead>
                <TableHead className="text-right">贷方（付款）</TableHead>
                <TableHead className="text-right">净额</TableHead>
                <TableHead className="text-center">笔数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counterparties.map((c, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {c.totalDebit > 0 && formatCurrencyUniform(c.totalDebit)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {c.totalCredit > 0 && formatCurrencyUniform(c.totalCredit)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    c.netAmount > 0 ? 'text-green-600' : c.netAmount < 0 ? 'text-red-600' : ''
                  }`}>
                    {formatCurrencyUniform(c.netAmount)}
                  </TableCell>
                  <TableCell className="text-center">{c.transactionCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// 大额交易表
const LargeTransactionTable: React.FC<{ transactions: LedgerAnalysis['largeTransactions'] }> = ({ 
  transactions 
}) => {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        暂无大额交易数据
      </div>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">排名</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>摘要</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead className="text-right">占比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 p-0 flex items-center justify-center">
                      {t.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{t.entry.date}</TableCell>
                  <TableCell className="text-sm">{t.entry.summary}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrencyUniform(Math.max(t.entry.debit, t.entry.credit))}
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-500">
                    {t.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// 异常列表
const AnomalyList: React.FC<{ anomalies: LedgerAnalysis['anomalies'] }> = ({ anomalies }) => {
  if (anomalies.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <p className="text-gray-600">未发现明显异常</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {anomalies.map((anomaly, index) => (
        <div 
          key={index}
          className={`p-4 rounded-lg border ${
            anomaly.riskLevel === 'high' 
              ? 'bg-red-50 border-red-200' 
              : anomaly.riskLevel === 'medium'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
              anomaly.riskLevel === 'high' ? 'text-red-500' : 
              anomaly.riskLevel === 'medium' ? 'text-orange-500' : 'text-yellow-500'
            }`} />
            <div>
              <p className="font-medium text-gray-900">{anomaly.description}</p>
              <p className="text-sm text-gray-600 mt-1">
                涉及 {anomaly.entries.length} 笔交易
              </p>
              <div className="mt-2 space-y-1">
                {anomaly.entries.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-xs text-gray-500">
                    {e.date} {e.summary} {formatCurrencyUniform(Math.max(e.debit, e.credit))}
                  </p>
                ))}
                {anomaly.entries.length > 3 && (
                  <p className="text-xs text-gray-400">还有 {anomaly.entries.length - 3} 笔...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LedgerViewer;
