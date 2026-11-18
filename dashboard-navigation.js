(function (root) {
  const dashboardLinks = Object.freeze({
    student: Object.freeze({ label: "Student Dashboard" }),
    business: Object.freeze({ label: "Business Dashboard" }),
    admin: Object.freeze({ label: "Admin Dashboard" })
  });

  function dashboardNavigationForRole(role) {
    return typeof role === "string" ? dashboardLinks[role.toLowerCase()] || null : null;
  }

  if (typeof module === "object" && module.exports) {
    module.exports = dashboardNavigationForRole;
  } else {
    root.dashboardNavigationForRole = dashboardNavigationForRole;
  }
})(typeof window === "undefined" ? globalThis : window);
