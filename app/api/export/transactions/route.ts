import { getAllTransactions } from "@/lib/redis";

export async function GET() {
  const transactions = await getAllTransactions();
  const header = [
    "id",
    "description",
    "amount",
    "type",
    "category",
    "date",
    "notes",
  ];
  const rows = transactions.map((t) =>
    [
      t.id,
      t.description.replace(/"/g, '""'),
      t.amount,
      t.type,
      t.category,
      t.date,
      t.notes ? t.notes.replace(/"/g, '""') : "",
    ].map((field) => `"${field}"`).join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=transactions.csv",
    },
  });
}
