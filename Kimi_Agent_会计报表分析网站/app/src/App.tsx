import { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileSpreadsheet, 
  ChevronRight,
  CheckCircle,
  Settings2,
  Building2,
  Plus,
  ChevronLeft,
  TrendingUp,
  Calendar,
  Trash2,
  ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import FileUpload from '@/components/FileUpload';
import AnalysisResult from '@/components/AnalysisResult';
import { parseExcelFile, calculateMetrics, generateSuggestions, type FinancialData, type DupontAnalysis, calculateDupont, setUnit, getCurrentUnit, type UnitType } from '@/utils/excelParser';
import type { AnalysisResult as AnalysisResultType } from '@/types/accounting';
import type { CompanyAccount, PeriodData } from '@/types/company';
import { 
  getAllCompanies, 
  getCurrentCompany, 
  setCurrentCompany, 
  createCompany, 
  deleteCompany,
  addPeriodData,
  deletePeriodData
} from '@/utils/companyStorage';
import { analyzeIncomeCostExpense, type IncomeCostExpenseAnalysis } from '@/utils/multiPeriodComparison';
import { Toaster, toast } from 'sonner';

// 视图模式
 type ViewMode = 'companies' | 'periods' | 'analysis' | 'multiPeriod';

function App() {
  // 公司管理状态
  const [companies, setCompanies] = useState<CompanyAccount[]>([]);
  const [currentCompany, setCurrentCompanyState] = useState<CompanyAccount | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('companies');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodData | null>(null);
  
  // 创建公司弹窗
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  
  // 上传期间数据
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [periodInput, setPeriodInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  // 分析结果
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [dupontData, setDupontData] = useState<DupontAnalysis | null>(null);
  
  // 多期对比分析
  const [multiPeriodAnalysis, setMultiPeriodAnalysis] = useState<IncomeCostExpenseAnalysis | null>(null);
  
  // 单位设置
  const [unit, setUnitState] = useState<UnitType>(getCurrentUnit());
  const [showUnitSelector, setShowUnitSelector] = useState(false);

  // 加载公司数据
  useEffect(() => {
    const loadedCompanies = getAllCompanies();
    setCompanies(loadedCompanies);
    const savedCurrent = getCurrentCompany();
    if (savedCurrent) {
      setCurrentCompanyState(savedCurrent);
    }
  }, []);

  // 创建公司
  const handleCreateCompany = () => {
    if (!newCompanyName.trim()) {
      toast.error('请输入公司名称');
      return;
    }
    const company = createCompany(newCompanyName.trim());
    setCompanies([...companies, company]);
    setCurrentCompanyState(company);
    setNewCompanyName('');
    setShowCreateCompany(false);
    toast.success(`已创建公司：${company.name}`);
  };

  // 选择公司
  const handleSelectCompany = (company: CompanyAccount) => {
    setCurrentCompanyState(company);
    setCurrentCompany(company.id);
    setViewMode('periods');
  };

  // 删除公司
  const handleDeleteCompany = (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除该公司及其所有数据吗？')) {
      deleteCompany(companyId);
      setCompanies(companies.filter(c => c.id !== companyId));
      if (currentCompany?.id === companyId) {
        setCurrentCompanyState(null);
        setViewMode('companies');
      }
      toast.success('公司已删除');
    }
  };

  // 删除期间数据
  const handleDeletePeriod = (periodId: string) => {
    if (!currentCompany) return;
    if (confirm('确定要删除该期间数据吗？')) {
      deletePeriodData(currentCompany.id, periodId);
      const updated = getAllCompanies();
      setCompanies(updated);
      const updatedCurrent = updated.find(c => c.id === currentCompany.id);
      if (updatedCurrent) {
        setCurrentCompanyState(updatedCurrent);
      }
      toast.success('期间数据已删除');
    }
  };

  // 从文件名提取期间
  const extractPeriodFromFilename = (filename: string): string => {
    // 匹配模式：202601、2026-01、2026年1月
    const patterns = [
      { regex: /(\d{4})(\d{2})/, format: (m: string[]) => `${m[1]}年${m[2]}月` },
      { regex: /(\d{4})-(\d{2})/, format: (m: string[]) => `${m[1]}年${m[2]}月` },
      { regex: /(\d{4})年(\d{1,2})月/, format: (m: string[]) => `${m[1]}年${m[2]}月` },
    ];
    
    for (const { regex, format } of patterns) {
      const match = filename.match(regex);
      if (match) return format(match);
    }
    
    return '';
  };

  // 单文件上传处理
  const handleFileSelect = async (file: File) => {
    if (!currentCompany) {
      toast.error('请先选择或创建公司');
      return;
    }
    
    // 尝试从文件名提取期间
    const autoPeriod = extractPeriodFromFilename(file.name);
    const finalPeriod = periodInput.trim() || autoPeriod;
    
    if (!finalPeriod) {
      toast.error('请输入期间（如：2024年Q1），或确保文件名包含日期信息');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.info(`正在解析 ${file.name}...`, { duration: 2000 });
      
      const data = await parseExcelFile(file);
      
      const metrics = calculateMetrics(data);
      const suggestions = generateSuggestions(data, metrics);
      const dupont = calculateDupont(data);
      
      const result: AnalysisResultType = {
        metrics,
        assets: { name: '资产类', accounts: [], totalDebit: data.totalAssets, totalCredit: 0 },
        liabilities: { name: '负债类', accounts: [], totalDebit: 0, totalCredit: data.totalLiabilities },
        equity: { name: '所有者权益', accounts: [], totalDebit: 0, totalCredit: data.totalEquity },
        income: { name: '收入类', accounts: [], totalDebit: 0, totalCredit: data.totalIncome },
        expenses: { name: '费用类', accounts: [], totalDebit: data.totalExpenses, totalCredit: 0 },
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
      
      const periodType: 'month' | 'quarter' | 'year' = 
        finalPeriod.includes('Q') ? 'quarter' : 
        finalPeriod.includes('月') ? 'month' : 'year';
      
      addPeriodData(
        currentCompany.id,
        finalPeriod,
        periodType,
        data,
        metrics,
        dupont
      );
      
      // 刷新公司数据
      const updated = getAllCompanies();
      setCompanies(updated);
      const updatedCurrent = updated.find(c => c.id === currentCompany.id);
      if (updatedCurrent) {
        setCurrentCompanyState(updatedCurrent);
      }
      
      setFinancialData(data);
      setDupontData(dupont);
      setAnalysisResult(result);
      setShowUploadDialog(false);
      setPeriodInput('');
      setViewMode('analysis');
      
      toast.success(`${finalPeriod} 数据已保存`);
    } catch (error) {
      console.error('分析失败:', error);
      toast.error(`${file.name} 分析失败: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 批量文件上传处理
  const handleBatchFilesSelect = async (files: File[]) => {
    if (!currentCompany) {
      toast.error('请先选择或创建公司');
      return;
    }

    setBatchFiles(files);
    setIsBatchProcessing(true);
    setBatchIndex(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBatchIndex(i + 1);
      
      try {
        // 从文件名提取期间
        const period = extractPeriodFromFilename(file.name);
        
        if (!period) {
          toast.error(`${file.name} 无法识别期间信息，跳过`);
          failCount++;
          continue;
        }

        toast.info(`正在处理 ${i + 1}/${files.length}: ${period}...`);
        
        const data = await parseExcelFile(file);
        const metrics = calculateMetrics(data);
        const dupont = calculateDupont(data);
        
        const periodType: 'month' | 'quarter' | 'year' = 
          period.includes('Q') ? 'quarter' : 
          period.includes('月') ? 'month' : 'year';
        
        addPeriodData(
          currentCompany.id,
          period,
          periodType,
          data,
          metrics,
          dupont
        );
        
        successCount++;
        toast.success(`${period} 上传成功`);
      } catch (error) {
        console.error(`处理 ${file.name} 失败:`, error);
        toast.error(`${file.name} 处理失败`);
        failCount++;
      }
    }

    // 刷新公司数据
    const updated = getAllCompanies();
    setCompanies(updated);
    const updatedCurrent = updated.find(c => c.id === currentCompany.id);
    if (updatedCurrent) {
      setCurrentCompanyState(updatedCurrent);
    }

    setIsBatchProcessing(false);
    setBatchFiles([]);
    setBatchIndex(0);
    setShowUploadDialog(false);
    setPeriodInput('');

    // 显示最终统计
    if (successCount > 0) {
      toast.success(`批量上传完成！成功: ${successCount}, 失败: ${failCount}`);
    } else {
      toast.error('批量上传失败，请检查文件格式');
    }
  };

  // 查看期间详情
  const handleViewPeriod = (period: PeriodData) => {
    setSelectedPeriod(period);
    
    // 转换数据格式
    const result: AnalysisResultType = {
      metrics: period.metrics,
      assets: { name: '资产类', accounts: [], totalDebit: period.financialData.totalAssets, totalCredit: 0 },
      liabilities: { name: '负债类', accounts: [], totalDebit: 0, totalCredit: period.financialData.totalLiabilities },
      equity: { name: '所有者权益', accounts: [], totalDebit: 0, totalCredit: period.financialData.totalEquity },
      income: { name: '收入类', accounts: [], totalDebit: 0, totalCredit: period.financialData.totalIncome },
      expenses: { name: '费用类', accounts: [], totalDebit: period.financialData.totalExpenses, totalCredit: 0 },
      summary: {
        totalAssets: period.financialData.totalAssets,
        totalLiabilities: period.financialData.totalLiabilities,
        totalEquity: period.financialData.totalEquity,
        totalIncome: period.financialData.totalIncome,
        totalExpenses: period.financialData.totalExpenses,
        netProfit: period.financialData.netProfit,
      },
      suggestions: [],
    };
    
    setFinancialData(period.financialData);
    setDupontData(period.dupontAnalysis);
    setAnalysisResult(result);
    setViewMode('analysis');
  };

  // 多期对比分析
  const handleMultiPeriodAnalysis = () => {
    if (!currentCompany || currentCompany.periods.length < 2) {
      toast.error('需要至少2期数据才能进行对比分析');
      return;
    }
    const analysis = analyzeIncomeCostExpense(currentCompany.periods);
    setMultiPeriodAnalysis(analysis);
    setViewMode('multiPeriod');
  };

  // 单位切换
  const handleUnitChange = (newUnit: UnitType) => {
    setUnit(newUnit);
    setUnitState(newUnit);
    toast.success(`已切换为${newUnit === 'yuan' ? '元' : newUnit === 'thousand' ? '千元' : '万元'}`);
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    if (unit === 'wan') return `${(amount / 10000).toFixed(2)}万`;
    if (unit === 'thousand') return `${(amount / 1000).toFixed(2)}千`;
    return amount.toLocaleString();
  };

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
                    {(['yuan', 'thousand', 'wan'] as UnitType[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => { handleUnitChange(u); setShowUnitSelector(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          unit === u ? 'bg-blue-50 text-blue-600' : ''
                        } ${u === 'yuan' ? 'first:rounded-t-lg' : ''} ${u === 'wan' ? 'last:rounded-b-lg' : ''}`}
                      >
                        {u === 'yuan' ? '元' : u === 'thousand' ? '千元' : '万元'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 返回公司列表按钮 */}
              {viewMode !== 'companies' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setViewMode('companies');
                    setCurrentCompanyState(null);
                    setCurrentCompany(null);
                  }}
                  className="gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  公司列表
                </Button>
              )}
              
              <Button variant="outline" size="sm">
                使用说明
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========== 视图1：公司列表 ========== */}
        {viewMode === 'companies' && (
          <div className="space-y-8">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">公司账套管理</h2>
              <p className="text-gray-500">选择或创建公司，管理多期财务数据</p>
            </div>

            {/* 创建公司按钮 */}
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowCreateCompany(true)}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-4 h-4" />
                新建公司账套
              </Button>
            </div>

            {/* 创建公司弹窗 */}
            {showCreateCompany && (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>新建公司</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="请输入公司名称"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCreateCompany} className="flex-1">创建</Button>
                    <Button variant="outline" onClick={() => setShowCreateCompany(false)}>取消</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 公司列表 */}
            {companies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => (
                  <Card 
                    key={company.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow group"
                    onClick={() => handleSelectCompany(company)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{company.name}</h3>
                            <p className="text-sm text-gray-500">{company.periods.length} 期数据</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteCompany(company.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {company.periods.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">最近期间：</p>
                          <div className="flex flex-wrap gap-1">
                            {company.periods.slice(-3).map(p => (
                              <Badge key={p.id} variant="secondary" className="text-xs">
                                {p.period}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        className="w-full mt-4 text-blue-600"
                      >
                        进入查看 <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>暂无公司账套</p>
                <p className="text-sm mt-1">点击上方按钮创建第一个公司</p>
              </div>
            )}
          </div>
        )}

        {/* ========== 视图2：公司期间列表 ========== */}
        {viewMode === 'periods' && currentCompany && (
          <div className="space-y-6">
            {/* 标题栏 */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentCompany.name}</h2>
                <p className="text-gray-500">期间数据管理</p>
              </div>
              <div className="flex gap-2">
                {currentCompany.periods.length >= 2 && (
                  <Button 
                    variant="outline" 
                    onClick={handleMultiPeriodAnalysis}
                    className="gap-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    多期对比
                  </Button>
                )}
                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="w-4 h-4" />
                  上传期间数据
                </Button>
              </div>
            </div>

            {/* 上传弹窗 */}
            {showUploadDialog && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>上传期间数据</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 手动输入期间（可选，用于单文件上传时覆盖自动识别） */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      期间（可选）
                    </label>
                    <Input
                      placeholder="如：2024年Q1、2024年1月（留空则从文件名自动识别）"
                      value={periodInput}
                      onChange={(e) => setPeriodInput(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      支持从文件名自动识别期间（如：深圳原创202601.xls → 2026年01月）
                    </p>
                  </div>
                  
                  <FileUpload 
                    onFileSelect={handleFileSelect}
                    onFilesSelect={handleBatchFilesSelect}
                    isProcessing={isProcessing || isBatchProcessing}
                    multiple={true}
                    currentIndex={batchIndex}
                    totalCount={batchFiles.length}
                  />
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowUploadDialog(false);
                      setBatchFiles([]);
                      setBatchIndex(0);
                    }} 
                    className="w-full"
                  >
                    取消
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 期间数据表格 */}
            {currentCompany.periods.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">期间</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">收入</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">成本</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">费用</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">净利润</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[...currentCompany.periods].sort((a, b) => a.periodDate.localeCompare(b.periodDate)).map((period) => (
                        <tr key={period.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{period.period}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {formatAmount(period.financialData.totalIncome)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {formatAmount(period.financialData.totalExpenses * 0.7)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {formatAmount(period.financialData.totalExpenses)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            {formatAmount(period.financialData.netProfit)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleViewPeriod(period)}
                              >
                                查看分析
                              </Button>
                              <button
                                onClick={() => handleDeletePeriod(period.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>暂无期间数据</p>
                <p className="text-sm mt-1">点击"上传期间数据"按钮添加</p>
              </div>
            )}
          </div>
        )}

        {/* ========== 视图3：单期详细分析 ========== */}
        {viewMode === 'analysis' && analysisResult && financialData && dupontData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setViewMode('periods')}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  返回期间列表
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentCompany?.name}</h2>
                  <p className="text-gray-500">{selectedPeriod?.period} 财务分析报告</p>
                </div>
              </div>
            </div>

            <Separator />

            <AnalysisResult 
              key={unit}
              result={analysisResult}
              financialData={financialData}
              dupontData={dupontData}
            />
          </div>
        )}

        {/* ========== 视图4：多期对比分析 ========== */}
        {viewMode === 'multiPeriod' && multiPeriodAnalysis && currentCompany && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setViewMode('periods')}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                返回
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentCompany.name}</h2>
                <p className="text-gray-500">多期收入/成本/费用对比分析</p>
              </div>
            </div>

            {/* 趋势概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className={multiPeriodAnalysis.trends.revenueTrend === 'up' ? 'bg-green-50 border-green-200' : multiPeriodAnalysis.trends.revenueTrend === 'down' ? 'bg-red-50 border-red-200' : 'bg-gray-50'}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">收入趋势</p>
                  <p className={`text-2xl font-bold ${multiPeriodAnalysis.trends.revenueTrend === 'up' ? 'text-green-700' : multiPeriodAnalysis.trends.revenueTrend === 'down' ? 'text-red-700' : 'text-gray-700'}`}>
                    {multiPeriodAnalysis.trends.revenueTrend === 'up' ? '↗ 上升' : multiPeriodAnalysis.trends.revenueTrend === 'down' ? '↘ 下降' : '→ 稳定'}
                  </p>
                </CardContent>
              </Card>
              <Card className={multiPeriodAnalysis.trends.costTrend === 'up' ? 'bg-red-50 border-red-200' : multiPeriodAnalysis.trends.costTrend === 'down' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">成本趋势</p>
                  <p className={`text-2xl font-bold ${multiPeriodAnalysis.trends.costTrend === 'up' ? 'text-red-700' : multiPeriodAnalysis.trends.costTrend === 'down' ? 'text-green-700' : 'text-gray-700'}`}>
                    {multiPeriodAnalysis.trends.costTrend === 'up' ? '↗ 上升' : multiPeriodAnalysis.trends.costTrend === 'down' ? '↘ 下降' : '→ 稳定'}
                  </p>
                </CardContent>
              </Card>
              <Card className={multiPeriodAnalysis.trends.expenseTrend === 'up' ? 'bg-red-50 border-red-200' : multiPeriodAnalysis.trends.expenseTrend === 'down' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">费用趋势</p>
                  <p className={`text-2xl font-bold ${multiPeriodAnalysis.trends.expenseTrend === 'up' ? 'text-red-700' : multiPeriodAnalysis.trends.expenseTrend === 'down' ? 'text-green-700' : 'text-gray-700'}`}>
                    {multiPeriodAnalysis.trends.expenseTrend === 'up' ? '↗ 上升' : multiPeriodAnalysis.trends.expenseTrend === 'down' ? '↘ 下降' : '→ 稳定'}
                  </p>
                </CardContent>
              </Card>
              <Card className={multiPeriodAnalysis.trends.profitTrend === 'up' ? 'bg-green-50 border-green-200' : multiPeriodAnalysis.trends.profitTrend === 'down' ? 'bg-red-50 border-red-200' : 'bg-gray-50'}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">利润趋势</p>
                  <p className={`text-2xl font-bold ${multiPeriodAnalysis.trends.profitTrend === 'up' ? 'text-green-700' : multiPeriodAnalysis.trends.profitTrend === 'down' ? 'text-red-700' : 'text-gray-700'}`}>
                    {multiPeriodAnalysis.trends.profitTrend === 'up' ? '↗ 上升' : multiPeriodAnalysis.trends.profitTrend === 'down' ? '↘ 下降' : '→ 稳定'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 详细数据表格 */}
            <Card>
              <CardHeader>
                <CardTitle>期间对比详情</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">期间</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">收入</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">收入环比</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">成本率</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">费用率</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">毛利率</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">净利率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {multiPeriodAnalysis.periods.map((period, idx) => (
                      <tr key={period} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{period}</td>
                        <td className="px-4 py-3 text-right">{formatAmount(multiPeriodAnalysis.revenue[idx]?.totalRevenue || 0)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={multiPeriodAnalysis.revenue[idx]?.growthRate > 0 ? 'text-green-600' : multiPeriodAnalysis.revenue[idx]?.growthRate < 0 ? 'text-red-600' : 'text-gray-500'}>
                            {multiPeriodAnalysis.revenue[idx]?.growthRate > 0 ? '+' : ''}{multiPeriodAnalysis.revenue[idx]?.growthRate?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{multiPeriodAnalysis.cost[idx]?.costRatio?.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{multiPeriodAnalysis.expense[idx]?.expenseRatio?.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{multiPeriodAnalysis.profit[idx]?.grossMargin?.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">{multiPeriodAnalysis.profit[idx]?.netMargin?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* 分析建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  分析建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {multiPeriodAnalysis.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
