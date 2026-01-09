import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataAPI } from '../api/client';
import { Trophy, MapPin, Calendar, Users } from 'lucide-react';

const Teams = () => {
  const [selectedSport, setSelectedSport] = useState<number | null>(null);

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const response = await dataAPI.getSports();
      return response.data.data.sports;
    },
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', selectedSport],
    queryFn: async () => {
      const response = await dataAPI.getTeams(
        selectedSport || undefined
      );
      return response.data.data.teams;
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="text-gray-600 mt-2">
          Browse teams across different sports
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Sport
        </label>
        <select
          value={selectedSport || ''}
          onChange={(e) =>
            setSelectedSport(e.target.value ? Number(e.target.value) : null)
          }
          className="input max-w-xs"
        >
          <option value="">All Sports</option>
          {sports?.map((sport: any) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading teams...</div>
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: any) => (
            <div
              key={team.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Trophy className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {team.name}
                  </h3>
                  {team.abbreviation && (
                    <p className="text-sm text-gray-500">
                      {team.abbreviation}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {team.city && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{team.city}</span>
                  </div>
                )}
                {team.founded_year && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Founded {team.founded_year}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{team.sport_name}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href={`/analytics?team=${team.id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Analytics →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No teams found
          </h3>
          <p className="text-gray-500">
            Upload data to add teams to the platform
          </p>
        </div>
      )}
    </div>
  );
};

export default Teams;
