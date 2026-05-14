import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { translations } from "./constants/translations";
import PageWrapper from "../components/PageWrapper";
import "./StatsPage.css";

export default function StatsPage() {
    const { user } = useAuth();
    const lang = user?.settings?.language || 'PL';
    const t = translations[lang].stats;
    
    const [stats, setStats] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:8080/api/stats").then(res => setStats(res.data));
    }, []);

    if (!stats) return <div className="loader">{t.subtitle}...</div>;

    // Przykładowe dane dla wykresów (emulacja rozkładu godzinowego)
    const hourlyData = [
        { name: '06:00', pociagi: 45, opoznienia: 2 },
        { name: '12:00', pociagi: 80, opoznienia: 15 },
        { name: '18:00', pociagi: 65, opoznienia: 8 },
        { name: '00:00', pociagi: 20, opoznienia: 1 },
    ];

    const COLORS = ['#00ffd5', '#f39c12', '#ff4d4d', '#0088ff'];

    return (
        <PageWrapper>
            <div className="stats-container">
                <header className="stats-header">
                    <h1>{t.title}</h1>
                    <p>{t.subtitle}</p>
                </header>

                <div className="stats-grid">
                    {/* Wielki Wykres Liniowy - Ruch */}
                    <div className="stats-card wide-card">
                        <h3>{t.network_load}</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                        formatter={(value, name) => [value, name === 'pociagi' ? t.tooltip_trains : t.tooltip_delays]}
                                    />
                                    <Line type="monotone" dataKey="pociagi" stroke="#00ffd5" strokeWidth={3} dot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="opoznienia" stroke="#ff4d4d" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Małe karty z danymi "nerdowskimi" */}
                    <div className="stats-card">
                        <h3>{t.global_punctuality}</h3>
                        <div className="big-number neon-text">{stats.traffic.punctuality}</div>
                        <p>{t.average_delay} {stats.traffic.averageDelay}</p>
                    </div>

                    <div className="stats-card">
                        <h3>{t.fleet_structure}</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie 
                                    data={[
                                        { name: 'IC', value: stats.distribution.IC },
                                        { name: 'REG', value: stats.distribution.REG }
                                    ]} 
                                    innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                >
                                    {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="stats-card">
                        <h3>{t.system_status}</h3>
                        <div className="tech-details">
                            <div className="row"><span>{t.uptime}</span> <span>{stats.system.uptime}</span></div>
                            <div className="row"><span>{t.api_calls}</span> <span>{stats.system.apiRequests}</span></div>
                            <div className="row"><span>{t.sql_index}</span> <span>Optimized</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}