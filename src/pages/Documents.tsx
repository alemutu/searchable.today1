import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Search, Filter, FileText, FileImage, FilePlus, Download, Eye, Calendar } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface Document {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  document_type: string;
  title: string;
  file_url: string;
  uploaded_at: string;
  description: string | null;
  tags: string[] | null;
  uploaded_by: {
    first_name: string;
    last_name: string;
  } | null;
}

const Documents: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hospital } = useAuthStore();

  useEffect(() => {
    fetchDocuments();
  }, [hospital, patientId]);

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          patient:patient_id(id, first_name, last_name),
          uploaded_by:uploaded_by(first_name, last_name)
        `)
        .order('uploaded_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'lab_result': 'Lab Result',
      'radiology_image': 'Radiology Image',
      'referral_letter': 'Referral Letter',
      'discharge_summary': 'Discharge Summary',
      'consent_form': 'Consent Form',
      'prescription': 'Prescription',
      'medical_certificate': 'Medical Certificate',
      'insurance_document': 'Insurance Document',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'radiology_image':
        return <FileImage className="h-5 w-5 text-gray-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const filteredDocuments = documents.filter(document => {
    const patientName = `${document.patient.first_name} ${document.patient.last_name}`.toLowerCase();
    const documentTitle = document.title.toLowerCase();
    const documentDescription = document.description?.toLowerCase() || '';
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         documentTitle.includes(searchTerm.toLowerCase()) ||
                         documentDescription.includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || document.document_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {patientId ? 'Patient Documents' : 'Medical Documents'}
        </h1>
        <Link to={patientId ? `/patients/${patientId}/documents/upload` : "/documents/upload"} className="btn btn-primary inline-flex items-center">
          <FilePlus className="h-5 w-5 mr-2" />
          Upload Document
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{documents.length}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-100">
              <FileText className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Uploaded This Month</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {documents.filter(d => {
                  const uploadDate = new Date(d.uploaded_at);
                  const now = new Date();
                  return uploadDate.getMonth() === now.getMonth() && 
                         uploadDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-success-100">
              <Calendar className="h-6 w-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Radiology Images</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {documents.filter(d => d.document_type === 'radiology_image').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-accent-100">
              <FileImage className="h-6 w-6 text-accent-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
              placeholder="Search by patient, title, or description..."
            />
          </div>
          
          <div className="relative sm:w-1/4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Types</option>
              <option value="lab_result">Lab Results</option>
              <option value="radiology_image">Radiology Images</option>
              <option value="referral_letter">Referral Letters</option>
              <option value="discharge_summary">Discharge Summaries</option>
              <option value="consent_form">Consent Forms</option>
              <option value="prescription">Prescriptions</option>
              <option value="medical_certificate">Medical Certificates</option>
              <option value="insurance_document">Insurance Documents</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getDocumentTypeIcon(document.document_type)}
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">{document.title}</div>
                          {document.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">{document.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {document.patient.first_name} {document.patient.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getDocumentTypeLabel(document.document_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(document.uploaded_at).toLocaleDateString()}
                      </div>
                      {document.uploaded_by && (
                        <div className="text-xs text-gray-500">
                          by {document.uploaded_by.first_name} {document.uploaded_by.last_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {document.tags && document.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <a 
                          href={document.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                        <a 
                          href={document.file_url} 
                          download 
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Documents;