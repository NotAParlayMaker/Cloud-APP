import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataAPI } from '../api/client';
import { Upload, FileText, Download, Link as LinkIcon } from 'lucide-react';

const DataUpload = () => {
  const [uploadType, setUploadType] = useState<'file' | 'api'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [sportTypeId, setSportTypeId] = useState<number>(1);
  const [isPublic, setIsPublic] = useState(false);
  const [apiSource, setApiSource] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const response = await dataAPI.getSports();
      return response.data.data.sports;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await dataAPI.uploadFile(formData);
    },
    onSuccess: () => {
      setSuccess('Data uploaded successfully!');
      setError('');
      setFile(null);
      setDatasetName('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Upload failed');
      setSuccess('');
    },
  });

  const apiImportMutation = useMutation({
    mutationFn: async (data: any) => {
      return await dataAPI.importFromAPI(data);
    },
    onSuccess: () => {
      setSuccess('Data imported successfully!');
      setError('');
      setApiSource('');
      setApiEndpoint('');
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Import failed');
      setSuccess('');
    },
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', datasetName);
    formData.append('description', description);
    formData.append('sportTypeId', sportTypeId.toString());
    formData.append('isPublic', isPublic.toString());

    uploadMutation.mutate(formData);
  };

  const handleApiImport = async (e: React.FormEvent) => {
    e.preventDefault();

    apiImportMutation.mutate({
      source: apiSource,
      endpoint: apiEndpoint,
      sportTypeId,
      params: {},
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-gray-600 mt-2">
          Import sports data from files or external APIs
        </p>
      </div>

      {/* Upload Type Selector */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setUploadType('file')}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
            uploadType === 'file'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FileText className="w-5 h-5 mr-2" />
          File Upload
        </button>
        <button
          onClick={() => setUploadType('api')}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
            uploadType === 'api'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <LinkIcon className="w-5 h-5 mr-2" />
          API Import
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="card">
          {uploadType === 'file' ? (
            <>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary-600" />
                Upload CSV/JSON File
              </h2>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dataset Name
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport Type
                  </label>
                  <select
                    value={sportTypeId}
                    onChange={(e) => setSportTypeId(Number(e.target.value))}
                    className="input"
                  >
                    {sports?.map((sport: any) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File (CSV or JSON)
                  </label>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="input"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this dataset public
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="w-full btn btn-primary"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Dataset'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-primary-600" />
                Import from API
              </h2>
              <form onSubmit={handleApiImport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Source
                  </label>
                  <select
                    value={apiSource}
                    onChange={(e) => setApiSource(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select source...</option>
                    <option value="nba">NBA API</option>
                    <option value="nfl">NFL API</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint
                  </label>
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="input"
                    placeholder="scores/json/GamesByDate/2024-01-01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport Type
                  </label>
                  <select
                    value={sportTypeId}
                    onChange={(e) => setSportTypeId(Number(e.target.value))}
                    className="input"
                  >
                    {sports?.map((sport: any) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={apiImportMutation.isPending}
                  className="w-full btn btn-primary"
                >
                  {apiImportMutation.isPending ? 'Importing...' : 'Import Data'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Information */}
        <div className="card bg-blue-50">
          <h2 className="text-xl font-bold mb-4">Supported Data Formats</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">CSV Files</h3>
              <p className="text-sm text-gray-700">
                Upload CSV files with headers. Supported data types:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                <li>Game results and scores</li>
                <li>Player statistics</li>
                <li>Team information</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">JSON Files</h3>
              <p className="text-sm text-gray-700">
                Upload JSON arrays or objects with structured sports data.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">API Sources</h3>
              <p className="text-sm text-gray-700">
                Connect to public sports APIs:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                <li>NBA Stats API</li>
                <li>NFL Data API</li>
                <li>Custom REST APIs</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Example Data
              </h3>
              <a
                href="#"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <Download className="w-4 h-4 inline mr-1" />
                Download sample CSV
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
