import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataAPI, analyticsAPI } from '../api/client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { TrendingUp, Users, Trophy } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedSport, setSelectedSport] = useState<number>(1);

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const response = await dataAPI.getSports();
      return response.data.data.sports;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', selectedSport],
    queryFn: async () => {
      const response = await dataAPI.getTeams(selectedSport);
      return response.data.data.teams;
    },
  });

  const { data: players } = useQuery({
    queryKey: ['players', selectedTeam],
    queryFn: async () => {
      if (!selectedTeam) return [];
      const response = await dataAPI.getPlayers(selectedTeam);
      return response.data.data.players;
    },
    enabled: !!selectedTeam,
  });

  const { data: playerTrends } = useQuery({
    queryKey: ['playerTrends', selectedPlayer],
    queryFn: async () => {
      if (!selectedPlayer) return null;
      const response = await analyticsAPI.getPlayerTrends(selectedPlayer);
      return response.data.data;
    },
    enabled: !!selectedPlayer,
  });

  const { data: teamPerformance } = useQuery({
    queryKey: ['teamPerformance', selectedTeam],
    queryFn: async () => {
      if (!selectedTeam) return null;
      const response = await analyticsAPI.getTeamPerformance(selectedTeam);
      return response.data.data;
    },
    enabled: !!selectedTeam,
  });

  const chartData = playerTrends
    ? {
        labels: playerTrends.trends.map((t: any) =>
          new Date(t.date).toLocaleDateString()
        ),
        datasets: [
          {
            label: 'Performance Trend',
            data: playerTrends.trends.map((t: any) => t.minutesPlayed),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Moving Average',
            data: playerTrends.movingAverage.map((ma: any) => ma.value),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false,
            tension: 0.4,
            borderDash: [5, 5],
          },
        ],
      }
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Analyze player and team performance with interactive visualizations
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <select
              value={selectedSport}
              onChange={(e) => {
                setSelectedSport(Number(e.target.value));
                setSelectedTeam(null);
                setSelectedPlayer(null);
              }}
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
              Team
            </label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => {
                setSelectedTeam(Number(e.target.value));
                setSelectedPlayer(null);
              }}
              className="input"
            >
              <option value="">Select team...</option>
              {teams?.map((team: any) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player
            </label>
            <select
              value={selectedPlayer || ''}
              onChange={(e) => setSelectedPlayer(Number(e.target.value))}
              className="input"
              disabled={!selectedTeam}
            >
              <option value="">Select player...</option>
              {players?.map((player: any) => (
                <option key={player.id} value={player.id}>
                  {player.first_name} {player.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats Cards */}
        {teamPerformance && (
          <>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Win Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {(teamPerformance.record.winPercentage * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Wins
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {teamPerformance.record.wins}
                  </p>
                </div>
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Losses
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {teamPerformance.record.losses}
                  </p>
                </div>
                <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      {chartData && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Player Performance Trends</h2>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      )}

      {/* Team Performance Details */}
      {teamPerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Home vs Away</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Home Wins</span>
                <span className="text-2xl font-bold text-green-600">
                  {teamPerformance.homeRecord.wins}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Home Losses</span>
                <span className="text-2xl font-bold text-red-600">
                  {teamPerformance.homeRecord.losses}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Away Wins</span>
                <span className="text-2xl font-bold text-blue-600">
                  {teamPerformance.awayRecord.wins}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Away Losses</span>
                <span className="text-2xl font-bold text-orange-600">
                  {teamPerformance.awayRecord.losses}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Recent Games</h2>
            <div className="space-y-2">
              {teamPerformance.recentGames.slice(0, 5).map((game: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    game.result === 'win' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {game.venue === 'home' ? 'vs' : '@'} Opponent
                    </span>
                    <span
                      className={`font-bold ${
                        game.result === 'win'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {game.result.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(game.game_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedPlayer && !selectedTeam && (
        <div className="card text-center py-12">
          <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Select a team or player to view analytics
          </h3>
          <p className="text-gray-500">
            Use the filters above to explore performance data and trends
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
