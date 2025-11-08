// src/components/SidebarMenu.js
import React from 'react';
import '../layout/Sidebar.css'
import Icon from './icons.jsx';

// 1. Definición de las opciones del menú
const menuItems = [
    {
        name: " Inicio",
        icon: "FiHome",
        href: "dashboard.html",
        disabled: false
    },
    {
        name: " General",
        icon: "FiGrid",
        href: "#",
        disabled: true
    },
    {
        name: " Carbohidratos",
        icon: "FiActivity",
        href: "#",
        disabled: true
    },
    {
        name: " Actividad Física",
        icon: "FiHeart",
        href: "actividad_fisica.html",
        disabled: true
    },
];

const SidebarMenu = () => {
    return (
        <div className="sidebar">
            <h2>Lorem ipsum</h2>
            <ul className="menu">
                {/* Mapear sobre el array de opciones para generar los <li> */}
                {menuItems.map((item, index) => (
                    <li key={index} className={item.disabled ? 'disabled' : ''}>
                        <a href={item.href}> 
                            <Icon name={item.icon} />
                            {item.name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SidebarMenu;