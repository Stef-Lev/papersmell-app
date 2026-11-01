import { auth } from "@/auth";
import { searchOpenLibrary } from "@/lib/open-library";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) {
    return Response.json({ error: "Enter at least 2 characters to search." }, { status: 400 });
  }

  try {
    const results = await searchOpenLibrary(query);

    return Response.json({ results });
  } catch (error) {
    console.error("Book catalog search failed:", error);
    return Response.json(
      { error: "The book catalog is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
