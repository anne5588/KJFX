import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  isProcessing: boolean;
  multiple?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  onFilesSelect,
  isProcessing,
  multiple = false,
  currentIndex = 0,
  totalCount = 0
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError(`文件 "${file.name}" 格式不支持，请上传Excel或CSV文件`);
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError(`文件 "${file.name}" 超过10MB限制`);
      return false;
    }
    
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (validateFile(files[i])) {
        validFiles.push(files[i]);
      }
    }

    if (validFiles.length === 0) return;

    if (multiple) {
      setSelectedFiles(validFiles);
      if (onFilesSelect) {
        onFilesSelect(validFiles);
      }
    } else {
      setSelectedFiles([validFiles[0]]);
      onFileSelect(validFiles[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [multiple]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveFile = (index?: number) => {
    if (index !== undefined && multiple) {
      const newFiles = [...selectedFiles];
      newFiles.splice(index, 1);
      setSelectedFiles(newFiles);
    } else {
      setSelectedFiles([]);
    }
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // 从文件名提取期间信息
  const extractPeriodFromFilename = (filename: string): string => {
    const patterns = [
      /(\d{4})(\d{2})/,      // 202601
      /(\d{4})-(\d{2})/,     // 2026-01
      /(\d{4})年(\d{1,2})月/, // 2026年1月
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return `${match[1]}年${match[2]}月`;
      }
    }
    
    return '';
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleInputChange}
        className="hidden"
        multiple={multiple}
      />
      
      {!hasFiles ? (
        <div
          onClick={handleButtonClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            upload-zone rounded-2xl p-12 cursor-pointer text-center
            ${isDragActive ? 'active' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Upload className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                点击或拖拽上传科目余额表
              </p>
              <p className="text-sm text-gray-500 mb-1">
                支持 Excel (.xlsx, .xls) 和 CSV 格式，文件大小不超过 10MB
              </p>
              {multiple && (
                <p className="text-sm text-blue-600 font-medium">
                  💡 支持多选文件，批量上传多期数据
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              className="mt-4 border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {multiple ? '选择多个文件' : '选择文件'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          {/* 批量上传进度 */}
          {multiple && totalCount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  批量上传进度
                </span>
                <span className="text-sm text-blue-600">
                  {currentIndex} / {totalCount}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(currentIndex / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 文件列表 */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => {
              const period = extractPeriodFromFilename(file.name);
              const isProcessingThis = isProcessing && multiple && index === currentIndex - 1;
              const isDone = multiple && index < currentIndex;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isProcessingThis ? 'border-blue-300 bg-blue-50' :
                    isDone ? 'border-green-300 bg-green-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDone ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {isDone ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : isProcessingThis ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <File className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        {period && (
                          <>
                            <span>·</span>
                            <span className="text-blue-600 font-medium">检测到期间: {period}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={() => handleRemoveFile(multiple ? index : undefined)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 清空按钮 */}
          {!isProcessing && multiple && selectedFiles.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <span className="text-sm text-gray-500">
                共 {selectedFiles.length} 个文件
              </span>
              <button
                onClick={() => handleRemoveFile()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                清空全部
              </button>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUpload;
