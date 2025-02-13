'use client';

import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaChartBar, FaTable } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

// Tarifs définis "par million de tokens" (doivent correspondre à ceux du track usage)
const modelRates = {
  'gpt-4o-2024-08-06': {
    input: 2.50,
    output: 10.00,
    label: 'GPT-4o',
  },
  'gpt-4o-mini-2024-07-18': {
    input: 0.15,
    output: 0.60,
    label: 'GPT-4o Mini',
  },
  'o1-mini-2024-09-12': {
    input: 1.10,
    output: 4.40,
    label: 'O1 Mini',
  },
  'mistral-large-latest': {
    input: 1.8,
    output: 5.4,
    label: 'Mistral Large (24.11)',
  },
  'pixtral-large-latest': {
    input: 1.8,
    output: 5.4,
    label: 'Pixtral Large',
  },
  'mistral-small-latest': {
    input: 0.09,
    output: 0.3,
    label: 'Mistral Small 3',
  },
};

// Fonction pour formater un float en string (ex. 0.18 => "0,18")
const formatFloat = (num) => {
  if (typeof num !== 'number') return '';
  return num.toFixed(2).replace('.', ',');
};

export default function UsageStatsAvecTarifsEtGlobal({ onClose }) {
  const [usageData, setUsageData] = useState([]);
  const [error, setError] = useState(null);

  // Sélecteurs
  const [groupBy, setGroupBy] = useState('model'); // 'model' ou 'user'
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'chart'
  const [periode, setPeriode] = useState('hebdo');   // 'hebdo', 'mensuel', 'annuel', 'total'
  const [typeValeur, setTypeValeur] = useState('jetons'); // 'jetons' ou 'cout'

  // Filtres
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/usage');
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        const data = await res.json();
        setUsageData(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchUsage();
  }, []);

  const parseFloatSafe = (val) => {
    if (!val) return 0;
    const num = parseFloat(val);
    return Number.isNaN(num) ? 0 : num;
  };

  // 1) Déterminer la colonne à afficher (jetons ou coût)
  const getColumnKey = () => {
    if (typeValeur === 'jetons') {
      switch (periode) {
        case 'hebdo':   return 'weeklyTokens';
        case 'mensuel': return 'monthlyTokens';
        case 'annuel':  return 'yearlyTokens';
        default:        return 'totalTokens';
      }
    } else {
      // typeValeur = 'cout'
      switch (periode) {
        case 'hebdo':   return 'weeklyCost';
        case 'mensuel': return 'monthlyCost';
        case 'annuel':  return 'yearlyCost';
        default:        return 'totalCost';
      }
    }
  };
  const columnKey = getColumnKey();

  // 2) Libellé de la colonne
  const getEnteteColonne = () => {
    const txtPer = { hebdo: 'Hebdomadaire', mensuel: 'Mensuel', annuel: 'Annuel', total: 'Total' }[periode];
    const txtType = (typeValeur === 'jetons') ? 'Jetons' : 'Coût';
    return `${txtPer} (${txtType})`;
  };

  // 3) Filtrage
  let filtered = usageData;
  if (selectedModels.length > 0) {
    filtered = filtered.filter(u => selectedModels.includes(u.model_name));
  }
  if (selectedUser) {
    filtered = filtered.filter(u => u.username === selectedUser);
  }

  // 4) Groupement
  const groupKey = (groupBy === 'model') ? 'model_name' : 'username';
  function groupRows(data, key) {
    const map = {};
    data.forEach((item) => {
      const val = item[key];
      if (!map[val]) {
        map[val] = [];
      }
      map[val].push(item);
    });
    return map;
  }
  const grouped = groupRows(filtered, groupKey);

  // 5) Calcul du total local pour chaque groupe
  const calcTotal = (items) => {
    let sum = 0;
    items.forEach((u) => {
      const rawVal = u[columnKey];
      let val = 0;
      if (typeValeur === 'jetons') {
        val = parseInt(rawVal, 10) || 0;
      } else {
        val = parseFloatSafe(rawVal);
      }
      sum += val;
    });
    return sum;
  };

  // 6) Global total
  const globalTotal = calcTotal(filtered);

  // 7) Data pour le chart “principal”
  const chartData = Object.entries(grouped).map(([groupValue, items]) => {
    return {
      name: groupValue,
      valeur: calcTotal(items),
    };
  });

  // 8) Couleur barre
  const barColor = (typeValeur === 'jetons') ? '#377eb8' : '#e41a1c';

  // Petit format tooltip
  const formatTooltip = (value) => {
    if (typeValeur === 'jetons') {
      return value;
    } else {
      return parseFloatSafe(value).toFixed(6);
    }
  };

  // 9) Global Chart par modèle (indépendamment du groupement)
  function buildGlobalModelChartData() {
    const modelMap = groupRows(filtered, 'model_name');
    return Object.entries(modelMap).map(([model, items]) => {
      return {
        modelName: model,
        totalVal: calcTotal(items),
      };
    });
  }
  const globalModelData = buildGlobalModelChartData();

  const titreGlobalChart = `Global par Modèle - ${getEnteteColonne()}`;

  return (
    <div className="p-8 relative z-10 min-h-screen flex flex-col">
      {/* En-tête */}
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white title-gradient">
          Rapport d'usage + Tarifs
        </h1>
        <button
          onClick={onClose}
          className="modern-button text-white py-2 px-4 rounded flex items-center gap-2"
        >
          <FaArrowLeft />
          Retour
        </button>
      </nav>

      {/* Encart Tarifs par million */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-md text-white">
        <h2 className="text-xl font-bold mb-2">Tarifs par million de tokens</h2>
        <p className="text-sm text-gray-300 mb-3">
          (Exemple : Input = "prompt" tokens, Output = "completion" tokens)
        </p>
        <table className="min-w-full border border-gray-700 text-sm">
          <thead>
            <tr className="bg-gray-700 text-gray-200">
              <th className="p-2 text-left">Modèle</th>
              <th className="p-2 text-left">Coût Input ($/million)</th>
              <th className="p-2 text-left">Coût Output ($/million)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(modelRates).map(([key, rate]) => (
              <tr key={key} className="border-b border-gray-700">
                <td className="p-2 text-gray-300">{rate.label || key}</td>
                <td className="p-2 text-gray-300">{formatFloat(rate.input)}</td>
                <td className="p-2 text-gray-300">{formatFloat(rate.output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-morphism p-6 rounded-md flex-grow flex flex-col">
        {error && (
          <div className="mb-4 p-4 bg-red-800/50 rounded-md text-red-200">
            Erreur: {error}
          </div>
        )}

        {/* Barre de contrôles */}
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          {/* Regrouper par */}
          <div>
            <label className="block text-white mb-1 font-medium">Regrouper par :</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            >
              <option value="model">Modèle</option>
              <option value="user">Utilisateur</option>
            </select>
          </div>

          {/* Période */}
          <div>
            <label className="block text-white mb-1 font-medium">Période :</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            >
              <option value="hebdo">Hebdomadaire</option>
              <option value="mensuel">Mensuel</option>
              <option value="annuel">Annuel</option>
              <option value="total">Total</option>
            </select>
          </div>

          {/* Type (Jetons ou Coût) */}
          <div>
            <label className="block text-white mb-1 font-medium">Type :</label>
            <select
              value={typeValeur}
              onChange={(e) => setTypeValeur(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            >
              <option value="jetons">Jetons</option>
              <option value="cout">Coût</option>
            </select>
          </div>

          {/* Filtrer modèles */}
          <div>
            <label className="block text-white mb-1 font-medium">Filtrer modèles :</label>
            {Array.from(new Set(usageData.map(u => u.model_name))).map((m) => (
              <label key={m} className="block text-white">
                <input
                  type="checkbox"
                  value={m}
                  checked={selectedModels.includes(m)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedModels([...selectedModels, m]);
                    } else {
                      setSelectedModels(selectedModels.filter(model => model !== m));
                    }
                  }}
                  className="mr-2"
                />
                {m}
              </label>
            ))}
          </div>

          {/* Filtrer utilisateur */}
          <div>
            <label className="block text-white mb-1 font-medium">Filtrer utilisateur :</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            >
              <option value="">-- Tous --</option>
              {Array.from(new Set(usageData.map(u => u.username))).map((usr) => (
                <option key={usr} value={usr}>{usr}</option>
              ))}
            </select>
          </div>

          {/* Vue (Tableau ou Graphique) */}
          <div>
            <label className="block text-white mb-1 font-medium">Vue :</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`modern-button px-3 py-2 flex items-center gap-2 ${viewMode === 'table' ? 'opacity-100' : 'opacity-70'}`}
              >
                <FaTable />
                Tableau
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`modern-button px-3 py-2 flex items-center gap-2 ${viewMode === 'chart' ? 'opacity-100' : 'opacity-70'}`}
              >
                <FaChartBar />
                Graphique
              </button>
            </div>
          </div>
        </div>

        {/* Affichage principal (Tableau ou Graphique) */}
        {viewMode === 'table' ? (
          <AffichageTable
            grouped={grouped}
            columnKey={columnKey}
            typeValeur={typeValeur}
            groupBy={groupBy}
            calcTotal={calcTotal}
            globalTotal={globalTotal}
            getEnteteColonne={getEnteteColonne}
          />
        ) : (
          <AffichageChart
            chartData={chartData}
            typeValeur={typeValeur}
            groupBy={groupBy}
            barColor={barColor}
            formatTooltip={formatTooltip}
            getEnteteColonne={getEnteteColonne}
          />
        )}

        {/* Section supplémentaire : Statistiques Sessions/Messages par Utilisateur */}
        <SessionMessageStats usageData={usageData} />
      </div>
    </div>
  );
}

/** Composant d'affichage TABLEAU */
function AffichageTable({ grouped, columnKey, typeValeur, groupBy, calcTotal, globalTotal, getEnteteColonne }) {
  const groupKeyLabel = (groupBy === 'model') ? 'Modèle' : 'Utilisateur';

  return (
    <div className="overflow-y-auto flex-grow">
      {Object.keys(grouped).length === 0 ? (
        <div className="p-4 text-center text-gray-300">
          Aucune donnée trouvée.
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([gVal, items]) => {
            const groupSum = calcTotal(items);
            return (
              <div key={gVal} className="mb-6 border border-gray-600 rounded-lg p-4">
                <h3 className="text-xl text-white font-bold mb-2">
                  {groupKeyLabel} : {gVal}
                </h3>
                <table className="min-w-full border border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800/50">
                      <th className="p-2 text-left text-gray-200">Utilisateur</th>
                      <th className="p-2 text-left text-gray-200">Modèle</th>
                      <th className="p-2 text-left text-gray-200">{getEnteteColonne()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((u) => {
                      let valAffiche = 0;
                      if (typeValeur === 'jetons') {
                        valAffiche = parseInt(u[columnKey], 10) || 0;
                      } else {
                        valAffiche = parseFloat(u[columnKey]) || 0;
                        valAffiche = valAffiche.toFixed(6);
                      }
                      return (
                        <tr key={`${u.user_id}|${u.model_name}`} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-2 text-gray-300">{u.username}</td>
                          <td className="p-2 text-gray-300">{u.model_name}</td>
                          <td className="p-2 text-gray-300">{valAffiche}</td>
                        </tr>
                      );
                    })}
                    {/* Ligne Totaux du groupe */}
                    <tr className="border-t border-gray-600 bg-gray-800/50 font-bold text-gray-100">
                      <td className="p-2" colSpan={2}>
                        Total pour {gVal}
                      </td>
                      <td className="p-2">
                        {typeValeur === 'jetons' ? groupSum : groupSum.toFixed(6)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
          {/* Totaux Globaux */}
          <div className="border border-gray-600 rounded-lg p-4">
            <h3 className="text-xl text-white font-bold mb-2">
              Total Global (après filtres)
            </h3>
            <p className="text-white">
              {typeValeur === 'jetons'
                ? `${globalTotal} jetons`
                : `${globalTotal.toFixed(6)} €`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** Composant Chart principal */
function AffichageChart({ chartData, typeValeur, groupBy, barColor, formatTooltip, getEnteteColonne }) {
  const groupLabel = (groupBy === 'model') ? 'Modèle' : 'Utilisateur';

  return (
    <div className="bg-gray-800/40 p-4 rounded-lg flex-grow">
      {chartData.length === 0 ? (
        <div className="p-4 text-center text-gray-300">
          Aucune donnée à afficher pour le graphique.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#666" />
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip
              formatter={(value) => formatTooltip(value)}
              labelFormatter={(label) => `${groupLabel} : ${label}`}
            />
            <Bar dataKey="valeur" fill={barColor} name={getEnteteColonne()}>
              <LabelList dataKey="valeur" position="top" fill="#fff" formatter={formatTooltip} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** Composant pour afficher les Statistiques Sessions/Messages par Utilisateur */
function SessionMessageStats({ usageData }) {
  // Agrégation par utilisateur (on prend la première occurrence pour chaque user_id)
  const userStats = {};
  usageData.forEach(u => {
    const uid = u.user_id;
    if (!userStats[uid]) {
      userStats[uid] = {
        username: u.username,
        totalSessions: u.totalSessions || 0,
        weeklySessions: u.weeklySessions || 0,
        monthlySessions: u.monthlySessions || 0,
        yearlySessions: u.yearlySessions || 0,
        totalMessages: u.totalMessages || 0,
        weeklyMessages: u.weeklyMessages || 0,
        monthlyMessages: u.monthlyMessages || 0,
        yearlyMessages: u.yearlyMessages || 0,
      };
    }
  });

  const statsArray = Object.values(userStats);

  return (
    <div className="mt-8 border border-gray-600 rounded-lg p-4">
      <h3 className="text-xl text-white font-bold mb-2">
        Statistiques Sessions/Messages par Utilisateur
      </h3>
      <table className="min-w-full border border-gray-700 text-sm">
        <thead>
          <tr className="bg-gray-700 text-gray-200">
            <th className="p-2 text-left">Utilisateur</th>
            <th className="p-2 text-left">Total Sessions</th>
            <th className="p-2 text-left">Semaine (Sessions)</th>
            <th className="p-2 text-left">Mois (Sessions)</th>
            <th className="p-2 text-left">Année (Sessions)</th>
            <th className="p-2 text-left">Total Messages</th>
            <th className="p-2 text-left">Semaine (Messages)</th>
            <th className="p-2 text-left">Mois (Messages)</th>
            <th className="p-2 text-left">Année (Messages)</th>
          </tr>
        </thead>
        <tbody>
          {statsArray.map(stat => (
            <tr key={stat.username} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="p-2 text-gray-300">{stat.username}</td>
              <td className="p-2 text-gray-300">{stat.totalSessions}</td>
              <td className="p-2 text-gray-300">{stat.weeklySessions}</td>
              <td className="p-2 text-gray-300">{stat.monthlySessions}</td>
              <td className="p-2 text-gray-300">{stat.yearlySessions}</td>
              <td className="p-2 text-gray-300">{stat.totalMessages}</td>
              <td className="p-2 text-gray-300">{stat.weeklyMessages}</td>
              <td className="p-2 text-gray-300">{stat.monthlyMessages}</td>
              <td className="p-2 text-gray-300">{stat.yearlyMessages}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
