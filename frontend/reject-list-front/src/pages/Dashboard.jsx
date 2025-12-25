import Sidebar from "../components/Sidebar.jsx";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="flex-1 min-w-0 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-4">Dashboard</h1>
        <p className="text-slate-600">
          Welcome!
        </p>
      </main>
    </div>
  );
}
