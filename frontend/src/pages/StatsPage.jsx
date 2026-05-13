import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import PageWrapper from "../components/PageWrapper";
import "./StatsPage.css";

export default function StatsPage() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:8080/api/stats").then(res => setStats(res.data));
    }, []);

    if (!stats) return <div className="loader">Inicjalizacja macierzy danych...</div>;

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
                    <h1>Network Intelligence Dashboard</h1>
                    <p>Analiza przepływu jednostek trakcyjnych w czasie rzeczywistym.</p>
                </header>

                <div className="stats-grid">
                    {/* Wielki Wykres Liniowy - Ruch */}
                    <div className="stats-card wide-card">
                        <h3>Obciążenie Sieci (24h)</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                    <Line type="monotone" dataKey="pociagi" stroke="#00ffd5" strokeWidth={3} dot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="opoznienia" stroke="#ff4d4d" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Małe karty z danymi "nerdowskimi" */}
                    <div className="stats-card">
                        <h3>Punktualność Globalna</h3>
                        <div className="big-number neon-text">{stats.traffic.punctuality}</div>
                        <p>Średnie opóźnienie: {stats.traffic.averageDelay}</p>
                    </div>

                    <div className="stats-card">
                        <h3>Struktura Taboru</h3>
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
                        <h3>Status Systemu</h3>
                        <div className="tech-details">
                            <div className="row"><span>Uptime:</span> <span>{stats.system.uptime}</span></div>
                            <div className="row"><span>API Calls:</span> <span>{stats.system.apiRequests}</span></div>
                            <div className="row"><span>SQL Index:</span> <span>Optimized</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}