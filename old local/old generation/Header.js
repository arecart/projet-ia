export default function Header({ role, onLogout, onDashboard }) {
  return (
    <div className="absolute top-4 right-4 z-20 flex gap-4">
      {role === 'admin' && (
        <button onClick={onDashboard} className="modern-button text-white py-2 px-4 rounded">
          Dashboard
        </button>
      )}
      <button onClick={onLogout} className="modern-button text-white py-2 px-4 rounded">
        Déconnexion
      </button>
    </div>
  );
}
