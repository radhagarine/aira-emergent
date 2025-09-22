// Fixed FileManager.tsx with improved error handling and debugging
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';
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
    console.log('[FileManager] Mounted with props:', {
      businessId,
      knowledgeBaseFiles: knowledgeBaseFiles?.length || 0,
      hasCSVFile: !!csvFile
    });
    
    // Log each knowledge base file for debugging
    if (knowledgeBaseFiles && knowledgeBaseFiles.length > 0) {
      console.log('[FileManager] Knowledge base files:', knowledgeBaseFiles);
    } else {
      console.log('[FileManager] No knowledge base files available');
    }

    async function checkAuth() {
      const { data, error } = await supabase.auth.getSession();
      console.log('[Auth Debug in FileManager] Session data:', data);
      console.log('[Auth Debug in FileManager] Session error:', error);
      
      // Also check the user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[Auth Debug] Current user:', user);
    }
    
    checkAuth();
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
      console.log('[FileManager] No files selected');
      return;
    }

    console.log(`[FileManager] Files selected: ${files.length}`);
    
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
        console.log(`[FileManager] Processing file: ${file.name}, size: ${formatFileSize(file.size)}, type: ${file.type}`);
        
        // Mark file as uploading
        setUploadingFiles(prev => ({ ...prev, [file.name]: true }));
        
        try {
          // Call the provided upload handler
          console.log(`[FileManager] Uploading file: ${file.name}`);
          await onFileUpload(file);
          console.log(`[FileManager] File uploaded successfully: ${file.name}`);
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

    console.log(`[FileManager] CSV file selected: ${file.name}, size: ${formatFileSize(file.size)}`);

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
    console.log('[FileManager] CSV file set successfully');
  };

  return (
    <Tabs value={activeFileTab} onValueChange={setActiveFileTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
        <TabsTrigger value="csv-upload">CSV Configuration</TabsTrigger>
      </TabsList>
      
      {/* Knowledge Base Tab */}
      <TabsContent value="knowledge-base">
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
              <label className="cursor-pointer w-full">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleKnowledgeBaseFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.csv"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-[#8B0000]">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, TXT, CSV (max 10MB each)
                  </p>
                </div>
              </label>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-gray-500 mb-2">
              Found {knowledgeBaseFiles?.length || 0} file(s) for the business
            </div>

            {/* File List */}
            <div className="space-y-2">
              {knowledgeBaseFiles && knowledgeBaseFiles.length > 0 ? (
                knowledgeBaseFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {uploadingFiles[file.name] ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log(`[FileManager] Removing file: ${file.name}`);
                          onFileRemove(file.name);
                        }}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-gray-500">
                  No files uploaded yet. Upload files to build your knowledge base.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* CSV Upload Tab */}
      <TabsContent value="csv-upload">
        <Card>
          <CardHeader>
            <CardTitle>CSV Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Section */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="text-sm">
                <p>Upload your CSV file containing business details. This file should include:</p>
                <ul className="list-disc ml-4 mt-2">
                  <li>One row per record</li>
                  <li>Proper column headers</li>
                  <li>Required fields: ID, Name, Category</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>

            {/* CSV Upload Section */}
            {!csvFile ? (
              <div className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <label className="cursor-pointer w-full">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvFileSelect}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-[#8B0000]">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">CSV files only (max 10MB)</p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{csvFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(csvFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCsvFile(null)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-600">
                  CSV file selected. Click the "Save All Changes" button at the bottom of the page to upload.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FileManager;