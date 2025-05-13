import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  Microscope, 
  Save, 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Upload,
  Trash2,
  Plus,
  FileImage,
  ArrowRight,
  Clock,
  ChevronRight,
  Scan
} from 'lucide-react';

interface RadiologyTest {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
  };
  scan_type: string;
  scan_date: string;
  status: string;
  results: any;
  is_emergency: boolean;
  workflow_stage?: 'pending' | 'in_progress' | 'completed';
  scan_info?: {
    scan_id: string;
    scan_time: string;
    performed_by: string;
    equipment_used: string;
    notes?: string;
  };
}

const RadiologyProcessForm: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [scan, setScan] = useState<RadiologyTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  // Scan information state
  const [workflowStage, setWorkflowStage] = useState<'scan_setup' | 'processing' | 'completed'>('scan_setup');
  const [scanInfo, setScanInfo] = useState<{
    scan_id: string;
    scan_time: string;
    performed_by: string;
    equipment_used: string;
    notes?: string;
  }>({
    scan_id: '',
    scan_time: new Date().toISOString(),
    performed_by: '',
    equipment_used: 'x_ray_machine',
    notes: ''
  });

  useEffect(() => {
    if (scanId) {
      fetchScan();
    }
  }, [scanId, hospital]);

  useEffect(() => {
    // Generate a scan ID when the component loads
    if (user) {
      generateScanId();
      setScanInfo(prev => ({
        ...prev,
        performed_by: `${user.email?.charAt(0).toUpperCase() || 'U'}${user.email?.split('@')[0].slice(1) || ''}`
      }));
    }
  }, [user]);

  const generateScanId = () => {
    // Generate a scan ID with format RAD-YYYYMMDD-XXXX where XXXX is a random 4-digit number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    const scanId = `RAD-${year}${month}${day}-${random}`;
    
    setScanInfo(prev => ({
      ...prev,
      scan_id: scanId
    }));
  };

  const fetchScan = async () => {
    try {
      if (import.meta.env.DEV) {
        // Mock data for development
        const mockScan: RadiologyTest = {
          id: scanId || '1',
          patient: {
            id: '00000000-0000-0000-0000-000000000001',
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '1980-05-15'
          },
          scan_type: 'x_ray',
          scan_date: new Date().toISOString(),
          status: 'pending',
          results: null,
          is_emergency: Math.random() > 0.7,
          workflow_stage: 'pending'
        };
        
        setScan(mockScan);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('radiology_results')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name, date_of_birth)
        `)
        .eq('id', scanId)
        .single();

      if (error) throw error;
      
      setScan(data);
      
      // Check if scan has scan info
      if (data.scan_info) {
        setScanInfo(data.scan_info);
        setWorkflowStage(data.workflow_stage === 'in_progress' ? 'processing' : 
                         data.workflow_stage === 'completed' ? 'completed' : 'scan_setup');
      }
      
      // Load existing results if available
      if (data.results) {
        setFindings(data.results.findings || '');
        setImpression(data.results.impression || '');
        setRecommendations(data.results.recommendations || '');
        setImageUrls(data.results.image_urls || []);
      }
    } catch (error) {
      console.error('Error fetching radiology scan:', error);
      addNotification({
        message: 'Failed to load radiology scan information',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...uploadedFiles];
    updatedFiles.splice(index, 1);
    setUploadedFiles(updatedFiles);
  };

  const handleRemoveImageUrl = (index: number) => {
    const updatedUrls = [...imageUrls];
    updatedUrls.splice(index, 1);
    setImageUrls(updatedUrls);
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (uploadedFiles.length === 0) return [];
    
    const urls: string[] = [];
    
    // In a real app, this would upload to Supabase storage
    // For now, we'll just simulate it
    for (const file of uploadedFiles) {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a fake URL
      const fakeUrl = `https://storage.example.com/radiology-images/${Date.now()}-${file.name}`;
      urls.push(fakeUrl);
    }
    
    return urls;
  };

  const handleScanSetup = async () => {
    if (!scan || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate scan info
      if (!scanInfo.scan_id || !scanInfo.performed_by || !scanInfo.equipment_used) {
        addNotification({
          message: 'Please complete all required scan information',
          type: 'warning'
        });
        return;
      }
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Scan setup info submitted:', scanInfo);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setScan({
          ...scan,
          scan_info: scanInfo,
          workflow_stage: 'in_progress'
        });
        
        setWorkflowStage('processing');
        
        addNotification({
          message: 'Scan setup completed successfully',
          type: 'success'
        });
        
        return;
      }
      
      // Update radiology scan in database
      const { error } = await supabase
        .from('radiology_results')
        .update({
          scan_info: scanInfo,
          workflow_stage: 'in_progress',
          status: 'in_progress'
        })
        .eq('id', scan.id);

      if (error) throw error;
      
      // Update local state
      setScan({
        ...scan,
        scan_info: scanInfo,
        workflow_stage: 'in_progress',
        status: 'in_progress'
      });
      
      setWorkflowStage('processing');
      
      addNotification({
        message: 'Scan setup completed successfully',
        type: 'success'
      });
      
    } catch (error: any) {
      console.error('Error saving scan setup info:', error);
      addNotification({
        message: `Error saving scan info: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!scan || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!findings || !impression) {
        addNotification({
          message: 'Please complete the findings and impression sections',
          type: 'warning'
        });
        return;
      }
      
      // Upload files if any
      const newImageUrls = await uploadFiles();
      const allImageUrls = [...imageUrls, ...newImageUrls];
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Radiology scan results submitted:', {
          findings,
          impression,
          recommendations,
          image_urls: allImageUrls
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addNotification({
          message: 'Radiology scan results saved successfully',
          type: 'success'
        });
        
        navigate('/radiology');
        return;
      }
      
      // Update radiology scan in database
      const { error } = await supabase
        .from('radiology_results')
        .update({
          status: 'completed',
          workflow_stage: 'completed',
          results: {
            findings,
            impression,
            recommendations,
            image_urls: allImageUrls
          },
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', scan.id);

      if (error) throw error;
      
      // Update patient flow step if needed
      await supabase
        .from('patients')
        .update({
          current_flow_step: 'waiting_consultation'
        })
        .eq('id', scan.patient.id);
      
      addNotification({
        message: 'Radiology scan results saved successfully',
        type: 'success'
      });
      
      navigate('/radiology');
    } catch (error: any) {
      console.error('Error saving radiology scan results:', error);
      addNotification({
        message: `Error saving results: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getScanTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'x_ray': 'X-Ray',
      'ct_scan': 'CT Scan',
      'mri': 'MRI',
      'ultrasound': 'Ultrasound',
      'mammogram': 'Mammogram',
      'pet_scan': 'PET Scan',
      'dexa_scan': 'DEXA Scan',
      'fluoroscopy': 'Fluoroscopy'
    };
    return types[type] || type;
  };

  const getEquipmentLabel = (equipment: string) => {
    const types: Record<string, string> = {
      'x_ray_machine': 'X-Ray Machine',
      'ct_scanner': 'CT Scanner',
      'mri_scanner': 'MRI Scanner',
      'ultrasound_machine': 'Ultrasound Machine',
      'mammography_unit': 'Mammography Unit',
      'pet_scanner': 'PET Scanner',
      'dexa_scanner': 'DEXA Scanner',
      'fluoroscopy_unit': 'Fluoroscopy Unit'
    };
    return types[equipment] || equipment;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Scan not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with workflow progress */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-secondary-600 to-secondary-500 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/radiology')}
              className="mr-4 p-2 rounded-full text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Process Radiology Scan</h1>
              <p className="text-secondary-100 text-sm">
                {getScanTypeLabel(scan.scan_type)} • {test.is_emergency && "EMERGENCY • "}
                {scan.patient.first_name} {scan.patient.last_name}
              </p>
            </div>
          </div>
          
          {/* Workflow progress indicator */}
          <div className="hidden md:flex items-center space-x-2 text-white">
            <div className={`flex items-center ${workflowStage === 'scan_setup' ? 'opacity-100' : 'opacity-70'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${workflowStage === 'scan_setup' ? 'bg-white text-secondary-600' : 'bg-secondary-400 text-white'}`}>
                <Scan className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium">Setup</span>
            </div>
            
            <ChevronRight className="h-4 w-4 text-secondary-200" />
            
            <div className={`flex items-center ${workflowStage === 'processing' ? 'opacity-100' : 'opacity-70'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${workflowStage === 'processing' ? 'bg-white text-secondary-600' : workflowStage === 'completed' ? 'bg-secondary-400 text-white' : 'bg-secondary-300/50 text-white'}`}>
                <FileImage className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium">Processing</span>
            </div>
            
            <ChevronRight className="h-4 w-4 text-secondary-200" />
            
            <div className={`flex items-center ${workflowStage === 'completed' ? 'opacity-100' : 'opacity-70'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${workflowStage === 'completed' ? 'bg-white text-secondary-600' : 'bg-secondary-300/50 text-white'}`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>
        
        {/* Mobile progress indicator */}
        <div className="md:hidden flex justify-between px-6 py-3 bg-gray-50">
          <div className={`text-xs font-medium ${workflowStage === 'scan_setup' ? 'text-secondary-600' : 'text-gray-500'}`}>
            Setup
          </div>
          <div className={`text-xs font-medium ${workflowStage === 'processing' ? 'text-secondary-600' : 'text-gray-500'}`}>
            Processing
          </div>
          <div className={`text-xs font-medium ${workflowStage === 'completed' ? 'text-secondary-600' : 'text-gray-500'}`}>
            Complete
          </div>
        </div>
      </div>

      {/* Patient and Scan Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
            <User className="h-6 w-6 text-secondary-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
            <p className="text-gray-700 mt-1">
              <span className="font-medium">Name:</span> {scan.patient.first_name} {scan.patient.last_name}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">DOB:</span> {new Date(scan.patient.date_of_birth).toLocaleDateString()}
            </p>
            <a href={`/patients/${scan.patient.id}`} className="text-secondary-600 hover:text-secondary-800 text-sm mt-1 inline-block">
              View Patient Record
            </a>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
            <Microscope className="h-6 w-6 text-secondary-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Scan Information</h2>
            <p className="text-gray-700 mt-1">
              <span className="font-medium">Scan Type:</span> {getScanTypeLabel(scan.scan_type)}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Date:</span> {new Date(scan.scan_date).toLocaleDateString()}
            </p>
            {scan.is_emergency && (
              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                EMERGENCY
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Stages */}
      {workflowStage === 'scan_setup' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Scan Setup</h2>
            <p className="text-sm text-gray-500 mt-1">Configure the scan parameters and equipment</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="form-label required">Scan ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileImage className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={scanInfo.scan_id}
                      className="form-input pl-10 bg-gray-50 rounded-lg"
                      placeholder="RAD-20250511-1234"
                      readOnly
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Auto-generated unique scan identifier</p>
                </div>
                
                <div>
                  <label className="form-label required">Equipment Used</label>
                  <select
                    value={scanInfo.equipment_used}
                    onChange={(e) => setScanInfo({...scanInfo, equipment_used: e.target.value})}
                    className="form-input rounded-lg"
                  >
                    <option value="x_ray_machine">X-Ray Machine</option>
                    <option value="ct_scanner">CT Scanner</option>
                    <option value="mri_scanner">MRI Scanner</option>
                    <option value="ultrasound_machine">Ultrasound Machine</option>
                    <option value="mammography_unit">Mammography Unit</option>
                    <option value="pet_scanner">PET Scanner</option>
                    <option value="dexa_scanner">DEXA Scanner</option>
                    <option value="fluoroscopy_unit">Fluoroscopy Unit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label required">Scan Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="datetime-local"
                      value={new Date(scanInfo.scan_time).toISOString().slice(0, 16)}
                      onChange={(e) => setScanInfo({...scanInfo, scan_time: new Date(e.target.value).toISOString()})}
                      className="form-input pl-10 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label required">Performed By</label>
                  <input
                    type="text"
                    value={scanInfo.performed_by}
                    onChange={(e) => setScanInfo({...scanInfo, performed_by: e.target.value})}
                    className="form-input rounded-lg"
                    placeholder="Radiologist/Technician Name"
                  />
                </div>
                
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    value={scanInfo.notes || ''}
                    onChange={(e) => setScanInfo({...scanInfo, notes: e.target.value})}
                    className="form-input rounded-lg"
                    rows={2}
                    placeholder="Any special instructions or observations during scan setup"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => navigate('/radiology')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleScanSetup}
                disabled={isSaving || !scanInfo.scan_id || !scanInfo.performed_by || !scanInfo.equipment_used}
                className="btn btn-primary"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Start Scan <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {workflowStage === 'processing' && (
        <>
          {/* Scan Info Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Scan Information</h2>
                <p className="text-sm text-gray-500 mt-1">Scan details for reference during processing</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-success-500"></div>
                <span className="text-sm font-medium text-success-700">Scan Complete</span>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Scan ID</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{scanInfo.scan_id}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Equipment</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{getEquipmentLabel(scanInfo.equipment_used)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Performed By</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{scanInfo.performed_by}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Scan Time</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{new Date(scanInfo.scan_time).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Scan Results */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Scan Results</h2>
              <p className="text-sm text-gray-500 mt-1">Enter the radiological findings and interpretation</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="form-label required">Findings</label>
                <textarea
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  className="form-input rounded-lg"
                  rows={4}
                  placeholder="Describe what is observed in the scan"
                />
              </div>

              <div>
                <label className="form-label required">Impression</label>
                <textarea
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  className="form-input rounded-lg"
                  rows={3}
                  placeholder="Clinical interpretation of the findings"
                />
              </div>

              <div>
                <label className="form-label">Recommendations</label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="form-input rounded-lg"
                  rows={2}
                  placeholder="Suggested follow-up or additional tests"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Scan Images</h2>
              <p className="text-sm text-gray-500 mt-1">Upload images from the radiological scan</p>
            </div>
            
            <div className="p-6">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-secondary-600 hover:text-secondary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-secondary-500"
                    >
                      <span>Upload images</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, DICOM up to 50MB
                  </p>
                </div>
              </div>

              {/* Display uploaded images */}
              {(uploadedFiles.length > 0 || imageUrls.length > 0) && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageUrls.map((url, index) => (
                      <div key={`url-${index}`} className="relative group">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm">
                          <img src={url} alt={`Scan ${index + 1}`} className="object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageUrl(index)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-md text-error-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {uploadedFiles.map((file, index) => (
                      <div key={`file-${index}`} className="relative group">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`Preview ${index + 1}`} 
                              className="object-cover"
                            />
                          ) : (
                            <FileImage className="h-8 w-8 text-gray-400" />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-md text-error-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/radiology')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Complete & Submit <CheckCircle className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {workflowStage === 'completed' && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Scan Results Finalized</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">This scan has been completed and the results have been finalized. The results are now available to the requesting physician.</p>
          <button
            onClick={() => navigate('/radiology')}
            className="btn btn-primary"
          >
            Return to Radiology
          </button>
        </div>
      )}
    </div>
  );
};

export default RadiologyProcessForm;