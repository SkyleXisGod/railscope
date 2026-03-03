export default function Topbar({ onToggleSidebar }) {

  const menuItems = ["Mapa", "Pociągi", "Stacje", "Statystyki"];

  return (
    <div className="topbar">

      <div className="topbar-left">
        <button
          className="hamburger"
          onClick={onToggleSidebar}
        >
          ☰
        </button>

        <span className="logo">RailScope</span>
      </div>

      <div className="topbar-center">
        {menuItems.map((item, index) => (
            <div
            key={item}
            className={`topbar-slot ${index !== 0 ? "with-border" : ""}`}
            >
            <button className="topbar-nav-item">
                {item}
            </button>
            </div>
        ))}
        </div>

      <div className="topbar-right">
        <button>konto</button>
        <button>ustawienia</button>
      </div>

    </div>
  );
}