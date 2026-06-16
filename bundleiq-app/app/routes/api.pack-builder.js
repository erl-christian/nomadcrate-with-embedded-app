import { db } from "../db/index";
import { packBuilderRequests } from "../db/schema";

export async function loader() {
  return new Response("API WORKING");
}

export async function action({ request }) {
  const body = await request.json();

  await db.insert(packBuilderRequests).values({
    customerName: body.customerName,
    customerType: body.customerType,
    destination: body.destination,
    travelStyle: body.travelStyle,
    tripLength: body.tripLength,
    recommendedPack: body.recommendedPack,
    productCount: body.productCount,
    bundleValue: body.bundleValue,
  });

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
