"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "▦",
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: "↕",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: "◒",
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: "◫",
  },
  {
    name: "Goals",
    href: "/goals",
    icon: "◎",
  },
  {
    name: "Categories",
    href: "/categories",
    icon: "◉",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const { data: session } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  /*
   * Prevent background scrolling on mobile when menu is open
   */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /*
   * Close menu on escape key
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  /*
   * Auto close menu on navigation
   */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /*
   * Load saved theme
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem("finance-theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }

    setThemeLoaded(true);
  }, []);

  /*
   * Toggle theme
   */
  function toggleTheme() {
    const nextDarkMode = !darkMode;

    setDarkMode(nextDarkMode);

    if (nextDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("finance-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("finance-theme", "light");
    }
  }

  async function handleLogout() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  const userName = session?.user?.name || "User";

  const userEmail = session?.user?.email || "";

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* ================================= */}
      {/* MOBILE TOP BAR */}
      {/* ================================= */}

      <div className="finance-mobile-topbar">
        <div style={mobileBrandStyle}>
          <div style={mobileLogoStyle}>₹</div>

          <strong>FinanceTrack</strong>
        </div>

        <div style={mobileActionsStyle}>
          {themeLoaded && (
            <button
              onClick={toggleTheme}
              style={themeButtonStyle}
              aria-label="Toggle theme"
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {darkMode ? "☀" : "☾"}
            </button>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={mobileMenuButtonStyle}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* ================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================= */}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="finance-sidebar-overlay"
        />
      )}

      {/* ================================= */}
      {/* SIDEBAR */}
      {/* ================================= */}

      <aside
        className={`finance-sidebar ${
          mobileOpen ? "finance-sidebar-open" : ""
        }`}
      >
        {/* ================================= */}
        {/* LOGO */}
        {/* ================================= */}

        <div style={logoContainerStyle}>
          <div style={logoStyle}>₹</div>

          <div>
            <h2 style={logoTitleStyle}>
              FinanceTrack
            </h2>

            <p style={logoSubtitleStyle}>
              Personal Finance
            </p>
          </div>
        </div>

        {/* ================================= */}
        {/* NAVIGATION */}
        {/* ================================= */}

        <nav style={navStyle}>
          <p style={sectionTitleStyle}>MENU</p>

          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  ...navItemStyle,
                  ...(active ? activeNavItemStyle : {}),
                }}
              >
                <span
                  style={{
                    ...iconStyle,
                    ...(active ? activeIconStyle : {}),
                  }}
                >
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* ================================= */}
        {/* BOTTOM SECTION */}
        {/* ================================= */}

        <div style={sidebarBottomStyle}>
          {/* SMART FINANCE TIP */}

          <div style={tipStyle}>
            <div
              style={{
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              💡
            </div>

            <strong
              style={{
                display: "block",
                marginBottom: 5,
              }}
            >
              Smart Finance
            </strong>

            <span
              style={{
                fontSize: 12,
                color: "#94a3b8",
                lineHeight: 1.5,
              }}
            >
              Track your spending and build
              better financial habits.
            </span>
          </div>

          {/* THEME TOGGLE */}

          <button
            onClick={toggleTheme}
            style={desktopThemeButtonStyle}
          >
            <span style={themeIconStyle}>
              {darkMode ? "☀" : "☾"}
            </span>

            <span>
              {darkMode
                ? "Light Mode"
                : "Dark Mode"}
            </span>

            <span style={themeArrowStyle}>
              {darkMode ? "☀" : "☾"}
            </span>
          </button>

          {/* USER */}

          <div style={userSectionStyle}>
            <div style={userRowStyle}>
              <div style={avatarStyle}>
                {userInitial}
              </div>

              <div style={userInfoStyle}>
                <strong style={userNameStyle}>
                  {userName}
                </strong>

                <span style={userEmailStyle}>
                  {userEmail}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={logoutButtonStyle}
            >
              <span>↪</span>
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ================================= */
/* LOGO */
/* ================================= */

const logoContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "4px 10px 28px",
  borderBottom:
    "1px solid rgba(255,255,255,.08)",
};

const logoStyle = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: "white",
  color: "#172033",
  display: "grid",
  placeItems: "center",
  fontSize: 20,
  fontWeight: 800,
};

const logoTitleStyle = {
  margin: 0,
  fontSize: 18,
};

const logoSubtitleStyle = {
  margin: "3px 0 0",
  color: "#94a3b8",
  fontSize: 11,
};

/* ================================= */
/* NAVIGATION */
/* ================================= */

const navStyle = {
  marginTop: 28,
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
};

const sectionTitleStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#64748b",
  margin: "0 10px 10px",
};

const navItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 13px",
  borderRadius: 9,
  color: "#cbd5e1",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500,
  transition: "all .2s ease",
};

const activeNavItemStyle = {
  background: "#ffffff",
  color: "#172033",
  fontWeight: 700,
};

const iconStyle = {
  width: 24,
  height: 24,
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  fontSize: 15,
};

const activeIconStyle = {
  background: "#e2e8f0",
};

/* ================================= */
/* BOTTOM */
/* ================================= */

const sidebarBottomStyle = {
  marginTop: "auto",
};

const tipStyle = {
  background: "rgba(255,255,255,.06)",
  borderRadius: 12,
  padding: 15,
};

/* ================================= */
/* THEME TOGGLE */
/* ================================= */

const desktopThemeButtonStyle = {
  width: "100%",
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.05)",
  color: "#cbd5e1",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 12,
  fontWeight: 600,
  textAlign: "left" as const,
  transition: "all .2s ease",
};

const themeIconStyle = {
  width: 27,
  height: 27,
  borderRadius: 7,
  background: "rgba(255,255,255,.08)",
  display: "grid",
  placeItems: "center",
  fontSize: 15,
};

const themeArrowStyle = {
  marginLeft: "auto",
  fontSize: 13,
  color: "#64748b",
};

/* ================================= */
/* USER */
/* ================================= */

const userSectionStyle = {
  marginTop: 15,
  paddingTop: 15,
  borderTop: "1px solid rgba(255,255,255,.08)",
};

const userRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const userInfoStyle = {
  flex: 1,
  minWidth: 0,
};

const userNameStyle = {
  display: "block",
  fontSize: 13,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const userEmailStyle = {
  display: "block",
  color: "#94a3b8",
  fontSize: 11,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  marginTop: 2,
};

const avatarStyle = {
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: "50%",
  background: "#e2e8f0",
  color: "#172033",
  display: "grid",
  placeItems: "center",
  fontSize: 14,
  fontWeight: 700,
};

const logoutButtonStyle = {
  width: "100%",
  marginTop: 12,
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.05)",
  color: "#cbd5e1",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
};

/* ================================= */
/* MOBILE */
/* ================================= */

const mobileBrandStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const mobileActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const mobileLogoStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  background: "white",
  color: "#172033",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
};

const themeButtonStyle = {
  border: "none",
  background: "rgba(255,255,255,.1)",
  color: "white",
  width: 44,
  height: 44,
  borderRadius: 10,
  fontSize: 18,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const mobileMenuButtonStyle = {
  border: "none",
  background: "rgba(255,255,255,.1)",
  color: "white",
  width: 44,
  height: 44,
  borderRadius: 10,
  fontSize: 20,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};