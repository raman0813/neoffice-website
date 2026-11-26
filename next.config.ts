import type { NextConfig } from "next";

// Old WordPress addresses that pointed at the same pages twice. Each one now sends
// visitors (and Google) to the single address the site uses.
const redirects: [string, string][] = [
  ["/products/desk-booking-software/", "/workspace/desk-booking-software/"],
  ["/products/meeting-room-booking-software/", "/workspace/meeting-room-booking-software/"],
  ["/products/visitor-management-system/", "/workspace/visitor-management-system/"],
  ["/products/:path*", "/workspace/:path*"],
  ["/resources/about-us/", "/about-us/"],
  ["/resources/contact-us/", "/contact-us/"],
  ["/resources/privacy-policy/", "/privacy-policy/"],
  ["/resources/terms-conditions/", "/terms-conditions/"],
  ["/resources/gdpr/", "/gdpr/"],
  ["/workspace/", "/"],
  ["/solutions/", "/"],
  ["/category/:path*", "/blogs/"],
  ["/tag/:path*", "/blogs/"],
  ["/author/:path*", "/blogs/"],
  ["/feed/", "/blogs/"],
];

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    return redirects.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};
export default nextConfig;
