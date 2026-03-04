import Topbar from "./Topbar";
import logo from "../assets/railscope-minature.png";

export default function Layout({
  children,
  sidebarOpen,
  onToggleSidebar,
  sidebar
}) {

  return (
    <div className="app">

      <Topbar onToggleSidebar={onToggleSidebar} />

      <div className="page-wrapper">
        {children}
      </div>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-inner">

          <div className="sidebar-header">
            <img src={logo} className="sidebar-logo" />
          </div>
          
          {sidebar}
          
        </div>
      </div>

    </div>
  );
}