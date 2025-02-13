// components/QuotaDisplay.jsx
export default function QuotaDisplay({ quotaInfo }) {
  const { remaining, max, current } = quotaInfo;
  
  return (
    <div className="mb-4 p-4 rounded-xl bg-gray-800/50">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">Quota disponible :</span>
        <span className="text-sm font-medium">
          {remaining} / {max} requêtes
        </span>
      </div>
      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${(current / max) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
