import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { 
  FlaskRound as Flask, 
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
  ArrowRight,
  Beaker,
  Clock,
  Droplets
} from 'lucide-react';

interface LabTest {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
  };
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  is_emergency: boolean;
  sample_info?: {
    sample_id: string;
    sample_type: string;
    container_type: string;
    collection_time: string;
    collected_by: string;
    notes?: string;
  };
  workflow_stage?: 'pending' | 'sample_collected' | 'testing' | 'review' | 'completed';
}

interface TestResult {
  parameter: string;
  value: string;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
}

const LabTestProcessForm: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [test, setTest] = useState<LabTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  
  // Sample collection state
  const [workflowStage, setWorkflowStage] = useState<'sample_collection' | 'testing' | 'review' | 'completed'>('sample_collection');
  const [sampleInfo, setSampleInfo] = useState<{
    sample_id: string;
    sample_type: string;
    container_type: string;
    collection_time: string;
    collected_by: string;
    notes?: string;
  }>({
    sample_id: '',
    sample_type: 'blood',
    container_type: 'tube',
    collection_time: new Date().toISOString(),
    collected_by: '',
    notes: ''
  });
  
  // Review state
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId, hospital]);

  useEffect(() => {
    // Generate a sample ID when the component loads
    if (user) {
      generateSampleId();
      setSampleInfo(prev => ({
        ...prev,
        collected_by: `${user.email?.charAt(0).toUpperCase() || 'U'}${user.email?.split('@')[0].slice(1) || ''}`
      }));
    }
  }, [user]);

  const generateSampleId = () => {
    // Generate a sample ID with format LAB-YYYYMMDD-XXXX where XXXX is a random 4-digit number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    const sampleId = `LAB-${year}${month}${day}-${random}`;
    
    setSampleInfo(prev => ({
      ...prev,
      sample_id: sampleId
    }));
  };

  const fetchTest = async () => {
    try {
      if (import.meta.env.DEV) {
        // Mock data for development
        const mockTest: LabTest = {
          id: testId || '1',
          patient: {
            id: '00000000-0000-0000-0000-000000000001',
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '1980-05-15'
          },
          test_type: 'complete_blood_count',
          test_date: new Date().toISOString(),
          status: 'pending',
          results: null,
          is_emergency: Math.random() > 0.7,
          workflow_stage: 'pending'
        };
        
        setTest(mockTest);
        
        // Initialize with default parameters based on test type
        if (mockTest.test_type === 'complete_blood_count') {
          setResults([
            { parameter: 'Hemoglobin', value: '', unit: 'g/dL', reference_range: '13.5-17.5', is_abnormal: false },
            { parameter: 'White Blood Cells', value: '', unit: '10^9/L', reference_range: '4.5-11.0', is_abnormal: false },
            { parameter: 'Platelets', value: '', unit: '10^9/L', reference_range: '150-450', is_abnormal: false },
            { parameter: 'Red Blood Cells', value: '', unit: '10^12/L', reference_range: '4.5-5.9', is_abnormal: false },
            { parameter: 'Hematocrit', value: '', unit: '%', reference_range: '41-50', is_abnormal: false }
          ]);
        } else if (mockTest.test_type === 'liver_function') {
          setResults([
            { parameter: 'ALT', value: '', unit: 'U/L', reference_range: '7-56', is_abnormal: false },
            { parameter: 'AST', value: '', unit: 'U/L', reference_range: '5-40', is_abnormal: false },
            { parameter: 'ALP', value: '', unit: 'U/L', reference_range: '44-147', is_abnormal: false },
            { parameter: 'Total Bilirubin', value: '', unit: 'mg/dL', reference_range: '0.1-1.2', is_abnormal: false }
          ]);
        } else if (mockTest.test_type === 'kidney_function') {
          setResults([
            { parameter: 'Creatinine', value: '', unit: 'mg/dL', reference_range: '0.6-1.2', is_abnormal: false },
            { parameter: 'BUN', value: '', unit: 'mg/dL', reference_range: '7-20', is_abnormal: false },
            { parameter: 'eGFR', value: '', unit: 'mL/min/1.73m²', reference_range: '>60', is_abnormal: false }
          ]);
        } else if (mockTest.test_type === 'lipid_profile') {
          setResults([
            { parameter: 'Total Cholesterol', value: '', unit: 'mg/dL', reference_range: '<200', is_abnormal: false },
            { parameter: 'LDL', value: '', unit: 'mg/dL', reference_range: '<100', is_abnormal: false },
            { parameter: 'HDL', value: '', unit: 'mg/dL', reference_range: '>40', is_abnormal: false },
            { parameter: 'Triglycerides', value: '', unit: 'mg/dL', reference_range: '<150', is_abnormal: false }
          ]);
        } else {
          // Generic parameters
          setResults([
            { parameter: 'Parameter 1', value: '', unit: '', reference_range: '', is_abnormal: false },
            { parameter: 'Parameter 2', value: '', unit: '', reference_range: '', is_abnormal: false }
          ]);
        }
        
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name, date_of_birth)
        `)
        .eq('id', testId)
        .single();

      if (error) throw error;
      
      setTest(data);
      
      // Check if test has sample info
      if (data.sample_info) {
        setSampleInfo(data.sample_info);
        setWorkflowStage(data.workflow_stage === 'sample_collected' ? 'testing' : 
                         data.workflow_stage === 'testing' ? 'testing' : 
                         data.workflow_stage === 'review' ? 'review' : 
                         data.workflow_stage === 'completed' ? 'completed' : 'sample_collection');
      }
      
      // Initialize results if test is new or load existing results
      if (data.status === 'pending' && !data.results) {
        // Set default parameters based on test type
        if (data.test_type === 'complete_blood_count') {
          setResults([
            { parameter: 'Hemoglobin', value: '', unit: 'g/dL', reference_range: '13.5-17.5', is_abnormal: false },
            { parameter: 'White Blood Cells', value: '', unit: '10^9/L', reference_range: '4.5-11.0', is_abnormal: false },
            { parameter: 'Platelets', value: '', unit: '10^9/L', reference_range: '150-450', is_abnormal: false },
            { parameter: 'Red Blood Cells', value: '', unit: '10^12/L', reference_range: '4.5-5.9', is_abnormal: false },
            { parameter: 'Hematocrit', value: '', unit: '%', reference_range: '41-50', is_abnormal: false }
          ]);
        } else if (data.test_type === 'liver_function') {
          setResults([
            { parameter: 'ALT', value: '', unit: 'U/L', reference_range: '7-56', is_abnormal: false },
            { parameter: 'AST', value: '', unit: 'U/L', reference_range: '5-40', is_abnormal: false },
            { parameter: 'ALP', value: '', unit: 'U/L', reference_range: '44-147', is_abnormal: false },
            { parameter: 'Total Bilirubin', value: '', unit: 'mg/dL', reference_range: '0.1-1.2', is_abnormal: false }
          ]);
        } else if (data.test_type === 'kidney_function') {
          setResults([
            { parameter: 'Creatinine', value: '', unit: 'mg/dL', reference_range: '0.6-1.2', is_abnormal: false },
            { parameter: 'BUN', value: '', unit: 'mg/dL', reference_range: '7-20', is_abnormal: false },
            { parameter: 'eGFR', value: '', unit: 'mL/min/1.73m²', reference_range: '>60', is_abnormal: false }
          ]);
        } else if (data.test_type === 'lipid_profile') {
          setResults([
            { parameter: 'Total Cholesterol', value: '', unit: 'mg/dL', reference_range: '<200', is_abnormal: false },
            { parameter: 'LDL', value: '', unit: 'mg/dL', reference_range: '<100', is_abnormal: false },
            { parameter: 'HDL', value: '', unit: 'mg/dL', reference_range: '>40', is_abnormal: false },
            { parameter: 'Triglycerides', value: '', unit: 'mg/dL', reference_range: '<150', is_abnormal: false }
          ]);
        } else {
          // Generic parameters
          setResults([
            { parameter: 'Parameter 1', value: '', unit: '', reference_range: '', is_abnormal: false },
            { parameter: 'Parameter 2', value: '', unit: '', reference_range: '', is_abnormal: false }
          ]);
        }
      } else if (data.results) {
        // Load existing results
        setResults(data.results.parameters || []);
        setNotes(data.results.notes || '');
        setFileUrls(data.results.file_urls || []);
        
        if (data.results.review) {
          setReviewNotes(data.results.review.notes || '');
          setReviewedBy(data.results.review.reviewed_by || '');
          setIsApproved(data.results.review.is_approved || false);
        }
      }
    } catch (error) {
      console.error('Error fetching lab test:', error);
      addNotification({
        message: 'Failed to load lab test information',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (index: number, value: string) => {
    const updatedResults = [...results];
    updatedResults[index].value = value;
    
    // Check if value is outside reference range
    const refRange = updatedResults[index].reference_range;
    if (refRange && value) {
      const numValue = parseFloat(value);
      
      if (refRange.startsWith('<')) {
        // Upper limit only
        const limit = parseFloat(refRange.substring(1));
        updatedResults[index].is_abnormal = numValue >= limit;
      } else if (refRange.startsWith('>')) {
        // Lower limit only
        const limit = parseFloat(refRange.substring(1));
        updatedResults[index].is_abnormal = numValue <= limit;
      } else if (refRange.includes('-')) {
        // Range with lower and upper limits
        const [lower, upper] = refRange.split('-').map(parseFloat);
        updatedResults[index].is_abnormal = numValue < lower || numValue > upper;
      }
    }
    
    setResults(updatedResults);
  };

  const handleAddParameter = () => {
    setResults([...results, { parameter: '', value: '', unit: '', reference_range: '', is_abnormal: false }]);
  };

  const handleRemoveParameter = (index: number) => {
    const updatedResults = [...results];
    updatedResults.splice(index, 1);
    setResults(updatedResults);
  };

  const handleParameterChange = (index: number, field: keyof TestResult, value: string | boolean) => {
    const updatedResults = [...results];
    updatedResults[index] = { ...updatedResults[index], [field]: value };
    setResults(updatedResults);
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

  const handleRemoveFileUrl = (index: number) => {
    const updatedUrls = [...fileUrls];
    updatedUrls.splice(index, 1);
    setFileUrls(updatedUrls);
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
      const fakeUrl = `https://storage.example.com/lab-results/${Date.now()}-${file.name}`;
      urls.push(fakeUrl);
    }
    
    return urls;
  };

  const handleSampleCollection = async () => {
    if (!test || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate sample info
      if (!sampleInfo.sample_id || !sampleInfo.sample_type || !sampleInfo.container_type) {
        addNotification({
          message: 'Please complete all required sample information',
          type: 'warning'
        });
        return;
      }
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Sample collection info submitted:', sampleInfo);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setTest({
          ...test,
          sample_info: sampleInfo,
          workflow_stage: 'sample_collected'
        });
        
        setWorkflowStage('testing');
        
        addNotification({
          message: 'Sample collected successfully',
          type: 'success'
        });
        
        return;
      }
      
      // Update lab test in database
      const { error } = await supabase
        .from('lab_results')
        .update({
          sample_info: sampleInfo,
          workflow_stage: 'sample_collected',
          status: 'in_progress'
        })
        .eq('id', test.id);

      if (error) throw error;
      
      // Update local state
      setTest({
        ...test,
        sample_info: sampleInfo,
        workflow_stage: 'sample_collected',
        status: 'in_progress'
      });
      
      setWorkflowStage('testing');
      
      addNotification({
        message: 'Sample collected successfully',
        type: 'success'
      });
      
    } catch (error: any) {
      console.error('Error saving sample collection info:', error);
      addNotification({
        message: `Error saving sample info: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveResults = async () => {
    if (!test || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate results
      const incompleteResults = results.some(r => !r.parameter || !r.value);
      if (incompleteResults) {
        addNotification({
          message: 'Please complete all test parameters and values',
          type: 'warning'
        });
        return;
      }
      
      // Upload files if any
      const newFileUrls = await uploadFiles();
      const allFileUrls = [...fileUrls, ...newFileUrls];
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Lab test results submitted:', {
          parameters: results,
          notes,
          file_urls: allFileUrls
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setTest({
          ...test,
          results: {
            parameters: results,
            notes,
            file_urls: allFileUrls
          },
          workflow_stage: 'review'
        });
        
        setWorkflowStage('review');
        
        addNotification({
          message: 'Test results saved successfully and sent for review',
          type: 'success'
        });
        
        return;
      }
      
      // Update lab test in database
      const { error } = await supabase
        .from('lab_results')
        .update({
          results: {
            parameters: results,
            notes,
            file_urls: allFileUrls
          },
          workflow_stage: 'review'
        })
        .eq('id', test.id);

      if (error) throw error;
      
      // Update local state
      setTest({
        ...test,
        results: {
          parameters: results,
          notes,
          file_urls: allFileUrls
        },
        workflow_stage: 'review'
      });
      
      setWorkflowStage('review');
      
      addNotification({
        message: 'Test results saved successfully and sent for review',
        type: 'success'
      });
      
    } catch (error: any) {
      console.error('Error saving lab test results:', error);
      addNotification({
        message: `Error saving results: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewResults = async (approved: boolean) => {
    if (!test || !user) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Lab test review submitted:', {
          is_approved: approved,
          reviewed_by: user.email,
          notes: reviewNotes
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        const updatedResults = {
          ...test.results,
          review: {
            is_approved: approved,
            reviewed_by: user.email,
            notes: reviewNotes,
            reviewed_at: new Date().toISOString()
          }
        };
        
        setTest({
          ...test,
          results: updatedResults,
          status: approved ? 'completed' : 'in_progress',
          workflow_stage: approved ? 'completed' : 'testing'
        });
        
        setWorkflowStage(approved ? 'completed' : 'testing');
        setIsApproved(approved);
        
        addNotification({
          message: approved ? 'Test results approved and finalized' : 'Test results rejected and sent back for revision',
          type: approved ? 'success' : 'warning'
        });
        
        if (approved) {
          navigate('/laboratory');
        }
        
        return;
      }
      
      // Update lab test in database with review information
      const updatedResults = {
        ...test.results,
        review: {
          is_approved: approved,
          reviewed_by: user.email,
          notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        }
      };
      
      const { error } = await supabase
        .from('lab_results')
        .update({
          results: updatedResults,
          status: approved ? 'completed' : 'in_progress',
          workflow_stage: approved ? 'completed' : 'testing',
          reviewed_by: approved ? user.id : null,
          reviewed_at: approved ? new Date().toISOString() : null
        })
        .eq('id', test.id);

      if (error) throw error;
      
      // Update patient flow step if approved
      if (approved) {
        await supabase
          .from('patients')
          .update({
            current_flow_step: 'waiting_consultation'
          })
          .eq('id', test.patient.id);
          
        addNotification({
          message: 'Test results approved and finalized',
          type: 'success'
        });
        
        navigate('/laboratory');
      } else {
        addNotification({
          message: 'Test results rejected and sent back for revision',
          type: 'warning'
        });
        
        setWorkflowStage('testing');
      }
      
    } catch (error: any) {
      console.error('Error reviewing lab test results:', error);
      addNotification({
        message: `Error during review: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTestTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'complete_blood_count': 'Complete Blood Count (CBC)',
      'liver_function': 'Liver Function Test (LFT)',
      'kidney_function': 'Kidney Function Test',
      'lipid_profile': 'Lipid Profile',
      'blood_glucose': 'Blood Glucose',
      'urinalysis': 'Urinalysis',
      'thyroid_function': 'Thyroid Function Test',
      'electrolytes': 'Electrolytes Panel',
      'hba1c': 'HbA1c',
      'coagulation_profile': 'Coagulation Profile'
    };
    return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Test not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/laboratory')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Process Lab Test</h1>
      </div>

      {/* Patient and Test Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
          </div>
          <p className="text-gray-700">
            <span className="font-medium">Name:</span> {test.patient.first_name} {test.patient.last_name}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">DOB:</span> {new Date(test.patient.date_of_birth).toLocaleDateString()}
          </p>
          <p className="text-gray-700 mt-2">
            <a href={`/patients/${test.patient.id}`} className="text-primary-600 hover:text-primary-800">
              View Patient Record
            </a>
          </p>
        </div>

        <div>
          <div className="flex items-center mb-4">
            <Flask className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Test Information</h2>
          </div>
          <p className="text-gray-700">
            <span className="font-medium">Test Type:</span> {getTestTypeLabel(test.test_type)}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Date:</span> {new Date(test.test_date).toLocaleDateString()}
          </p>
          {test.is_emergency && (
            <div className="mt-2 flex items-center text-error-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-medium">EMERGENCY</span>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Stages */}
      {workflowStage === 'sample_collection' && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium text-gray-900">Sample Collection</h2>
            <div className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
              Step 1 of 3
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label required">Sample ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Beaker className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={sampleInfo.sample_id}
                  onChange={(e) => setSampleInfo({...sampleInfo, sample_id: e.target.value})}
                  className="form-input pl-10"
                  placeholder="LAB-20250511-1234"
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Auto-generated unique sample identifier</p>
            </div>
            
            <div>
              <label className="form-label required">Collection Time</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  value={new Date(sampleInfo.collection_time).toISOString().slice(0, 16)}
                  onChange={(e) => setSampleInfo({...sampleInfo, collection_time: new Date(e.target.value).toISOString()})}
                  className="form-input pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label required">Sample Type</label>
              <select
                value={sampleInfo.sample_type}
                onChange={(e) => setSampleInfo({...sampleInfo, sample_type: e.target.value})}
                className="form-input"
              >
                <option value="blood">Blood</option>
                <option value="urine">Urine</option>
                <option value="stool">Stool</option>
                <option value="sputum">Sputum</option>
                <option value="csf">Cerebrospinal Fluid (CSF)</option>
                <option value="tissue">Tissue</option>
                <option value="swab">Swab</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="form-label required">Container Type</label>
              <select
                value={sampleInfo.container_type}
                onChange={(e) => setSampleInfo({...sampleInfo, container_type: e.target.value})}
                className="form-input"
              >
                <option value="tube">Blood Tube</option>
                <option value="edta">EDTA Tube</option>
                <option value="serum">Serum Separator Tube</option>
                <option value="heparin">Heparin Tube</option>
                <option value="urine_container">Urine Container</option>
                <option value="stool_container">Stool Container</option>
                <option value="swab_tube">Swab Tube</option>
                <option value="slide">Microscope Slide</option>
                <option value="vial">Vial</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="form-label required">Collected By</label>
              <input
                type="text"
                value={sampleInfo.collected_by}
                onChange={(e) => setSampleInfo({...sampleInfo, collected_by: e.target.value})}
                className="form-input"
                placeholder="Lab Technician Name"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label">Notes</label>
              <textarea
                value={sampleInfo.notes || ''}
                onChange={(e) => setSampleInfo({...sampleInfo, notes: e.target.value})}
                className="form-input"
                rows={2}
                placeholder="Any special instructions or observations during collection"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={() => navigate('/laboratory')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSampleCollection}
              disabled={isSaving || !sampleInfo.sample_id || !sampleInfo.sample_type || !sampleInfo.container_type}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Collect Sample <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {workflowStage === 'testing' && (
        <>
          {/* Sample Info Summary */}
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-primary-500">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium text-gray-900">Sample Information</h3>
              <div className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                Step 2 of 3
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Sample ID</p>
                <p className="text-sm font-medium">{sampleInfo.sample_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sample Type</p>
                <p className="text-sm font-medium">{sampleInfo.sample_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Container</p>
                <p className="text-sm font-medium">{sampleInfo.container_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Collection Time</p>
                <p className="text-sm font-medium">{new Date(sampleInfo.collection_time).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Test Results</h2>
              </div>
              <button
                type="button"
                onClick={handleAddParameter}
                className="btn btn-outline btn-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Parameter
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parameter
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference Range
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={result.parameter}
                          onChange={(e) => handleParameterChange(index, 'parameter', e.target.value)}
                          className="form-input py-1 text-sm"
                          placeholder="Parameter name"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={result.value}
                          onChange={(e) => handleValueChange(index, e.target.value)}
                          className="form-input py-1 text-sm"
                          placeholder="Result value"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={result.unit}
                          onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                          className="form-input py-1 text-sm"
                          placeholder="Unit"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={result.reference_range}
                          onChange={(e) => handleParameterChange(index, 'reference_range', e.target.value)}
                          className="form-input py-1 text-sm"
                          placeholder="Reference range"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={result.is_abnormal ? 'abnormal' : 'normal'}
                          onChange={(e) => handleParameterChange(index, 'is_abnormal', e.target.value === 'abnormal')}
                          className={`form-input py-1 text-sm ${
                            result.is_abnormal ? 'text-error-600 border-error-300' : 'text-success-600 border-success-300'
                          }`}
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="text-error-600 hover:text-error-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes and Files */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div>
              <label className="form-label">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Add any additional notes or observations"
              />
            </div>

            <div>
              <label className="form-label">Attach Files</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Display uploaded files */}
            {(uploadedFiles.length > 0 || fileUrls.length > 0) && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Files</h3>
                <ul className="mt-2 divide-y divide-gray-200">
                  {fileUrls.map((url, index) => (
                    <li key={`url-${index}`} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {url.split('/').pop()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFileUrl(index)}
                        className="text-error-600 hover:text-error-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                  {uploadedFiles.map((file, index) => (
                    <li key={`file-${index}`} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{file.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-error-600 hover:text-error-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/laboratory')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveResults}
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
                  Submit for Review <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {workflowStage === 'review' && (
        <>
          {/* Sample Info Summary */}
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-primary-500">
            <h3 className="text-md font-medium text-gray-900">Sample Information</h3>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Sample ID</p>
                <p className="text-sm font-medium">{sampleInfo.sample_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sample Type</p>
                <p className="text-sm font-medium">{sampleInfo.sample_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Container</p>
                <p className="text-sm font-medium">{sampleInfo.container_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Collection Time</p>
                <p className="text-sm font-medium">{new Date(sampleInfo.collection_time).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Test Results Review */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Review Test Results</h2>
              </div>
              <div className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                Step 3 of 3
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parameter
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference Range
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className={result.is_abnormal ? 'bg-error-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{result.parameter}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${result.is_abnormal ? 'font-bold text-error-600' : 'text-gray-900'}`}>
                          {result.value}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{result.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{result.reference_range}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.is_abnormal ? 'bg-error-100 text-error-800' : 'bg-success-100 text-success-800'
                        }`}>
                          {result.is_abnormal ? 'Abnormal' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900">Technician Notes</h3>
                <p className="mt-1 text-sm text-gray-700">{notes}</p>
              </div>
            )}

            {/* Files */}
            {fileUrls.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">Attached Files</h3>
                <ul className="mt-2 divide-y divide-gray-200">
                  {fileUrls.map((url, index) => (
                    <li key={index} className="py-2 flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        {url.split('/').pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Review Form */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-900">Review Comments</h3>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="form-input mt-2"
                rows={3}
                placeholder="Add any review comments or observations"
              />
              
              <div className="mt-4 flex justify-end space-x-4">
                <button
                  onClick={() => handleReviewResults(false)}
                  disabled={isSaving}
                  className="btn btn-outline text-error-600 border-error-300 hover:bg-error-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-error-600 mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 mr-2" />
                      Reject & Return
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReviewResults(true)}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve & Finalize
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {workflowStage === 'completed' && (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Test Results Finalized</h2>
          <p className="text-gray-600 mb-6">This test has been completed and the results have been finalized.</p>
          <button
            onClick={() => navigate('/laboratory')}
            className="btn btn-primary"
          >
            Return to Laboratory
          </button>
        </div>
      )}
    </div>
  );
};

export default LabTestProcessForm;