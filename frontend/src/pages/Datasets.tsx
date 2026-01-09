import { useQuery } from '@tanstack/react-query';
import { dataAPI } from '../api/client';
import { Database, Users, Calendar, Lock, Globe } from 'lucide-react';

const Datasets = () => {
  const { data: datasets, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const response = await dataAPI.getDatasets();
      return response.data.data.datasets;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading datasets...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Datasets</h1>
        <p className="text-gray-600 mt-2">
          Browse and manage your sports data collections
        </p>
      </div>

      {datasets && datasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset: any) => (
            <div key={dataset.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    {dataset.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {dataset.description || 'No description provided'}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    dataset.is_public ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {dataset.is_public ? (
                    <Globe className="w-5 h-5 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Database className="w-4 h-4 mr-2" />
                  <span>{dataset.record_count} records</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>By {dataset.username}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {dataset.sport_name}
                </span>
                <span
                  className={`inline-block px-3 py-1 ml-2 rounded-full text-xs font-medium ${
                    dataset.is_public
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {dataset.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No datasets yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start by uploading your first dataset
          </p>
          <a href="/upload" className="btn btn-primary inline-block">
            Upload Data
          </a>
        </div>
      )}
    </div>
  );
};

export default Datasets;
