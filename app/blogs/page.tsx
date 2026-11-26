import BlogIndex from "./BlogIndex";
export const metadata = { title: "Blogs | NeOffice", description: "Articles on hybrid work, desk booking, meeting rooms, visitor management and employee transport.", alternates: { canonical: "/blogs/" } };
export default function Blogs() { return <BlogIndex page={1} />; }
