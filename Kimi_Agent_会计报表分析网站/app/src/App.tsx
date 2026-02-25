import { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileSpreadsheet, 
  BarChart3, 
  Shield, 
  Zap,
  ChevronRight,
  CheckCircle,
  History,
  Clock,
  X,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import FileUpload from '@/components/FileUpload';
import AnalysisResult from '@/components/AnalysisResult';
import { parseExcelFile, calculateMetrics, generateSuggestions, type FinancialData, type DupontAnalysis, calculateDupont, setUnit, getCurrentUnit, type UnitType } from '@/utils/excelParser';
import type { AnalysisResult as AnalysisResultType } from '@/types/accounting';
import { Toaster, toast } from 'sonner';

// 历史记录类型
interface HistoryItem {
  id: string;
  fileName: string;
  timestamp: number;
  dateStr: string;
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    netProfit: number;
  };
  // 存储完整数据
  analysisResult: AnalysisResultType;
  financialData: FinancialData;
  dupontData: DupontAnalysis;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [dupontData, setDupontData] = useState<DupontAnalysis | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [unit, setUnitState] = useState<UnitType>(getCurrentUnit());
  const [showUnitSelector, setShowUnitSelector] = useState(false);

  // 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('accounting_analysis_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // 转换Map对象
        const restored = parsed.map((item: any) => ({
          ...item,
          financialData: {
            ...item.financialData,
            assets: new Map(item.financialData.assets || []),
            liabilities: new Map(item.financialData.liabilities || []),
            equity: new Map(item.financialData.equity || []),
            income: new Map(item.financialData.income || []),
            expenses: new Map(item.financialData.expenses || []),
          }
        }));
        setHistory(restored);
      } catch (e) {
        console.error('加载历史记录失败:', e);
      }
    }
  }, []);

  // 保存历史记录
  const saveToHistory = (
    fileName: string,
    result: AnalysisResultType,
    fData: FinancialData,
    dData: DupontAnalysis
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fileName,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString('zh-CN'),
      summary: {
        totalAssets: fData.totalAssets,
        totalLiabilities: fData.totalLiabilities,
        totalEquity: fData.totalEquity,
        netProfit: fData.netProfit,
      },
      analysisResult: result,
      financialData: {
        ...fData,
        assets: Array.from(fData.assets.entries()),
        liabilities: Array.from(fData.liabilities.entries()),
        equity: Array.from(fData.equity.entries()),
        income: Array.from(fData.income.entries()),
        expenses: Array.from(fData.expenses.entries()),
      } as any,
      dupontData: dData,
    };

    const newHistory = [newItem, ...history].slice(0, 10); // 最多保存10条
    setHistory(newHistory);
    localStorage.setItem('accounting_analysis_history', JSON.stringify(newHistory));
  };

  // 加载历史记录
  const loadHistoryItem = (item: HistoryItem) => {
    setAnalysisResult(item.analysisResult);
    setFinancialData({
      ...item.financialData,
      assets: new Map(item.financialData.assets as any),
      liabilities: new Map(item.financialData.liabilities as any),
      equity: new Map(item.financialData.equity as any),
      income: new Map(item.financialData.income as any),
      expenses: new Map(item.financialData.expenses as any),
    });
    setDupontData(item.dupontData);
    setHasAnalyzed(true);
    setShowHistory(false);
    toast.success('已加载历史记录');
  };

  // 删除历史记录
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('accounting_analysis_history', JSON.stringify(newHistory));
    toast.success('已删除历史记录');
  };

  const handleUnitChange = (newUnit: UnitType) => {
    setUnit(newUnit);
    setUnitState(newUnit);
    toast.success(`已切换为${newUnit === 'yuan' ? '元' : newUnit === 'thousand' ? '千元' : '万元'}`);
  };

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setHasAnalyzed(false);
    
    try {
      toast.info('正在解析文件...', { duration: 2000 });
      
      const data = await parseExcelFile(file);
      
      toast.success(`成功识别 ${data.assets.size + data.liabilities.size + data.income.size} 个财务项目`);
      
      toast.info('正在进行财务分析...', { duration: 2000 });
      
      const metrics = calculateMetrics(data);
      const suggestions = generateSuggestions(data, metrics);
      const dupont = calculateDupont(data);
      
      const result: AnalysisResultType = {
        metrics,
        assets: {
          name: '资产类',
          accounts: [],
          totalDebit: data.totalAssets,
          totalCredit: 0,
        },
        liabilities: {
          name: '负债类',
          accounts: [],
          totalDebit: 0,
          totalCredit: data.totalLiabilities,
        },
        equity: {
          name: '所有者权益',
          accounts: [],
          totalDebit: 0,
          totalCredit: data.totalEquity,
        },
        income: {
          name: '收入类',
          accounts: [],
          totalDebit: 0,
          totalCredit: data.totalIncome,
        },
        expenses: {
          name: '费用类',
          accounts: [],
          totalDebit: data.totalExpenses,
          totalCredit: 0,
        },
        summary: {
          totalAssets: data.totalAssets,
          totalLiabilities: data.totalLiabilities,
          totalEquity: data.totalEquity,
          totalIncome: data.totalIncome,
          totalExpenses: data.totalExpenses,
          netProfit: data.netProfit,
        },
        suggestions,
      };
      
      setFinancialData(data);
      setDupontData(dupont);
      setAnalysisResult(result);
      setHasAnalyzed(true);
      
      // 保存到历史记录
      saveToHistory(file.name, result, data, dupont);
      
      toast.success('财务分析完成！');
      
    } catch (error) {
      console.error('分析失败:', error);
      toast.error('分析失败: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      title: '智能识别',
      description: '自动识别Excel科目余额表，支持多种格式',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: '深度分析',
      description: '计算20+财务指标，全面评估企业财务状况',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: '即时反馈',
      description: '秒级分析速度，实时展示分析结果',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '数据安全',
      description: '本地分析处理，数据不会上传服务器',
    },
  ];

  const steps = [
    '上传科目余额表（Excel格式）',
    '系统自动解析财务数据',
    '计算各项财务指标',
    '生成详细分析报告',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  会计智能分析平台
                </h1>
                <p className="text-xs text-gray-500">AI-powered Accounting Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:inline">专业 · 智能 · 高效</span>
              
              {/* 单位选择器 */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUnitSelector(!showUnitSelector)}
                  className="gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  单位: {unit === 'yuan' ? '元' : unit === 'thousand' ? '千元' : '万元'}
                </Button>
                
                {showUnitSelector && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={() => { handleUnitChange('yuan'); setShowUnitSelector(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg ${unit === 'yuan' ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      元
                    </button>
                    <button
                      onClick={() => { handleUnitChange('thousand'); setShowUnitSelector(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${unit === 'thousand' ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      千元
                    </button>
                    <button
                      onClick={() => { handleUnitChange('wan'); setShowUnitSelector(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 last:rounded-b-lg ${unit === 'wan' ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      万元
                    </button>
                  </div>
                )}
              </div>

              {/* 历史记录按钮 */}
              {history.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="gap-2"
                >
                  <History className="w-4 h-4" />
                  历史记录 ({history.length})
                </Button>
              )}
              
              <Button variant="outline" size="sm">
                使用说明
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 历史记录下拉面板 */}
      {showHistory && history.length > 0 && (
        <div className="fixed top-16 right-4 z-50 w-96 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              分析历史记录
            </h3>
            <button 
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className="p-4 hover:bg-gray-50 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.fileName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.dateStr}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>资产: {(item.summary.totalAssets / 10000).toFixed(2)}万</span>
                      <span>净利润: {(item.summary.netProfit / 10000).toFixed(2)}万</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasAnalyzed ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center space-y-6 py-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                <span>智能财务分析工具</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                上传科目余额表
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  即刻获取专业财务分析
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                基于先进的财务分析算法，自动计算偿债能力、营运能力、盈利能力等关键指标，
                帮助企业快速了解财务状况，发现潜在风险与机会。
              </p>
            </section>

            {/* Upload Section */}
            <section className="max-w-3xl mx-auto">
              <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            </section>

            {/* Features Section */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <div className="text-blue-600">{feature.icon}</div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* How It Works */}
            <section className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">如何使用</h3>
                <p className="text-gray-500">简单四步，快速获取财务分析报告</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-gray-700">{step}</p>
                      {index < steps.length - 1 && (
                        <ChevronRight className="w-5 h-5 text-gray-300 hidden lg:block mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Supported Formats */}
            <section className="text-center">
              <p className="text-sm text-gray-500 mb-4">支持的文件格式</p>
              <div className="flex items-center justify-center gap-4">
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  .xlsx
                </span>
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  .xls
                </span>
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  .csv
                </span>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Results */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">财务分析报告</h2>
                <p className="text-gray-500">基于上传的科目余额表生成</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setHasAnalyzed(false);
                    setAnalysisResult(null);
                  }}
                >
                  重新分析
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => toast.info('导出功能开发中...')}
                >
                  导出报告
                </Button>
              </div>
            </div>

            <Separator />

            {analysisResult && financialData && dupontData && (
              <AnalysisResult 
                key={unit} // 单位改变时强制重新渲染
                result={analysisResult} 
                financialData={financialData}
                dupontData={dupontData}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">会计智能分析平台</span>
            </div>
            <p className="text-sm text-gray-500">
              本工具仅供参考，具体财务决策请咨询专业会计师
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4" />
              <span>数据本地处理，安全有保障</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
