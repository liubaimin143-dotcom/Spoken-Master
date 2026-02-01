import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { WatercolorBackground } from './WatercolorBackground';
import './MainLayout.css';

export function MainLayout() {
    return (
        <>
            <Sidebar />
            <main className="main-content">
                <WatercolorBackground />
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
        </>
    );
}

export default MainLayout;
