import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { db } from "../db/index";
import { bundles, bundleProducts, activityLogs, packBuilderRequests } from "../db/schema";
import { desc } from "drizzle-orm";
import "../tailwind.css";

/* ==================================================
   HELPERS
================================================== */
function getScoreCategory(score) {
  if (score >= 90) return { label: "Elite Bundle", color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" };
  if (score >= 80) return { label: "High Potential", color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-500" };
  if (score >= 60) return { label: "Moderate", color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-500" };
  return { label: "Needs Attention", color: "text-red-600", bg: "bg-red-50", bar: "bg-red-500" };
}

function calculateBundleAnalytics(bundle, bundleProductsList) {
  const products = bundleProductsList.filter((product) => product.bundleId === bundle.id);
  const productCount = products.length;

  const bundleValue = products.reduce((sum, product) => sum + Number(product.productPrice || 0), 0);
  const categoryCoverage = new Set(products.map((product) => product.productType)).size;
  const averageProductPrice = productCount > 0 ? bundleValue / productCount : 0;

  const potentialAovIncrease = averageProductPrice > 0
    ? Math.round(((bundleValue / averageProductPrice) - 1) * 100)
    : 0;

  // NEW: Bundle Health Calculation
  const healthScore = Math.min(100, (productCount * 15) + (categoryCoverage * 20) + Math.floor(bundleValue / 500));

  let healthLabel = "Needs Work";
  let healthColor = "text-red-500";
  if (healthScore >= 90) { healthLabel = "Excellent"; healthColor = "text-emerald-500"; }
  else if (healthScore >= 70) { healthLabel = "Good"; healthColor = "text-blue-500"; }
  else if (healthScore >= 50) { healthLabel = "Fair"; healthColor = "text-amber-500"; }

  return {
    productCount,
    bundleValue,
    categoryCoverage,
    averageProductPrice,
    potentialAovIncrease,
    healthScore,
    healthLabel,
    healthColor
  };
}

/* ==================================================
   LOADER
================================================== */
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const allBundles = await db.select().from(bundles);
  const allBundleProducts = await db.select().from(bundleProducts);
  const recentLogs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(4);
  const packRequests = await db
    .select()
    .from(packBuilderRequests);

  const totalBundles = allBundles.length;
  const activeBundles = allBundles.filter((bundle) => bundle.status === "active").length;
  const averageScore = totalBundles > 0
    ? Math.round(allBundles.reduce((sum, bundle) => sum + (bundle.score || 0), 0) / totalBundles)
    : 0;

  // UPDATED: We now map the analytics to EVERY top bundle so we can use it in the rankings list
  const topBundles = [...allBundles]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map(bundle => ({
      ...bundle,
      analytics: calculateBundleAnalytics(bundle, allBundleProducts)
    }));

    const packConfigStats = {};

    packRequests.forEach((request) => {

      const key =
        `${request.destination}-${request.travelStyle}-${request.tripLength}`;

      if (!packConfigStats[key]) {
        packConfigStats[key] = {
          destination: request.destination,
          travelStyle: request.travelStyle,
          tripLength: request.tripLength,
          count: 0,
        };
      }

      packConfigStats[key].count++;
    });

    const topPackConfigs =
      Object.values(packConfigStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

  const latestPackRequests =  await db
    .select()
    .from(packBuilderRequests)
    .orderBy(
      desc(packBuilderRequests.createdAt)
    )
    .limit(5);

  const topBundle = topBundles.length > 0 ? topBundles[0] : null;
  const topBundleAnalytics = topBundle ? topBundle.analytics : null;

  return {
    totalBundles,
    activeBundles,
    averageScore,
    topBundles,
    topBundle,
    topBundleAnalytics,
    recentLogs,
    latestPackRequests,
    topPackConfigs,
  };
};

/* ==================================================
   COMPONENT
================================================== */
export default function Index() {
  const {
    totalBundles,
    activeBundles,
    averageScore,
    topBundles,
    topBundle,
    topBundleAnalytics,
    recentLogs,
    latestPackRequests,
    topPackConfigs,
  } = useLoaderData();

  return (
    <div className="min-h-screen p-6 pb-32 font-sans text-gray-900 bg-[#f4f6f8]">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HERO HEADER */}
        <header className="mb-8 text-center lg:text-left">
          <h1 className="mb-2 text-3xl font-black tracking-tight text-gray-900">BundleIQ Intelligence Center</h1>
          <p className="text-gray-500 text-md">Merchant Insights & Growth Opportunities</p>
        </header>

        {/* HERO ANALYTICS CARD */}
        {topBundle ? (
          <div className="relative overflow-hidden bg-white border border-gray-200 shadow-sm rounded-3xl group">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-black to-gray-500"></div>
            <div className="p-8 md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold tracking-wider text-indigo-600 uppercase">Top Performer</span>
                  </div>
                  <h2 className="mb-2 text-3xl font-black text-gray-900">{topBundle.name}</h2>
                  <p className="max-w-xl text-gray-500">
                    This bundle is heavily optimized and has the highest likelihood of conversion.
                    <strong className="text-gray-800"> Recommendation:</strong> Feature this prominently on your homepage.
                  </p>

                  {/* PREMIUM METRICS GRID (Now 5 Columns to include Health) */}
                  <div className="grid grid-cols-2 gap-6 pt-6 mt-6 border-t border-gray-100 sm:grid-cols-5">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">Health</p>
                      <p className="mt-1 text-xl font-black text-gray-900">
                        {topBundleAnalytics?.healthScore} <span className="text-sm font-bold text-gray-400">/100</span>
                      </p>
                      <p className={`text-[10px] font-bold uppercase mt-0.5 ${topBundleAnalytics?.healthColor}`}>
                        {topBundleAnalytics?.healthLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">Products</p>
                      <p className="mt-1 text-xl font-black text-gray-900">{topBundleAnalytics?.productCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">Categories</p>
                      <p className="mt-1 text-xl font-black text-gray-900">{topBundleAnalytics?.categoryCoverage || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">Bundle Value</p>
                      <p className="mt-1 text-xl font-black text-gray-900">₱{topBundleAnalytics?.bundleValue?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">Avg Product</p>
                      <p className="mt-1 text-xl font-black text-gray-900">₱{Math.round(topBundleAnalytics?.averageProductPrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-8 text-right md:justify-end shrink-0">
                  <div>
                    <span className="block text-4xl font-black text-gray-900">{topBundle.score}</span>
                    <span className="block mt-1 text-xs font-bold tracking-wider text-gray-400 uppercase">Opportunity Score</span>
                  </div>
                  <div>
                    <span className="block text-4xl font-black text-emerald-500">+{topBundleAnalytics?.potentialAovIncrease || 0}%</span>
                    <span className="block mt-1 text-xs font-bold tracking-wider text-gray-400 uppercase">Potential AOV</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white border border-gray-300 border-dashed rounded-3xl">
            <h2 className="text-xl font-bold text-gray-900">Welcome to BundleIQ!</h2>
            <p className="mt-2 text-gray-500">Create your first bundle to unlock merchant insights.</p>
          </div>
        )}

        {/* KPI METRIC CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">Total Bundles</h3>
            </div>
            <p className="text-3xl font-black text-gray-900">{totalBundles}</p>
            <p className="mt-1 text-xs font-medium text-gray-400">Created in store</p>
          </div>

          <div className="p-6 transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">Active Strategies</h3>
            </div>
            <p className="text-3xl font-black text-gray-900">{activeBundles}</p>
            <p className="mt-1 text-xs font-medium text-gray-400">Currently live</p>
          </div>

          <div className="p-6 transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">Avg Score</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-gray-900">{averageScore}</p>
              <span className="text-sm font-bold text-gray-400">pts</span>
            </div>
            <p className="mt-1 text-xs font-medium text-gray-400">Across all bundles</p>
          </div>

          <div className="p-6 transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">Max AOV Boost</h3>
            </div>
            <p className="text-3xl font-black text-gray-900">+{topBundleAnalytics?.potentialAovIncrease || 0}%</p>
            <p className="mt-1 text-xs font-medium text-gray-400">Highest opportunity</p>
          </div>
        </section>

        {/* RECENT SMART PACK ACTIVITY */}
        <section className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Recent Smart Pack Activity
            </h2>

            <span className="text-xs font-medium text-gray-400">
              Latest Pack Builder Requests
            </span>
          </div>

          {latestPackRequests.length > 0 ? (

            <div className="overflow-hidden border border-gray-100 rounded-2xl">

              {/* Table Header */}
              <div className="grid grid-cols-5 px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase border-b border-gray-100 bg-gray-50">

                <div>User</div>

                <div>Destination</div>

                <div>Style</div>

                <div>Duration</div>

                <div>Type</div>

              </div>

              {/* Table Rows */}
              {latestPackRequests.map((request) => (

                <div
                  key={request.id}
                  className="grid grid-cols-5 px-4 py-4 text-sm transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >

                  <div className="font-semibold text-gray-900 truncate">
                    {request.customerName || "Guest"}
                  </div>

                  <div className="text-gray-600">
                    {request.destination}
                  </div>

                  <div className="text-gray-600">
                    {request.travelStyle}
                  </div>

                  <div className="text-gray-600">
                    {request.tripLength}
                  </div>

                  <div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                      {request.customerType}
                    </span>
                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="py-12 text-center border border-gray-200 border-dashed rounded-2xl">
              <p className="text-gray-500">
                No Smart Pack activity yet.
              </p>
            </div>

          )}

        </section>
        {/* MAIN SPLIT VIEW */}
        <div className="grid items-start grid-cols-1 gap-8 lg:grid-cols-3">

          {/* LEFT: BUNDLE RANKINGS */}
          <section className="col-span-2 p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
            <h2 className="mb-6 text-lg font-bold text-gray-900">Bundle Rankings</h2>

            <div className="flex flex-col gap-4">
              {topBundles.map((bundle, index) => {
                const category = getScoreCategory(bundle.score || 0);
                const progressWidth = Math.min(bundle.score || 0, 100);
                const a = bundle.analytics; // Shortcut for the mapped analytics

                return (
                  <div key={bundle.id} className="p-6 transition-colors border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center font-bold text-gray-500 bg-gray-200 rounded-full w-9 h-9 shrink-0 mt-0.5">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="m-0 text-lg font-bold text-gray-900">{bundle.name}</h3>

                          {/* NEW: Inline Analytics Row */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm font-medium text-gray-500">
                            <span className="text-gray-900">₱{a.bundleValue.toLocaleString()} Value</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{a.categoryCoverage} Categories</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{a.productCount} Products</span>
                          </div>

                          {/* NEW: Contextual Alerts */}
                          <div className="flex flex-col gap-2 mt-4">
                            {a.categoryCoverage === 1 && a.productCount > 1 && (
                              <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium border bg-amber-50 border-amber-100 text-amber-800 rounded-xl w-fit">
                                <span className="text-sm">⚠</span> Low Category Coverage: Contains products from only one category.
                              </div>
                            )}
                            {a.bundleValue > 0 && a.bundleValue < 2000 && (
                              <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-800 border border-red-100 bg-red-50 rounded-xl w-fit">
                                <span className="text-sm">⚠</span> Low Bundle Value: Combined value is below ₱2,000.
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-2xl font-black leading-none text-gray-900">{bundle.score}</span>
                        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${category.bg} ${category.color}`}>
                          {category.label}
                        </span>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="w-full h-2 mt-5 overflow-hidden bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${category.bar}`}
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {topBundles.length === 0 && (
                <div className="py-12 text-center border border-gray-200 border-dashed rounded-2xl">
                  <p className="text-gray-500">No rankings available yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT STACK: RECOMMENDATIONS & ACTIVITY */}
          <div className="flex flex-col col-span-1 gap-8">

            {/* ACTIONABLE RECOMMENDATIONS */}
            <section className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Opportunity Insights</h2>
              <div className="space-y-4">

                {topBundles.map((bundle) => {
                  if (bundle.score >= 85) {
                    return (
                      <div key={`rec-${bundle.id}`} className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold tracking-wide text-indigo-700 uppercase">Promote Action</span>
                        </div>
                        <h4 className="font-bold text-gray-900">{bundle.name}</h4>
                        <p className="mt-1 text-sm text-gray-600">High opportunity score detected. Feature on homepage.</p>
                      </div>
                    );
                  }
                  if (bundle.score >= 60 && bundle.score < 85) {
                    return (
                      <div key={`rec-${bundle.id}`} className="p-4 border border-amber-100 bg-amber-50/50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold tracking-wide uppercase text-amber-700">Improvement Opportunity</span>
                        </div>
                        <h4 className="font-bold text-gray-900">{bundle.name}</h4>
                        <p className="mt-1 text-sm text-gray-600">Good start, but adding complementary products could boost score.</p>
                      </div>
                    );
                  }
                  if (bundle.score < 60) {
                    return (
                      <div key={`rec-${bundle.id}`} className="p-4 border border-red-100 bg-red-50/50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold tracking-wide text-red-700 uppercase">Bundle Watch</span>
                        </div>
                        <h4 className="font-bold text-gray-900">{bundle.name}</h4>
                        <p className="mt-1 text-sm text-gray-600">Low perceived value. Consider adjusting price or products.</p>
                      </div>
                    );
                  }
                  return null;
                }).slice(0, 3)}

                {topBundles.length === 0 && (
                  <p className="text-sm italic text-gray-400">Waiting for data to generate insights...</p>
                )}
              </div>
            </section>

            {/* RECENT ACTIVITY */}
            <section className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Recent Activity</h2>
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 group">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-300 group-hover:bg-indigo-500 transition-colors shrink-0"></div>
                    <div className="flex-1 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-gray-800">{log.details}</p>
                      {log.createdAt && (
                        <p className="mt-1 text-[11px] font-bold tracking-wide uppercase text-gray-400">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <p className="text-sm text-gray-500">No recent activity.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
