import "../layout/SideDrawer.css";

export default function SideDrawer({
    open,
    title,
    onClose,
    children
}) {
    return (
        <>
            {open && (
                <div
                    className="drawer-overlay"
                    onClick={onClose}
                />
            )}

            <aside className={`side-drawer ${open ? "open" : ""}`}>
            <div className="drawer-header">
    <div>
        <h2>{title}</h2>
        <p className="drawer-subtitle">
            Información clínica del tratamiento actual
        </p>
    </div>

    <button
        className="drawer-close"
        onClick={onClose}
    >
        ✕
    </button>
</div>

                <div className="drawer-content">
                    {children}
                </div>
            </aside>
        </>
    );
}