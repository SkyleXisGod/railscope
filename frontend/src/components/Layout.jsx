import Topbar from "./Topbar";

export default function Layout({ sidebar, children, sidebarOpen, onToggleSidebar }) {

  return (
    <div className="app">

      <Topbar onToggleSidebar={onToggleSidebar} />

      <div className="container">

        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          {sidebar}
        </div>

        <div className="content">
          {children}
        </div>

      </div>

    </div>
  );
}