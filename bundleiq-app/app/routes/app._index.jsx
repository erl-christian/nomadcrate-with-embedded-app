import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { db } from "../db/index";
import { bundles, activityLogs } from "../db/schema";
import { desc } from "drizzle-orm";
import "../tailwind.css";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const allBundles = await db.select().from(bundles);
  const recentLogs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(5);

  const totalBundles = allBundles.length;
  const activeBundles = allBundles.filter((bundle) => bundle.status === "active").length;
  const averageScore = totalBundles > 0
    ? Math.round(allBundles.reduce((sum, bundle) => sum + (bundle.score || 0), 0) / totalBundles)
    : 0;

  const topBundles = [...allBundles].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);

  return {
    totalBundles,
    activeBundles,
    averageScore,
    topBundles,
    recentLogs,
  };
};

export default function Index() {
  const { totalBundles, activeBundles, averageScore, topBundles, recentLogs } = useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6 pb-32 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Dashboard Header */}
        <header className="mb-10 text-center lg:text-left">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-gray-500">Overview of your BundleIQ performance and activity.</p>
        </header>

        {/* Overview Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Total Bundles</h3>
            <p className="text-4xl font-black text-gray-900">{totalBundles}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Active Bundles</h3>
            <p className="text-4xl font-black text-gray-900">{activeBundles}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
            {/* Subtle accent border on the right to match the minimalist theme */}
            <div className="absolute right-0 top-0 w-1 h-full bg-black"></div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Average Score</h3>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-black text-gray-900">{averageScore}</p>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pts</span>
            </div>
          </div>
        </section>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Top Bundles */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Top Bundle Opportunities</h2>

            <div className="flex flex-col gap-3">
              {topBundles.map((bundle, index) => (
                <div key={bundle.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${index === 0 ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}>
                      {index + 1}
                    </div>
                    <h3 className="font-semibold text-gray-900 m-0">{bundle.name}</h3>
                  </div>

                  <div className="text-right">
                    <span className="block text-xl font-bold text-gray-900 leading-none">{bundle.score}</span>
                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Score</span>
                  </div>
                </div>
              ))}

              {topBundles.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-200 rounded-xl">
                  No bundles created yet.
                </p>
              )}
            </div>
          </section>

          {/* Recent Activity Timeline */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Recent Activity</h2>

            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start group">
                  {/* Timeline dot */}
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-black shrink-0 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity"></div>

                  {/* Log Content */}
                  <div className="flex-1 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{log.details}</p>
                    {log.createdAt && (
                      <p className="text-xs text-gray-400 mt-1 font-medium">
                        {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {recentLogs.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-200 rounded-xl">
                  No recent activity found.
                </p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
