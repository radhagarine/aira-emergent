// Fixed FileManager.tsx with improved error handling and debugging
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, FileText, Loader2, AlertCircle, File, Database, Info } from 'lucide-react';
import { KnowledgeBaseFile } from '@/lib/services/file/types';
import { toast } from 'sonner';
import { useSupabase } from '@/components/providers/supabase-provider';

interface FileManagerProps {
  businessId: string;
  knowledgeBaseFiles: KnowledgeBaseFile[];
  csvFile: File | null;
  setCsvFile: React.Dispatch<React.SetStateAction<File | null>>;
  onFileUpload: (file: File) => Promise<void>;
  onFileRemove: (fileName: string) => Promise<void>;
}

const FileManager: React.FC<FileManagerProps> = ({
  businessId,
  knowledgeBaseFiles,
  csvFile,
  setCsvFile,
  onFileUpload,
  onFileRemove
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [activeFileTab, setActiveFileTab] = useState('knowledge-base');
  const { supabase } = useSupabase();
  
  // Debug logging for props
  useEffect(() => {
    // Component mounted successfully
  }, [businessId, knowledgeBaseFiles, csvFile, supabase]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle knowledge base file upload
  const handleKnowledgeBaseFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files.length) {
      return;
    }

    try {
      // Check file size (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const validFiles = Array.from(files).filter(file => file.size <= MAX_SIZE);

      if (validFiles.length !== files.length) {
        toast.error('Some files exceeded the 10MB size limit');
        console.error('[FileManager] Files exceeded size limit');
        return;
      }

      for (const file of validFiles) {
        // Mark file as uploading
        setUploadingFiles(prev => ({ ...prev, [file.name]: true }));

        try {
          // Call the provided upload handler
          await onFileUpload(file);
          toast.success(`File ${file.name} uploaded successfully`);
        } catch (error) {
          console.error(`[FileManager] Error uploading file ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        } finally {
          // Mark file as no longer uploading
          setUploadingFiles(prev => ({ ...prev, [file.name]: false }));
        }
      }
    } catch (error) {
      console.error('[FileManager] Error in file upload process:', error);
      toast.error('An error occurred during file upload');
    } finally {
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle CSV file selection
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      console.error('[FileManager] Invalid file type for CSV');
      return;
    }

    // Validate file size
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast.error('File size exceeds 10MB limit');
      console.error('[FileManager] CSV file too large');
      return;
    }

    setCsvFile(file);
  };

  return (
    <div className="w-full">
      {/* Tabs moved to top */}
      <div className="mb-6">
        <Tabs value={activeFileTab} onValueChange={setActiveFileTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger
              value="knowledge-base"
              className="flex items-center gap-2 data-[state=active]:bg-[#8B0000] data-[state=active]:text-white text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <File className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger
              value="csv-upload"
              className="flex items-center gap-2 data-[state=active]:bg-[#8B0000] data-[state=active]:text-white text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Database className="h-4 w-4" />
              CSV Configuration
            </TabsTrigger>
          </TabsList>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge-base" className="space-y-6 mt-6">
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-5 w-5 text-[#8B0000]" />
                <CardTitle className="text-gray-900 dark:text-gray-100">Knowledge Base Files</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-[#8B0000]/20 text-[#8B0000] border-[#8B0000]/30">
                {knowledgeBaseFiles?.length || 0} files
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload documents to build your AI assistant's knowledge base
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="relative">
              <div className="flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-[#8B0000] transition-all duration-200 bg-gray-50 dark:bg-gray-900/50">
                <label className="cursor-pointer w-full">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleKnowledgeBaseFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.csv"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-[#8B0000]/20 rounded-full">
                      <Upload className="h-6 w-6 text-[#8B0000]" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <span className="text-[#8B0000] font-semibold">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        PDF, DOC, DOCX, TXT, CSV (max 10MB each)
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* File List */}
            <div className="space-y-3">
              {knowledgeBaseFiles && knowledgeBaseFiles.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                    <Info className="h-4 w-4" />
                    Found {knowledgeBaseFiles.length} file{knowledgeBaseFiles.length !== 1 ? 's' : ''} for this business
                  </div>
                  <div className="grid gap-3">
                    {knowledgeBaseFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#8B0000]/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                            <FileText className="h-5 w-5 text-[#8B0000]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs py-0">
                                  {formatFileSize(file.size)}
                                </Badge>
                              </span>
                              <span>•</span>
                              <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          {uploadingFiles[file.name] ? (
                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onFileRemove(file.name)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#8B0000]"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-800 rounded-full">
                      <FileText className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="text-sm font-medium text-white">
                      No files uploaded yet
                    </div>
                    <p className="text-sm text-gray-300 max-w-sm">
                      Upload documents to build your AI assistant's knowledge base and improve response accuracy
                    </p>
                  </div>
                </div>
              )}
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV Upload Tab */}
          <TabsContent value="csv-upload" className="space-y-6 mt-6">
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#8B0000]" />
                  <CardTitle className="text-gray-900 dark:text-gray-100">CSV Configuration</CardTitle>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload structured data to enhance your business operations
                </p>
              </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Section */}
              <div className="flex items-start gap-3 p-4 bg-[#8B0000]/10 border border-[#8B0000]/30 text-gray-900 dark:text-gray-100 rounded-xl">
                <AlertCircle className="h-5 w-5 mt-0.5 text-[#8B0000]" />
                <div className="text-sm">
                  <p className="font-medium mb-2">CSV File Requirements:</p>
                  <ul className="space-y-1 text-gray-800 dark:text-gray-200">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#8B0000] rounded-full"></div>
                      One row per record with proper headers
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#8B0000] rounded-full"></div>
                      Required fields: ID, Name, Category
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#8B0000] rounded-full"></div>
                      Maximum file size: 10MB
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#8B0000] rounded-full"></div>
                      UTF-8 encoding recommended
                    </li>
                  </ul>
                </div>
              </div>

            {/* CSV Upload Section */}
            {!csvFile ? (
              <div className="relative">
                <div className="flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-[#8B0000] transition-all duration-200 bg-gray-50 dark:bg-gray-900/50">
                  <label className="cursor-pointer w-full">
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCsvFileSelect}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                        <Upload className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          <span className="text-red-600 dark:text-red-400 font-semibold">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          CSV files only (max 10MB)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <Database className="h-5 w-5 text-[#8B0000]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {csvFile.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                        <Badge variant="outline" className="text-xs py-0 bg-[#8B0000]/20 text-[#8B0000] border-[#8B0000]/30">
                          {formatFileSize(csvFile.size)}
                        </Badge>
                        <span>•</span>
                        <span>CSV File</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCsvFile(null)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#8B0000]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 rounded-xl">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">CSV file ready for upload</p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      Click the "Save All Changes" button at the bottom of the page to process your CSV file.
                    </p>
                  </div>
                </div>
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FileManager;