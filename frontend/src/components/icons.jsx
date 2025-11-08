import React from 'react';
import * as FiIcons from '../icons/FiIcons'; 

/**
 * @param {string} name - Nombre del icono (ej: 'FiHome', 'FiSettings').
 * @param {object} props - Propiedades adicionales.
 */
const Icon = ({ name, ...props }) => {
    // Busca el componente de icono por su nombre (ej: FiHome)
    const FeatherIconComponent = FiIcons[name]; 

    if (!FeatherIconComponent) {
        // Devuelve un placeholder si el nombre del ícono no es válido
        console.warn(`Icono no encontrado: ${name}`);
        return <span>?</span>; 
    }

    // Renderiza el componente de icono de React
    return <FeatherIconComponent {...props} />;
};

export default Icon;