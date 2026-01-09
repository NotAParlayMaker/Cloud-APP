import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dataAPI, mlAPI } from '../api/client';
import { Brain, Target, AlertTriangle, TrendingUp } from 'lucide-react';

const Predictions = () => {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [injuryRisk, setInjuryRisk] = useState<any>(null);

  const { data: games } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await dataAPI.getGames({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
      return response.data.data.games;
    },
  });

  const { data: players } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const response = await dataAPI.getPlayers();
      return response.data.data.players;
    },
  });

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await mlAPI.getModels();
      return response.data.data.models;
    },
  });

  const predictGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await mlAPI.predictGame(gameId);
      return response.data.data;
    },
    onSuccess: (data) => {
      setPrediction(data);
    },
  });

  const predictInjuryMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await mlAPI.getInjuryRisk(playerId);
      return response.data.data;
    },
    onSuccess: (data) => {
      setInjuryRisk(data);
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Predictions</h1>
        <p className="text-gray-600 mt-2">
          Generate predictions using machine learning models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* ML Models Stats */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Available Models
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {models?.length || 0}
              </p>
            </div>
            <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Predictions Made
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Avg Accuracy
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
            </div>
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Outcome Prediction */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary-600" />
            Predict Game Outcome
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Game
              </label>
              <select
                value={selectedGame || ''}
                onChange={(e) => setSelectedGame(Number(e.target.value))}
                className="input"
              >
                <option value="">Select a game...</option>
                {games?.map((game: any) => (
                  <option key={game.id} value={game.id}>
                    {game.home_team_name} vs {game.away_team_name} -{' '}
                    {new Date(game.game_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                selectedGame && predictGameMutation.mutate(selectedGame)
              }
              disabled={!selectedGame || predictGameMutation.isPending}
              className="w-full btn btn-primary"
            >
              {predictGameMutation.isPending
                ? 'Predicting...'
                : 'Generate Prediction'}
            </button>

            {prediction && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <h3 className="font-semibold mb-3">Prediction Results</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Home Win Probability:</span>
                    <span className="font-bold text-primary-600">
                      {(prediction.prediction.homeWinProbability * 100).toFixed(
                        1
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Away Win Probability:</span>
                    <span className="font-bold text-primary-600">
                      {(prediction.prediction.awayWinProbability * 100).toFixed(
                        1
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Predicted Winner:</span>
                    <span className="font-bold text-green-600 uppercase">
                      {prediction.prediction.predictedWinner}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Confidence:</span>
                    <span className="font-bold">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Injury Risk Prediction */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            Injury Risk Analysis
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Player
              </label>
              <select
                value={selectedPlayer || ''}
                onChange={(e) => setSelectedPlayer(Number(e.target.value))}
                className="input"
              >
                <option value="">Select a player...</option>
                {players?.map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {player.first_name} {player.last_name} - {player.team_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                selectedPlayer && predictInjuryMutation.mutate(selectedPlayer)
              }
              disabled={!selectedPlayer || predictInjuryMutation.isPending}
              className="w-full btn btn-primary"
            >
              {predictInjuryMutation.isPending
                ? 'Analyzing...'
                : 'Analyze Risk'}
            </button>

            {injuryRisk && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold mb-3">Risk Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Risk Level:</span>
                    <span
                      className={`font-bold uppercase ${
                        injuryRisk.riskLevel === 'high'
                          ? 'text-red-600'
                          : injuryRisk.riskLevel === 'medium'
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {injuryRisk.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Risk Score:</span>
                    <span className="font-bold">
                      {(injuryRisk.riskScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Factors:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {injuryRisk.factors.map((factor: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Models */}
      {models && models.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-xl font-bold mb-4">Available ML Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model: any) => (
              <div key={model.id} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">{model.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {model.description}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Type: {model.model_type}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {(model.accuracy * 100).toFixed(1)}% accuracy
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
