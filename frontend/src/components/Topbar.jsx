import { useNavigate } from "react-router-dom";

export default function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Mapa", path: "/" },
    { label: "Pociągi", path: "/pociagi" },
    { label: "Stacje", path: "/stacje" },
    { label: "Statystyki", path: "/statystyki" }
  ];

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="hamburger"
          onClick={onToggleSidebar}
        >
          ☰
        </button>

        <span className="brand-title" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          Railscope
        </span>
      </div>

      <div className="topbar-center">
        {menuItems.map((item) => (
          <div key={item.label} className="topbar-slot">
            <button 
              className="topbar-nav-item"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          </div>
        ))}
      </div>

      <div className="topbar-right">
        <button className="icon-btn user-btn">
          <div className="user-avatar"></div>
        </button>

        <button className="icon-btn gear-btn">
          ⚙
        </button>
      </div>
    </div>
  );
}