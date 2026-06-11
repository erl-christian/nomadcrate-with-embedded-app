import { useLoaderData, useActionData, Form, useNavigation } from "react-router";
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
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
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

export async function action({ request }) {
  const formData = await request.formData();
  const bundleId = formData.get("bundleId");
  const bundleName = formData.get("bundleName");
  const bundleType = formData.get("bundleType");
  const score = Number(formData.get("score"));
  const selectedProducts = JSON.parse(formData.get("selectedProducts"));

  if (bundleId) {
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
        productPrice: 0,
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

    // Bulletproof defensive insert approach
    const rawResult = await db.insert(bundles).values({
      name: bundleName,
      bundleType,
      score,
      status: "active",
    });

    // Extract ID safely regardless of the underlying database driver
    const newBundleId = Array.isArray(rawResult)
      ? rawResult[0].insertId
      : rawResult.insertId;

    for (const product of selectedProducts) {
      await db.insert(bundleProducts).values({
        bundleId: newBundleId,
        productHandle: product.handle,
        productTitle: product.title,
        productPrice: 0,
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

export default function Bundles() {
  const { products, existingBundles } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  // Form State
  const [bundleName, setBundleName] = useState("");
  const [bundleType, setBundleType] = useState("Mountain");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingBundleId, setEditingBundleId] = useState(null);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // UI State
  const [toast, setToast] = useState({ show: false, message: "" });

  const isSubmitting = navigation.state === "submitting";
  const currentScore = (selectedProducts.length * 10) + (new Set(selectedProducts.map((p) => p.handle)).size * 5);
  const isFormValid = bundleName.trim() !== "";

  /* Auto-Reset & Toast Effect */
  useEffect(() => {
    if (actionData?.success && !isSubmitting) {
      setToast({
        show: true,
        message: actionData.actionType === "update"
          ? "Bundle updated successfully!"
          : "Bundle created successfully!"
      });

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

    // Reset search and pagination to ensure they see their selected items clearly
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

  /* --- SEARCH & PAGINATION LOGIC --- */
  const filteredProducts = products.filter(({ node }) =>
    node.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6 pb-32 text-gray-900 relative">

      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out translate-y-0 opacity-100">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-medium border border-gray-700">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Bundle Management</h1>
          <p className="text-gray-500">Create new combinations or update your existing offerings.</p>
        </header>

        <Form method="post">
          <input type="hidden" name="bundleId" value={editingBundleId || ""} />
          <input type="hidden" name="score" value={currentScore} />
          <input type="hidden" name="selectedProducts" value={JSON.stringify(selectedProducts)} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* LEFT COLUMN: Form */}
            <div className="space-y-6">

              {/* DETAILS SECTION */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                {editingBundleId && <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>}

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold m-0">
                    {editingBundleId ? "Edit Bundle Details" : "Create New Bundle"}
                  </h2>
                  {editingBundleId && (
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      Editing Mode
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 mb-6">
                  <label htmlFor="bundleNameInput" className="font-medium text-sm text-gray-500">Bundle Name</label>
                  <input
                    id="bundleNameInput"
                    type="text"
                    name="bundleName"
                    placeholder="e.g. Summer Essentials"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bundleTypeSelect" className="font-medium text-sm text-gray-500">Category</label>
                  <select
                    id="bundleTypeSelect"
                    name="bundleType"
                    value={bundleType}
                    onChange={(e) => setBundleType(e.target.value)}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  >
                    <option>Mountain</option>
                    <option>Beach</option>
                    <option>City</option>
                  </select>
                </div>
              </section>

              {/* PRODUCTS SECTION */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-[520px]">

                <div className="flex justify-between items-baseline mb-4 shrink-0">
                  <h2 className="text-lg font-semibold m-0">Select Products</h2>
                  <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-700">
                    {selectedProducts.length} selected
                  </span>
                </div>

                {/* Search Bar */}
                <div className="mb-4 shrink-0 relative">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                {/* Product List */}
                <div className="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map(({ node }) => {
                      const isSelected = selectedProducts.some((p) => p.id === node.id);
                      return (
                        <label key={node.id} htmlFor={`product-${node.id}`} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border shrink-0 ${isSelected ? "border-black bg-gray-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                          <input id={`product-${node.id}`} type="checkbox" checked={isSelected} onChange={() => toggleProduct(node)} className="w-5 h-5 accent-black cursor-pointer rounded" />
                          <span className={`${isSelected ? "font-semibold" : "font-normal"} text-gray-900 line-clamp-1`}>{node.title}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                      No products found.
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center shrink-0">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>

              </section>
            </div>

            {/* RIGHT COLUMN: Bundles List */}
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-6">
                <h2 className="text-lg font-semibold mb-6">Existing Bundles</h2>
                <div className="flex flex-col gap-3">
                  {existingBundles.map((bundle) => (
                    <div key={bundle.id} className={`flex flex-col p-4 rounded-xl border transition-all ${editingBundleId === bundle.id ? "border-black ring-1 ring-black bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 m-0 text-lg">{bundle.name}</h3>
                          <p className="text-xs text-gray-500 m-0 uppercase tracking-wide mt-1">{bundle.bundleType}</p>
                        </div>
                        <button type="button" onClick={() => editBundle(bundle)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${editingBundleId === bundle.id ? "bg-black text-white" : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"}`}>
                          {editingBundleId === bundle.id ? "Editing..." : "Edit"}
                        </button>
                      </div>
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                        {bundle.products && bundle.products.length > 0 ? (
                          bundle.products.map(p => (
                            <span key={p.productHandle} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600">{p.productTitle}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No products</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {existingBundles.length === 0 && <p className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-200 rounded-xl">No bundles created yet.</p>}
                </div>
              </section>
            </div>

          </div>

          {/* Floating Action Dock */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 pl-6 pr-2 py-2 bg-white rounded-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.05)] border border-gray-100">
            <div className="font-bold text-xl text-gray-900 flex items-baseline gap-1">
              {currentScore}
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pts</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex gap-2">
              {editingBundleId && (
                <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-full font-semibold text-sm transition-all bg-gray-100 text-gray-700 hover:bg-gray-200">
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
