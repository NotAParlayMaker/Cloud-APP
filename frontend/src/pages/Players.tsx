import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataAPI } from '../api/client';
import { Users, Trophy, Ruler, Weight, Calendar } from 'lucide-react';

const Players = () => {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await dataAPI.getTeams();
      return response.data.data.teams;
    },
  });

  const { data: players, isLoading } = useQuery({
    queryKey: ['players', selectedTeam],
    queryFn: async () => {
      const response = await dataAPI.getPlayers(
        selectedTeam || undefined
      );
      return response.data.data.players;
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Players</h1>
        <p className="text-gray-600 mt-2">
          Browse player profiles and statistics
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Team
        </label>
        <select
          value={selectedTeam || ''}
          onChange={(e) =>
            setSelectedTeam(e.target.value ? Number(e.target.value) : null)
          }
          className="input max-w-xs"
        >
          <option value="">All Teams</option>
          {teams?.map((team: any) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading players...</div>
        </div>
      ) : players && players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player: any) => (
            <div
              key={player.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {player.first_name} {player.last_name}
                  </h3>
                  {player.jersey_number && (
                    <p className="text-sm text-gray-500">
                      #{player.jersey_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {player.team_name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="w-4 h-4 mr-2" />
                    <span>{player.team_name}</span>
                  </div>
                )}
                {player.position && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{player.position}</span>
                  </div>
                )}
                {player.height_cm && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Ruler className="w-4 h-4 mr-2" />
                    <span>{player.height_cm} cm</span>
                  </div>
                )}
                {player.weight_kg && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Weight className="w-4 h-4 mr-2" />
                    <span>{player.weight_kg} kg</span>
                  </div>
                )}
                {player.birth_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {new Date(player.birth_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                <a
                  href={`/analytics?player=${player.id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Analytics →
                </a>
                <a
                  href={`/predictions?player=${player.id}`}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Predictions →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No players found
          </h3>
          <p className="text-gray-500">
            Upload data to add players to the platform
          </p>
        </div>
      )}
    </div>
  );
};

export default Players;
