import { useQuery } from '@tanstack/react-query';
import { dataAPI } from '../api/client';
import {
  Database,
  TrendingUp,
  Trophy,
  Activity,
  Brain,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { data: datasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const response = await dataAPI.getDatasets();
      return response.data.data.datasets;
    },
  });

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const response = await dataAPI.getSports();
      return response.data.data.sports;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await dataAPI.getTeams();
      return response.data.data.teams;
    },
  });

  const stats = [
    {
      label: 'Total Datasets',
      value: datasets?.length || 0,
      icon: Database,
      color: 'bg-blue-500',
      link: '/datasets',
    },
    {
      label: 'Sports Tracked',
      value: sports?.length || 0,
      icon: Activity,
      color: 'bg-green-500',
      link: '/analytics',
    },
    {
      label: 'Teams',
      value: teams?.length || 0,
      icon: Trophy,
      color: 'bg-purple-500',
      link: '/teams',
    },
    {
      label: 'ML Models',
      value: 0,
      icon: Brain,
      color: 'bg-orange-500',
      link: '/predictions',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to OpenSportsAnalytics - Your sports data command center
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/upload"
              className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-primary-900">Upload Data</h3>
              <p className="text-sm text-primary-700 mt-1">
                Import CSV/JSON files or fetch from APIs
              </p>
            </Link>
            <Link
              to="/analytics"
              className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-green-900">
                View Analytics
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Explore trends and team performance
              </p>
            </Link>
            <Link
              to="/predictions"
              className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-purple-900">
                AI Predictions
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                Generate predictions using ML models
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Datasets */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-primary-600" />
            Recent Datasets
          </h2>
          {datasets && datasets.length > 0 ? (
            <div className="space-y-3">
              {datasets.slice(0, 5).map((dataset: any) => (
                <div
                  key={dataset.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <h3 className="font-medium text-gray-900">
                    {dataset.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {dataset.record_count} records • {dataset.sport_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    By {dataset.username}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No datasets yet</p>
              <Link
                to="/upload"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
              >
                Upload your first dataset
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h2 className="text-2xl font-bold mb-4">
          Getting Started with OpenSportsAnalytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold mb-2">1</div>
            <h3 className="font-semibold mb-2">Upload Your Data</h3>
            <p className="text-primary-100 text-sm">
              Import sports data from CSV/JSON files or connect to public APIs
            </p>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">2</div>
            <h3 className="font-semibold mb-2">Analyze & Visualize</h3>
            <p className="text-primary-100 text-sm">
              Use built-in analytics tools to explore trends and insights
            </p>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">3</div>
            <h3 className="font-semibold mb-2">Train ML Models</h3>
            <p className="text-primary-100 text-sm">
              Build predictive models for games, players, and injury risks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
