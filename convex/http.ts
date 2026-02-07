import { httpRouter } from "convex/server";

const http = httpRouter();

// With Clerk handling authentication externally, no HTTP auth routes are needed here.
// Add any custom HTTP endpoints below if required.

export default http;
