import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useNotificationStore } from '../../lib/store';
import { FlaskRound as Flask, Save, ArrowLeft, User, Calendar, FileText, CheckCircle, AlertTriangle, Beaker, ArrowRight, Clock, ChevronRight, Microscope, Loader2, XCircle } from 'lucide-react';

interface LabTest {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    current_flow_step?: string;
  };
  test_type: string;
  test_date: string;
  status: string;
  results: any;
  is_emergency: boolean;
  workflow_stage?: 'pending' | 'sample_collected' | 'testing' | 'review' | 'completed';
  sample_info?: {
    sample_id: string;
    sample_type: string;
    collection_time: string;
    container_type?: string;
  };
  assigned_to?: string;
}

const LabTestProcessForm: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { hospital, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [test, setTest] = useState<LabTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sample collection state
  const [workflowStage, setWorkflowStage] = useState<'sample_collection' | 'testing' | 'review' | 'completed'>('sample_collection');
  const [sampleInfo, setSampleInfo] = useState<{
    sample_id: string;
    sample_type: string;
    collection_time: string;
    container_type: string;
  }>({
    sample_id: '',
    sample_type: 'blood',
    collection_time: new Date().toISOString(),
    container_type: 'red_top_tube'
  });
  
  // Test results state
  const [testResults, setTestResults] = useState<any>({});
  const [testNotes, setTestNotes] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  
  // Review state
  const [reviewNotes, setReviewNotes] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  
  // Confirmation state
  const [confirmRelease, setConfirmRelease] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId, hospital]);

  useEffect(() => {
    // Generate a sample ID when the component loads
    if (user) {
      generateSampleId();
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
            date_of_birth: '1980-05-15',
            current_flow_step: 'lab_tests'
          },
          test_type: 'complete_blood_count',
          test_date: new Date().toISOString(),
          status: 'in_progress',
          results: null,
          is_emergency: Math.random() > 0.7,
          workflow_stage: 'sample_collected',
          assigned_to: user?.id
        };
        
        setTest(mockTest);
        
        // Set initial workflow stage based on test status
        if (mockTest.workflow_stage === 'sample_collected') {
          setWorkflowStage('sample_collection');
        } else if (mockTest.workflow_stage === 'testing') {
          setWorkflowStage('testing');
          
          // If we're in testing stage, we should have sample info
          if (mockTest.sample_info) {
            setSampleInfo(mockTest.sample_info as any);
          }
        } else if (mockTest.workflow_stage === 'review') {
          setWorkflowStage('review');
          
          // If we're in review stage, we should have sample info and results
          if (mockTest.sample_info) {
            setSampleInfo(mockTest.sample_info as any);
          }
          
          if (mockTest.results) {
            setTestResults(mockTest.results);
          } else {
            // Mock results for review
            setTestResults({
              wbc: 7.5,
              rbc: 4.8,
              hemoglobin: 14.2,
              hematocrit: 42,
              platelets: 250
            });
          }
        }
        
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name, date_of_birth, current_flow_step)
        `)
        .eq('id', testId)
        .single();

      if (error) throw error;
      
      setTest(data);
      
      // Set initial workflow stage based on test status
      if (data.workflow_stage === 'sample_collected') {
        setWorkflowStage('sample_collection');
        
        // If we have sample info, use it
        if (data.sample_info) {
          setSampleInfo(data.sample_info);
        }
      } else if (data.workflow_stage === 'testing') {
        setWorkflowStage('testing');
        
        // If we have sample info, use it
        if (data.sample_info) {
          setSampleInfo(data.sample_info);
        }
      } else if (data.workflow_stage === 'review') {
        setWorkflowStage('review');
        
        // If we have sample info and results, use them
        if (data.sample_info) {
          setSampleInfo(data.sample_info);
        }
        
        if (data.results) {
          setTestResults(data.results);
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
          workflow_stage: 'testing',
          status: 'in_progress'
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
          workflow_stage: 'testing',
          status: 'in_progress'
        })
        .eq('id', test.id);

      if (error) throw error;
      
      // Update local state
      setTest({
        ...test,
        sample_info: sampleInfo,
        workflow_stage: 'testing',
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

  const handleTestingComplete = async () => {
    if (!test || !user) return;
    
    try {
      setIsSaving(true);
      
      // Validate test results
      if (Object.keys(testResults).length === 0) {
        addNotification({
          message: 'Please enter test results',
          type: 'warning'
        });
        return;
      }
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Test results submitted:', testResults);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setTest({
          ...test,
          results: testResults,
          workflow_stage: 'review',
          status: 'in_progress'
        });
        
        setWorkflowStage('review');
        
        addNotification({
          message: 'Test results saved successfully',
          type: 'success'
        });
        
        return;
      }
      
      // Update lab test in database
      const { error } = await supabase
        .from('lab_results')
        .update({
          results: {
            ...testResults,
            notes: testNotes,
            is_abnormal: isAbnormal
          },
          workflow_stage: 'review',
          status: 'in_progress'
        })
        .eq('id', test.id);

      if (error) throw error;
      
      // Update local state
      setTest({
        ...test,
        results: {
          ...testResults,
          notes: testNotes,
          is_abnormal: isAbnormal
        },
        workflow_stage: 'review',
        status: 'in_progress'
      });
      
      setWorkflowStage('review');
      
      addNotification({
        message: 'Test results saved successfully',
        type: 'success'
      });
      
    } catch (error: any) {
      console.error('Error saving test results:', error);
      addNotification({
        message: `Error saving results: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewComplete = async () => {
    if (!test || !user) return;
    
    try {
      setIsSaving(true);
      
      if (import.meta.env.DEV) {
        // Simulate successful submission in development
        console.log('Review completed:', { isApproved, reviewNotes });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setTest({
          ...test,
          results: {
            ...test.results,
            review_notes: reviewNotes,
            approved: isApproved
          },
          workflow_stage: 'completed',
          status: 'completed',
          reviewed_by: {
            first_name: 'Current',
            last_name: 'User'
          }
        });
        
        setWorkflowStage('completed');
        
        addNotification({
          message: 'Test review completed successfully',
          type: 'success'
        });
        
        // Update patient flow step if needed
        if (test.patient.current_flow_step === 'lab_tests') {
          // Create a mock function to update patient status
          console.log('Updating patient flow step to waiting_consultation');
          
          // In a real app, we would update the patient's flow step
          // For now, we'll just log it
        }
        
        return;
      }
      
      // Update lab test in database
      const { error } = await supabase
        .from('lab_results')
        .update({
          results: {
            ...test.results,
            review_notes: reviewNotes,
            approved: isApproved
          },
          workflow_stage: 'completed',
          status: 'completed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', test.id);

      if (error) throw error;
      
      // Update patient flow step if needed
      if (test.patient.current_flow_step === 'lab_tests') {
        await supabase
          .from('patients')
          .update({
            current_flow_step: 'waiting_consultation'
          })
          .eq('id', test.patient.id);
      }
      
      // Update local state
      setTest({
        ...test,
        results: {
          ...test.results,
          review_notes: reviewNotes,
          approved: isApproved
        },
        workflow_stage: 'completed',
        status: 'completed',
        reviewed_by: {
          first_name: user.email?.split('@')[0] || 'User',
          last_name: ''
        }
      });
      
      setWorkflowStage('completed');
      
      addNotification({
        message: 'Test review completed successfully',
        type: 'success'
      });
      
    } catch (error: any) {
      console.error('Error completing review:', error);
      addNotification({
        message: `Error completing review: ${error.message}`,
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

  const getSampleTypeOptions = () => {
    const options = [
      { value: 'blood', label: 'Blood' },
      { value: 'urine', label: 'Urine' },
      { value: 'stool', label: 'Stool' },
      { value: 'csf', label: 'Cerebrospinal Fluid' },
      { value: 'sputum', label: 'Sputum' },
      { value: 'swab', label: 'Swab' },
      { value: 'tissue', label: 'Tissue' },
      { value: 'fluid', label: 'Body Fluid' }
    ];
    
    // Filter options based on test type
    if (test?.test_type === 'urinalysis') {
      return options.filter(o => o.value === 'urine');
    } else if (test?.test_type === 'stool_analysis') {
      return options.filter(o => o.value === 'stool');
    } else if (test?.test_type.includes('blood') || 
               test?.test_type === 'complete_blood_count' || 
               test?.test_type === 'liver_function' || 
               test?.test_type === 'kidney_function' ||
               test?.test_type === 'lipid_profile' ||
               test?.test_type === 'hba1c' ||
               test?.test_type === 'coagulation_profile' ||
               test?.test_type === 'electrolytes') {
      return options.filter(o => o.value === 'blood');
    }
    
    return options;
  };

  const getContainerTypeOptions = (sampleType: string) => {
    if (sampleType === 'blood') {
      return [
        { value: 'red_top_tube', label: 'Red Top Tube (No Additives)' },
        { value: 'green_top_tube', label: 'Green Top Tube (Heparin)' },
        { value: 'purple_top_tube', label: 'Purple Top Tube (EDTA)' },
        { value: 'blue_top_tube', label: 'Blue Top Tube (Citrate)' },
        { value: 'gray_top_tube', label: 'Gray Top Tube (Fluoride)' },
        { value: 'yellow_top_tube', label: 'Yellow Top Tube (ACD)' }
      ];
    } else if (sampleType === 'urine') {
      return [
        { value: 'urine_container', label: 'Sterile Urine Container' },
        { value: '24hr_urine_container', label: '24-Hour Urine Container' }
      ];
    } else if (sampleType === 'stool') {
      return [
        { value: 'stool_container', label: 'Stool Collection Container' }
      ];
    } else if (sampleType === 'swab') {
      return [
        { value: 'swab_tube', label: 'Swab Transport Tube' }
      ];
    } else if (sampleType === 'tissue') {
      return [
        { value: 'formalin_container', label: 'Formalin Container' },
        { value: 'slide', label: 'Microscope Slide' }
      ];
    }
    
    return [
      { value: 'generic_container', label: 'Generic Container' }
    ];
  };

  const getTestResultFields = () => {
    if (!test) return [];
    
    switch (test.test_type) {
      case 'complete_blood_count':
        return [
          { name: 'wbc', label: 'White Blood Cells (WBC)', unit: 'x10^9/L', reference: '4.5-11.0' },
          { name: 'rbc', label: 'Red Blood Cells (RBC)', unit: 'x10^12/L', reference: '4.5-5.9' },
          { name: 'hemoglobin', label: 'Hemoglobin (Hb)', unit: 'g/dL', reference: '13.5-17.5' },
          { name: 'hematocrit', label: 'Hematocrit (Hct)', unit: '%', reference: '41-50' },
          { name: 'platelets', label: 'Platelets', unit: 'x10^9/L', reference: '150-450' },
          { name: 'mcv', label: 'Mean Corpuscular Volume (MCV)', unit: 'fL', reference: '80-96' },
          { name: 'mch', label: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', reference: '27-33' },
          { name: 'mchc', label: 'Mean Corpuscular Hemoglobin Concentration (MCHC)', unit: 'g/dL', reference: '33-36' }
        ];
      case 'liver_function':
        return [
          { name: 'alt', label: 'Alanine Aminotransferase (ALT)', unit: 'U/L', reference: '7-56' },
          { name: 'ast', label: 'Aspartate Aminotransferase (AST)', unit: 'U/L', reference: '5-40' },
          { name: 'alp', label: 'Alkaline Phosphatase (ALP)', unit: 'U/L', reference: '44-147' },
          { name: 'ggt', label: 'Gamma-Glutamyl Transferase (GGT)', unit: 'U/L', reference: '8-61' },
          { name: 'bilirubin_total', label: 'Total Bilirubin', unit: 'mg/dL', reference: '0.1-1.2' },
          { name: 'bilirubin_direct', label: 'Direct Bilirubin', unit: 'mg/dL', reference: '0.0-0.3' },
          { name: 'albumin', label: 'Albumin', unit: 'g/dL', reference: '3.5-5.0' },
          { name: 'total_protein', label: 'Total Protein', unit: 'g/dL', reference: '6.0-8.3' }
        ];
      case 'kidney_function':
        return [
          { name: 'creatinine', label: 'Creatinine', unit: 'mg/dL', reference: '0.7-1.3' },
          { name: 'bun', label: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', reference: '7-20' },
          { name: 'egfr', label: 'Estimated GFR', unit: 'mL/min/1.73m²', reference: '>60' },
          { name: 'sodium', label: 'Sodium', unit: 'mmol/L', reference: '135-145' },
          { name: 'potassium', label: 'Potassium', unit: 'mmol/L', reference: '3.5-5.0' },
          { name: 'chloride', label: 'Chloride', unit: 'mmol/L', reference: '98-107' },
          { name: 'bicarbonate', label: 'Bicarbonate', unit: 'mmol/L', reference: '22-29' }
        ];
      case 'lipid_profile':
        return [
          { name: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', reference: '<200' },
          { name: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', reference: '<150' },
          { name: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', reference: '>40' },
          { name: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', reference: '<100' },
          { name: 'cholesterol_hdl_ratio', label: 'Total Cholesterol/HDL Ratio', unit: '', reference: '<5.0' }
        ];
      case 'blood_glucose':
        return [
          { name: 'glucose', label: 'Glucose', unit: 'mg/dL', reference: '70-99' }
        ];
      case 'urinalysis':
        return [
          { name: 'color', label: 'Color', unit: '', reference: 'Pale Yellow to Amber' },
          { name: 'appearance', label: 'Appearance', unit: '', reference: 'Clear' },
          { name: 'specific_gravity', label: 'Specific Gravity', unit: '', reference: '1.005-1.030' },
          { name: 'ph', label: 'pH', unit: '', reference: '4.5-8.0' },
          { name: 'protein', label: 'Protein', unit: '', reference: 'Negative' },
          { name: 'glucose', label: 'Glucose', unit: '', reference: 'Negative' },
          { name: 'ketones', label: 'Ketones', unit: '', reference: 'Negative' },
          { name: 'blood', label: 'Blood', unit: '', reference: 'Negative' },
          { name: 'nitrites', label: 'Nitrites', unit: '', reference: 'Negative' },
          { name: 'leukocytes', label: 'Leukocytes', unit: '', reference: 'Negative' }
        ];
      default:
        return [
          { name: 'result', label: 'Result', unit: '', reference: '' }
        ];
    }
  };

  const isValueAbnormal = (name: string, value: any) => {
    if (!value || value === '') return false;
    
    const field = getTestResultFields().find(f => f.name === name);
    if (!field || !field.reference) return false;
    
    // Check if the reference is a range (e.g., "4.5-11.0")
    if (field.reference.includes('-')) {
      const [min, max] = field.reference.split('-').map(parseFloat);
      const numValue = parseFloat(value);
      return numValue < min || numValue > max;
    }
    
    // Check if the reference is a comparison (e.g., "<200", ">40")
    if (field.reference.startsWith('<')) {
      const threshold = parseFloat(field.reference.substring(1));
      const numValue = parseFloat(value);
      return numValue >= threshold;
    }
    
    if (field.reference.startsWith('>')) {
      const threshold = parseFloat(field.reference.substring(1));
      const numValue = parseFloat(value);
      return numValue <= threshold;
    }
    
    // For non-numeric values (e.g., "Negative")
    if (field.reference === 'Negative') {
      return value !== 'Negative' && value !== 'negative';
    }
    
    return false;
  };

  // Update patient status after completing lab test
  const updatePatientStatus = async () => {
    if (!test || !test.patient) return;
    
    try {
      // Check if the patient is currently in lab_tests flow step
      if (test.patient.current_flow_step === 'lab_tests') {
        // Update patient flow step to waiting_consultation
        if (import.meta.env.DEV) {
          console.log('Updating patient flow step to waiting_consultation');
          return;
        }
        
        const { error } = await supabase
          .from('patients')
          .update({
            current_flow_step: 'waiting_consultation'
          })
          .eq('id', test.patient.id);
          
        if (error) throw error;
        
        console.log('Patient status updated to waiting_consultation');
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
    }
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
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header with workflow progress */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/laboratory')}
              className="mr-3 p-1.5 rounded-full text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Process Laboratory Test</h1>
              <p className="text-primary-100 text-xs">
                {getTestTypeLabel(test.test_type)} • {test.is_emergency && "EMERGENCY • "}
                {test.patient.first_name} {test.patient.last_name}
              </p>
            </div>
          </div>
          
          {/* Workflow progress indicator */}
          <div className="hidden md:flex items-center space-x-1.5 text-white">
            <div className={`flex items-center ${workflowStage === 'sample_collection' ? 'opacity-100' : 'opacity-70'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${workflowStage === 'sample_collection' ? 'bg-white text-primary-600' : 'bg-primary-400 text-white'}`}>
                <Beaker className="h-3.5 w-3.5" />
              </div>
              <span className="ml-1.5 text-xs font-medium">Sample</span>
            </div>
            
            <ChevronRight className="h-3.5 w-3.5 text-primary-200" />
            
            <div className={`flex items-center ${workflowStage === 'testing' ? 'opacity-100' : 'opacity-70'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${workflowStage === 'testing' ? 'bg-white text-primary-600' : workflowStage === 'review' || workflowStage === 'completed' ? 'bg-primary-400 text-white' : 'bg-primary-300/50 text-white'}`}>
                <Flask className="h-3.5 w-3.5" />
              </div>
              <span className="ml-1.5 text-xs font-medium">Testing</span>
            </div>
            
            <ChevronRight className="h-3.5 w-3.5 text-primary-200" />
            
            <div className={`flex items-center ${workflowStage === 'review' ? 'opacity-100' : 'opacity-70'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${workflowStage === 'review' ? 'bg-white text-primary-600' : workflowStage === 'completed' ? 'bg-primary-400 text-white' : 'bg-primary-300/50 text-white'}`}>
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span className="ml-1.5 text-xs font-medium">Review</span>
            </div>
            
            <ChevronRight className="h-3.5 w-3.5 text-primary-200" />
            
            <div className={`flex items-center ${workflowStage === 'completed' ? 'opacity-100' : 'opacity-70'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${workflowStage === 'completed' ? 'bg-white text-primary-600' : 'bg-primary-300/50 text-white'}`}>
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
              <span className="ml-1.5 text-xs font-medium">Complete</span>
            </div>
          </div>
        </div>
        
        {/* Mobile progress indicator */}
        <div className="md:hidden flex justify-between px-5 py-2.5 bg-gray-50">
          <div className={`text-xs font-medium ${workflowStage === 'sample_collection' ? 'text-primary-600' : 'text-gray-500'}`}>
            Sample
          </div>
          <div className={`text-xs font-medium ${workflowStage === 'testing' ? 'text-primary-600' : 'text-gray-500'}`}>
            Testing
          </div>
          <div className={`text-xs font-medium ${workflowStage === 'review' ? 'text-primary-600' : 'text-gray-500'}`}>
            Review
          </div>
          <div className={`text-xs font-medium ${workflowStage === 'completed' ? 'text-primary-600' : 'text-gray-500'}`}>
            Complete
          </div>
        </div>
      </div>

      {/* Patient and Test Info */}
      <div className="bg-white rounded-xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex space-x-3.5">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900">Patient Information</h2>
            <p className="text-gray-700 mt-0.5 text-sm">
              <span className="font-medium">Name:</span> {test.patient.first_name} {test.patient.last_name}
            </p>
            <p className="text-gray-700 text-sm">
              <span className="font-medium">DOB:</span> {new Date(test.patient.date_of_birth).toLocaleDateString()}
            </p>
            <a href={`/patients/${test.patient.id}`} className="text-primary-600 hover:text-primary-800 text-xs mt-0.5 inline-block">
              View Patient Record
            </a>
          </div>
        </div>

        <div className="flex space-x-3.5">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Flask className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900">Test Information</h2>
            <p className="text-gray-700 mt-0.5 text-sm">
              <span className="font-medium">Test Type:</span> {getTestTypeLabel(test.test_type)}
            </p>
            <p className="text-gray-700 text-sm">
              <span className="font-medium">Date:</span> {new Date(test.test_date).toLocaleDateString()}
            </p>
            {test.is_emergency && (
              <div className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                EMERGENCY
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Stages */}
      {workflowStage === 'sample_collection' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-base font-medium text-gray-900">Sample Collection</h2>
            <p className="text-xs text-gray-500 mt-0.5">Record sample details and collection information</p>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3.5">
                <div>
                  <label className="form-label required text-sm">Sample ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Beaker className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={sampleInfo.sample_id}
                      className="form-input pl-9 py-2 text-sm bg-gray-50 rounded-lg"
                      placeholder="LAB-20250511-1234"
                      readOnly
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">Auto-generated unique sample identifier</p>
                </div>
                
                <div>
                  <label className="form-label required text-sm">Sample Type</label>
                  <select
                    value={sampleInfo.sample_type}
                    onChange={(e) => setSampleInfo({...sampleInfo, sample_type: e.target.value})}
                    className="form-input py-2 text-sm rounded-lg"
                  >
                    {getSampleTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="form-label required text-sm">Container Type</label>
                  <select
                    value={sampleInfo.container_type}
                    onChange={(e) => setSampleInfo({...sampleInfo, container_type: e.target.value})}
                    className="form-input py-2 text-sm rounded-lg"
                  >
                    {getContainerTypeOptions(sampleInfo.sample_type).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-3.5">
                <div>
                  <label className="form-label required text-sm">Collection Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="datetime-local"
                      value={new Date(sampleInfo.collection_time).toISOString().slice(0, 16)}
                      onChange={(e) => setSampleInfo({...sampleInfo, collection_time: new Date(e.target.value).toISOString()})}
                      className="form-input pl-9 py-2 text-sm rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-1.5">Collection Instructions</h3>
                  <ul className="space-y-1 text-xs text-blue-700 list-disc pl-4">
                    <li>Verify patient identity before collection</li>
                    <li>Use appropriate PPE during collection</li>
                    <li>Label sample immediately after collection</li>
                    <li>Store sample according to test requirements</li>
                    <li>Transport to laboratory promptly</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3.5 mt-6">
              <button
                onClick={() => navigate('/laboratory')}
                className="btn btn-outline py-2 text-sm px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleSampleCollection}
                disabled={isSaving || !sampleInfo.sample_id || !sampleInfo.sample_type || !sampleInfo.container_type}
                className="btn btn-primary py-2 text-sm px-4"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Start Testing <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {workflowStage === 'testing' && (
        <>
          {/* Sample Info Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-base font-medium text-gray-900">Sample Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">Sample details for reference during testing</p>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-success-500"></div>
                <span className="text-xs font-medium text-success-700">Sample Collected</span>
              </div>
            </div>
            
            <div className="p-3.5 grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-gray-50/50">
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Sample ID</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{sampleInfo.sample_id}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Sample Type</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{getSampleTypeOptions().find(o => o.value === sampleInfo.sample_type)?.label || sampleInfo.sample_type}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Container</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{getContainerTypeOptions(sampleInfo.sample_type).find(o => o.value === sampleInfo.container_type)?.label || sampleInfo.container_type}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Collection Time</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{new Date(sampleInfo.collection_time).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Test Results</h2>
              <p className="text-xs text-gray-500 mt-0.5">Enter the laboratory test results</p>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {getTestResultFields().map((field) => (
                  <div key={field.name}>
                    <label className="form-label text-sm">{field.label}</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={testResults[field.name] || ''}
                        onChange={(e) => {
                          setTestResults({
                            ...testResults,
                            [field.name]: e.target.value
                          });
                        }}
                        className={`form-input py-2 text-sm rounded-lg flex-1 ${
                          testResults[field.name] && isValueAbnormal(field.name, testResults[field.name])
                            ? 'border-error-300 text-error-900'
                            : ''
                        }`}
                        placeholder="Enter value"
                      />
                      {field.unit && (
                        <div className="ml-2 flex items-center bg-gray-100 px-3 rounded-lg">
                          <span className="text-sm text-gray-500">{field.unit}</span>
                        </div>
                      )}
                    </div>
                    {field.reference && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Reference: {field.reference}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="form-label text-sm">Notes</label>
                <textarea
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  className="form-input py-2 text-sm rounded-lg"
                  rows={3}
                  placeholder="Add any notes or observations about the test results"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAbnormal"
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isAbnormal" className="ml-2 block text-sm text-gray-900">
                  Flag results as abnormal
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3.5">
            <button
              onClick={() => navigate('/laboratory')}
              className="btn btn-outline py-2 text-sm px-4"
            >
              Save for Later
            </button>
            <button
              onClick={handleTestingComplete}
              disabled={isSaving}
              className="btn btn-primary py-2 text-sm px-4"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                  Saving...
                </>
              ) : (
                <>
                  Complete & Submit for Review <FileText className="h-4 w-4 ml-1.5" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {workflowStage === 'review' && (
        <>
          {/* Sample Info Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-base font-medium text-gray-900">Test Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">Review test results and sample information</p>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary-500"></div>
                <span className="text-xs font-medium text-secondary-700">Ready for Review</span>
              </div>
            </div>
            
            <div className="p-3.5 grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-gray-50/50">
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Sample ID</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{sampleInfo.sample_id}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Test Type</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{getTestTypeLabel(test.test_type)}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Sample Type</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{getSampleTypeOptions().find(o => o.value === sampleInfo.sample_type)?.label || sampleInfo.sample_type}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Collection Time</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{new Date(sampleInfo.collection_time).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Test Results Review */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">Test Results Review</h2>
              <p className="text-xs text-gray-500 mt-0.5">Review and verify the test results</p>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {getTestResultFields().map((field) => (
                  <div key={field.name} className="flex justify-between items-center p-3 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{field.label}</p>
                      <p className="text-xs text-gray-500">{field.reference && `Reference: ${field.reference}`}</p>
                    </div>
                    <div className="flex items-center">
                      <p className={`text-sm font-medium ${
                        testResults[field.name] && isValueAbnormal(field.name, testResults[field.name])
                          ? 'text-error-600'
                          : 'text-gray-900'
                      }`}>
                        {testResults[field.name] || 'N/A'} {field.unit}
                      </p>
                      {testResults[field.name] && isValueAbnormal(field.name, testResults[field.name]) && (
                        <AlertTriangle className="h-4 w-4 text-error-500 ml-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {testNotes && (
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">Technician Notes</p>
                  <p className="text-sm text-gray-700 mt-1">{testNotes}</p>
                </div>
              )}

              <div>
                <label className="form-label text-sm">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="form-input py-2 text-sm rounded-lg"
                  rows={3}
                  placeholder="Add any notes or comments about the test results"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isApproved"
                  checked={isApproved}
                  onChange={(e) => setIsApproved(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isApproved" className="ml-2 block text-sm text-gray-900">
                  Approve results for release
                </label>
              </div>
              
              {!isApproved && (
                <div className="p-3 rounded-lg bg-error-50 border border-error-200">
                  <p className="text-sm font-medium text-error-800">Results not approved</p>
                  <p className="text-sm text-error-700 mt-1">Please provide detailed notes explaining why the results are not approved and what actions should be taken.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3.5">
            <button
              onClick={() => navigate('/laboratory')}
              className="btn btn-outline py-2 text-sm px-4"
            >
              Save for Later
            </button>
            <button
              onClick={() => setConfirmRelease(true)}
              disabled={isSaving}
              className="btn btn-primary py-2 text-sm px-4"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                  Saving...
                </>
              ) : (
                <>
                  {isApproved ? 'Approve & Release Results' : 'Reject & Return for Testing'} <CheckCircle className="h-4 w-4 ml-1.5" />
                </>
              )}
            </button>
          </div>
          
          {/* Confirmation Modal */}
          {confirmRelease && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {isApproved ? 'Confirm Results Release' : 'Confirm Results Rejection'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isApproved 
                    ? 'Are you sure you want to approve and release these test results? This action cannot be undone.'
                    : 'Are you sure you want to reject these results and return them for retesting? This action cannot be undone.'}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setConfirmRelease(false)}
                    className="btn btn-outline py-2 text-sm px-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setConfirmRelease(false);
                      handleReviewComplete();
                      updatePatientStatus(); // Update patient status after completing the test
                    }}
                    className={`btn py-2 text-sm px-4 ${isApproved ? 'btn-primary' : 'btn-error'}`}
                  >
                    {isApproved ? 'Approve & Release' : 'Reject & Return'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {workflowStage === 'completed' && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="w-14 h-14 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-3.5">
            <CheckCircle className="h-7 w-7 text-success-600" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1.5">Test Results Finalized</h2>
          <p className="text-gray-600 mb-5 max-w-md mx-auto text-sm">This test has been completed and the results have been finalized. The results are now available to the requesting physician.</p>
          <button
            onClick={() => navigate('/laboratory')}
            className="btn btn-primary py-2 text-sm px-4"
          >
            Return to Laboratory
          </button>
        </div>
      )}
    </div>
  );
};

export default LabTestProcessForm;