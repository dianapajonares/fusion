import React from 'react';
import MainLayout from '../components/MainLayout';

const DashboardPage = () => {
    // Aquí iría la lógica para obtener el nombre del médico o datos de inicio

    return (
        // Llama al MainLayout y pasa el contenido específico como 'children'
        <MainLayout>
            {/* ESTE CONTENIDO SE INYECTARÁ en el {children} del Layout */}
            <header className="page-header">
                <h1>Bienvenido al Panel de Control</h1>
                <p>Aquí se mostrará el resumen de pacientes y las alertas.</p>
            </header>
            
            <section className="dashboard-widgets">
                {/* Aquí irían componentes de resumen (Widgets) o el gráfico inicial */}
                <div className="widget">Carga Total de Pacientes</div>
                <div className="widget">Últimas Alertas de Fusión</div>
            </section>
            
        </MainLayout>
    );
};

export default DashboardPage;