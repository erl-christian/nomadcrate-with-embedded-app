import { useLoaderData, useActionData, Form, useNavigation, useSubmit } from "react-router";
import { useState, useEffect } from "react";
import { eq } from "drizzle-orm";

import { authenticate } from "../shopify.server";
import { db } from "../db/index";
import { bundles, bundleProducts, activityLogs } from "../db/schema";
import "../tailwind.css";

/* ==================================================
   LOADER
================================================== */

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  // Fetching 50 products so we can see pagination in action
  const response = await admin.graphql(`
    query {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            productType

            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

  const data = await response.json();

  const existingBundlesData = await db.select().from(bundles);
  const bundleProductsData = await db.select().from(bundleProducts);

  const existingBundles = existingBundlesData.map(bundle => ({
    ...bundle,
    products: bundleProductsData.filter(bp => bp.bundleId === bundle.id)
  }));

  return {
    products: data.data.products.edges,
    existingBundles,
  };
}

/* ==================================================
   ACTION
================================================== */

/* ==================================================
   ACTION
================================================== */
export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent"); // We'll use this to catch the delete action
  const bundleId = formData.get("bundleId");

  // --- DELETE LOGIC ---
  if (intent === "delete") {
    // Clean up relational data first to avoid foreign key constraints
    await db.delete(bundleProducts).where(eq(bundleProducts.bundleId, Number(bundleId)));
    await db.delete(activityLogs).where(eq(activityLogs.bundleId, Number(bundleId)));
    await db.delete(bundles).where(eq(bundles.id, Number(bundleId)));

    return { success: true, actionType: "delete" };
  }

  // --- CREATE / UPDATE LOGIC ---
  const bundleName = formData.get("bundleName");
  const bundleType = formData.get("bundleType");
  const score = Number(formData.get("score"));
  const selectedProducts = JSON.parse(formData.get("selectedProducts") || "[]");

  if (bundleId && intent !== "delete") {
    // UPDATE EXISTING BUNDLE
    await db
      .update(bundles)
      .set({ name: bundleName, bundleType, score })
      .where(eq(bundles.id, Number(bundleId)));

    await db.delete(bundleProducts).where(eq(bundleProducts.bundleId, Number(bundleId)));

    for (const product of selectedProducts) {
      await db.insert(bundleProducts).values({
        bundleId: Number(bundleId),
        productHandle: product.handle,
        productTitle: product.title,
        productPrice: Number(product.variants?.edges?.[0]?.node?.price || 0),
        productType: product.productType || "General",
      });
    }

    await db.insert(activityLogs).values({
      bundleId: Number(bundleId),
      action: "UPDATE",
      details: `${bundleName} updated`,
    });

    return { success: true, actionType: "update" };

  } else {
    // CREATE NEW BUNDLE
    const rawResult = await db.insert(bundles).values({
      name: bundleName,
      bundleType,
      score,
      status: "active",
    });

    const newBundleId = Array.isArray(rawResult)
      ? rawResult[0].insertId
      : rawResult.insertId;

    for (const product of selectedProducts) {
      await db.insert(bundleProducts).values({
        bundleId: newBundleId,
        productHandle: product.handle,
        productTitle: product.title,
        productPrice: Number(product.variants?.edges?.[0]?.node?.price || 0),
        productType: product.productType || "General",
      });
    }

    await db.insert(activityLogs).values({
      bundleId: newBundleId,
      action: "CREATE",
      details: `${bundleName} created`,
    });

    return { success: true, actionType: "create" };
  }
}

/* ==================================================
   COMPONENT
================================================== */

/* ==================================================
   COMPONENT
================================================== */

/* ==================================================
   COMPONENT
================================================== */

export default function Bundles() {
  const { products, existingBundles } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  // Form State
  const [bundleName, setBundleName] = useState("");
  const [bundleType, setBundleType] = useState("Mountain");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingBundleId, setEditingBundleId] = useState(null);

  // <-- NEW: Modal State -->
  const [bundleToDelete, setBundleToDelete] = useState(null);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // UI State
  const [toast, setToast] = useState({ show: false, message: "" });

  const isSubmitting = navigation.state === "submitting";
  const currentScore = (selectedProducts.length * 10) + (new Set(selectedProducts.map((p) => p.handle)).size * 5);
  const isFormValid = bundleName.trim() !== "";

  /* Auto-Reset & Toast Effect */
  useEffect(() => {
    if (actionData?.success && !isSubmitting) {
      let message = "Bundle created successfully!";
      if (actionData.actionType === "update") message = "Bundle updated successfully!";
      if (actionData.actionType === "delete") message = "Bundle deleted successfully! 🗑️";

      setToast({ show: true, message });

      cancelEdit();

      const timer = setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [actionData, isSubmitting]);

  /* Interactions */
  function toggleProduct(product) {
    const exists = selectedProducts.find((p) => p.id === product.id);
    if (exists) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  }

  function editBundle(bundle) {
    setEditingBundleId(bundle.id);
    setBundleName(bundle.name);
    setBundleType(bundle.bundleType);

    const preSelectedProducts = products
      .map(p => p.node)
      .filter(node => bundle.products.some(bp => bp.productHandle === node.handle));

    setSelectedProducts(preSelectedProducts);
    setSearchQuery("");
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingBundleId(null);
    setBundleName("");
    setBundleType("Mountain");
    setSelectedProducts([]);
    setSearchQuery("");
    setCurrentPage(1);
  }

  /* --- NEW: MODAL DELETE LOGIC --- */
  function promptDelete(id) {
    setBundleToDelete(id);
  }

  function confirmDelete() {
    if (!bundleToDelete) return;

    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("bundleId", bundleToDelete);
    submit(formData, { method: "post" });

    // If they delete the bundle they are currently editing, clear the form
    if (editingBundleId === bundleToDelete) {
      cancelEdit();
    }

    // Close the modal
    setBundleToDelete(null);
  }

  function cancelDelete() {
    setBundleToDelete(null);
  }

  /* --- SEARCH & PAGINATION LOGIC --- */
  const filteredProducts = products.filter(({ node }) =>
    node.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="relative min-h-screen p-6 pb-32 font-sans text-gray-900 bg-gray-50">

      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out translate-y-0 opacity-100">
          <div className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-white bg-gray-900 border border-gray-700 rounded-full shadow-2xl">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
            {toast.message}
          </div>
        </div>
      )}

      {/* --- NEW: CUSTOM DELETE MODAL --- */}
      {bundleToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 duration-200 bg-white shadow-2xl rounded-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 className="m-0 text-lg font-bold text-gray-900">Delete Bundle?</h3>
            </div>

            <p className="mb-6 text-sm text-gray-500 pl-14">
              Are you sure you want to delete this bundle? This action cannot be undone and will remove all selected products.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Bundle Management</h1>
          <p className="text-gray-500">Create new combinations or update your existing offerings.</p>
        </header>

        <Form method="post">
          <input type="hidden" name="bundleId" value={editingBundleId || ""} />
          <input type="hidden" name="score" value={currentScore} />
          <input type="hidden" name="selectedProducts" value={JSON.stringify(selectedProducts)} />

          <div className="grid items-start grid-cols-1 gap-8 lg:grid-cols-2">

            {/* LEFT COLUMN: Form */}
            <div className="space-y-6">

              {/* DETAILS SECTION */}
              <section className="relative p-6 overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                {editingBundleId && <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>}

                <div className="flex items-center justify-between mb-6">
                  <h2 className="m-0 text-xl font-bold">
                    {editingBundleId ? "Edit Bundle Details" : "Create New Bundle"}
                  </h2>
                  {editingBundleId && (
                    <span className="px-3 py-1 text-xs font-semibold tracking-wider text-gray-600 uppercase bg-gray-100 rounded-full">
                      Editing Mode
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 mb-6">
                  <label htmlFor="bundleNameInput" className="text-sm font-medium text-gray-500">Bundle Name</label>
                  <input
                    id="bundleNameInput"
                    type="text"
                    name="bundleName"
                    placeholder="e.g. Summer Essentials"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    className="p-3 transition-colors border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bundleTypeSelect" className="text-sm font-medium text-gray-500">Category</label>
                  <select
                    id="bundleTypeSelect"
                    name="bundleType"
                    value={bundleType}
                    onChange={(e) => setBundleType(e.target.value)}
                    className="p-3 transition-colors border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  >
                    <option>Mountain</option>
                    <option>Beach</option>
                    <option>City</option>
                  </select>
                </div>
              </section>

              {/* PRODUCTS SECTION */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-[520px]">

                <div className="flex items-baseline justify-between mb-4 shrink-0">
                  <h2 className="m-0 text-lg font-semibold">Select Products</h2>
                  <span className="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                    {selectedProducts.length} selected
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4 shrink-0">
                  <svg className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-3 pl-10 pr-4 transition-colors border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Product List */}
                <div className="flex flex-col flex-grow gap-2 pr-1 overflow-y-auto">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map(({ node }) => {
                      const isSelected = selectedProducts.some((p) => p.id === node.id);
                      return (
                        <label key={node.id} htmlFor={`product-${node.id}`} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border shrink-0 ${isSelected ? "border-black bg-gray-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                          <input id={`product-${node.id}`} type="checkbox" checked={isSelected} onChange={() => toggleProduct(node)} className="w-5 h-5 rounded cursor-pointer accent-black" />
                          <span className={`${isSelected ? "font-semibold" : "font-normal"} text-gray-900 line-clamp-1`}>{node.title}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm italic text-gray-400">
                      No products found.
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

              </section>
            </div>

            {/* RIGHT COLUMN: Bundles List */}
            <div className="space-y-6">
              <section className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl lg:sticky lg:top-6">
                <h2 className="mb-6 text-lg font-semibold">Existing Bundles</h2>
                <div className="flex flex-col gap-3">
                  {existingBundles.map((bundle) => (
                    <div key={bundle.id} className={`flex flex-col p-4 rounded-xl border transition-all ${editingBundleId === bundle.id ? "border-black ring-1 ring-black bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="m-0 text-lg font-bold text-gray-900">{bundle.name}</h3>
                          <p className="m-0 mt-1 text-xs tracking-wide text-gray-500 uppercase">{bundle.bundleType}</p>
                        </div>

                        <div className="flex gap-2">
                          <button type="button" onClick={() => editBundle(bundle)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${editingBundleId === bundle.id ? "bg-black text-white" : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"}`}>
                            {editingBundleId === bundle.id ? "Editing" : "Edit"}
                          </button>

                          {/* <-- UPDATED BUTTON: Now triggers promptDelete instead of alert --> */}
                          <button
                            type="button"
                            onClick={() => promptDelete(bundle.id)}
                            className="px-3 py-2 text-sm font-semibold text-red-600 transition-colors border border-red-100 rounded-lg bg-red-50 hover:bg-red-100"
                            title="Delete Bundle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>

                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        {bundle.products && bundle.products.length > 0 ? (
                          bundle.products.map(p => (
                            <span key={p.productHandle} className="px-2 py-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-md">{p.productTitle}</span>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">No products</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {existingBundles.length === 0 && <p className="py-8 text-sm text-center text-gray-500 border border-gray-200 border-dashed rounded-xl">No bundles created yet.</p>}
                </div>
              </section>
            </div>

          </div>

          {/* Floating Action Dock */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 pl-6 pr-2 py-2 bg-white rounded-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.05)] border border-gray-100">
            <div className="flex items-baseline gap-1 text-xl font-bold text-gray-900">
              {currentScore}
              <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">Pts</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex gap-2">
              {editingBundleId && (
                <button type="button" onClick={cancelEdit} className="px-6 py-3 text-sm font-semibold text-gray-700 transition-all bg-gray-100 rounded-full hover:bg-gray-200">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={!isFormValid || isSubmitting} className={`px-8 py-3 rounded-full font-semibold text-sm transition-all ${!isFormValid || isSubmitting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 active:scale-95"}`}>
                {isSubmitting ? "Saving..." : (editingBundleId ? "Update Bundle" : "Create Bundle")}
              </button>
            </div>
          </div>

        </Form>
      </div>
    </div>
  );
}
