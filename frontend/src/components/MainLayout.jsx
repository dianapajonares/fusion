import React from 'react';
import SidebarMenu from './SideBarMenu.jsx';

const MainLayout = ({ children }) => {
    return (
        <div className="app-container">
            <aside className="sidebar"> {/* <-- Clase .sidebar aquí */}
                <SidebarMenu />
            </aside>
            <main className="main-content"> {/* <-- Clase .main-content aquí */}
                {children}
            </main>
        </div>
    );
};

export default MainLayout;