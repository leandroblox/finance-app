import { getAllBudgets } from "@/lib/redis";

export async function GET() {
  const budgets = await getAllBudgets();
  const header = ["id", "category", "limit", "spent", "period"];
  const rows = budgets.map((b) =>
    [b.id, b.category.replace(/"/g, '""'), b.limit, b.spent, b.period]
      .map((field) => `"${field}"`)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=budgets.csv",
    },
  });
}
