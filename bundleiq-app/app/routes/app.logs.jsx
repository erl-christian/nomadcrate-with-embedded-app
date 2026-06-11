import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { db } from "../db/index";
import { activityLogs } from "../db/schema";
import { desc } from "drizzle-orm";
import "../tailwind.css";

/* ==================================================
   LOADER
================================================== */
export async function loader({ request }) {
  await authenticate.admin(request);

  // Fetch the latest 100 activity logs, newest first
  const logs = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(100);

  // Return the data, ensuring it's an array even if the db returns nothing
  return { logs: logs || [] };
}

/* ==================================================
   COMPONENT
================================================== */
export default function Logs() {
  // FIX: Defensively grab the data with a fallback.
  // If useLoaderData is briefly null, it defaults to an empty array instead of crashing!
  const loaderData = useLoaderData();
  const logs = loaderData?.logs || [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6 pb-32 text-gray-900">

      <div className="max-w-4xl mx-auto space-y-8">

        {/* Page Header */}
        <header className="mb-10 text-center lg:text-left">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Activity Logs</h1>
          <p className="text-gray-500">A complete history of changes made to your bundles.</p>
        </header>

        {/* Logs Timeline Card */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start group">

                {/* Timeline dot */}
                <div className="mt-1.5 w-2 h-2 rounded-full bg-black shrink-0 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity"></div>

                {/* Log Content */}
                <div className="flex-1 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">
                      {log.details}
                    </p>

                    {/* Action Type Badge */}
                    {log.action && (
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-1 rounded-md shrink-0">
                        {log.action}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  {log.createdAt && (
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

              </div>
            ))}

            {/* Empty State Fallback */}
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500 text-sm font-medium">No activity recorded yet.</p>
                <p className="text-gray-400 text-xs mt-1">Create or update a bundle to see logs appear here.</p>
              </div>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
