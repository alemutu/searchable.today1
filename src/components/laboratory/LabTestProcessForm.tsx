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
  Plus
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

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId, hospital]);

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
          is_emergency: Math.random() > 0.7
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
      
      // Initialize results if test is new
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

  const handleSave = async () => {
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
        
        addNotification({
          message: 'Lab test results saved successfully',
          type: 'success'
        });
        
        navigate('/laboratory');
        return;
      }
      
      // Update lab test in database
      const { error } = await supabase
        .from('lab_results')
        .update({
          status: 'completed',
          results: {
            parameters: results,
            notes,
            file_urls: allFileUrls
          },
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', test.id);

      if (error) throw error;
      
      // Update patient flow step if needed
      await supabase
        .from('patients')
        .update({
          current_flow_step: 'waiting_consultation'
        })
        .eq('id', test.patient.id);
      
      addNotification({
        message: 'Lab test results saved successfully',
        type: 'success'
      });
      
      navigate('/laboratory');
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
              <Save className="h-5 w-5 mr-2" />
              Save Results
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LabTestProcessForm;