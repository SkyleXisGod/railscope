import { useState, useEffect } from "react";
import axios from "axios";
import PageWrapper from "../components/PageWrapper";
import "./StatsPage.css";

export default function StatsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("http://localhost:8080/api/stats")
            .then(res => {
                setStats(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Błąd statystyk:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="loading">Analizowanie danych sieciowych...</div>;
    if (!stats) return <div className="error">Nie udało się pobrać statystyk.</div>;

    return (
        <PageWrapper>
            <div className="stats-container">
                <header className="stats-header">
                    <h1 className="stats-title">Statystyki</h1>
                    <p className="stats-subtitle">Podgląd kondycji polskiej sieci kolejowej w czasie rzeczywistym.</p>
                </header>
                <div className="stats-grid">
                    <div className="stats-card highlight">
                        <h3>Pociągi w trasie</h3>
                        <div className="big-value">{stats?.system?.activeTrains || 0}</div>
                        <p>Zaktualizowane dane z PLK</p>
                    </div>

                    <div className="stats-card">
                        <h3>Punktualność</h3>
                        <div className="big-value neon-green">{stats?.traffic?.punctuality || "100%"}</div>
                        <p>Tolerancja opóźnienia do 5 min</p>
                    </div>

                    <div className="stats-card">
                        <h3>Średnie Opóźnienie</h3>
                        <div className="big-value neon-orange">{stats?.traffic?.averageDelay || "0 min"}</div>
                        <p>Dla wszystkich składów</p>
                    </div>

                    <div className="stats-card wide">
                        <h3>Największe Opóźnienie</h3>
                        <div className="delay-record">
                            {/* Zauważ: używamy .value oraz .name - tak jak w Twoim JSONIE */}
                            <span className="delay-minutes">+{stats?.traffic?.biggestDelay?.value || 0} min</span>
                            <div className="delay-info">
                                <strong>{stats?.traffic?.biggestDelay?.name || "Pociąg"}</strong>
                                <span>Nr: {stats?.traffic?.biggestDelay?.number || "-"}</span>
                            </div>
                        </div>
                    </div>


                    <div className="stats-card">
                        <h3>Struktura Składów</h3>
                        <div className="category-split">
                            <div className="cat-item">
                                <span className="cat-label">IC/Premium</span>
                                <span className="cat-count">{stats.distribution.IC}</span>
                            </div>
                            <div className="cat-item">
                                <span className="cat-label">Regionalne</span>
                                <span className="cat-count">{stats.distribution.REG}</span>
                            </div>
                        </div>
                    </div>

                    <div className="stats-card technical">
                        <h3>Status Serwera</h3>
                        <div className="tech-list">
                            <div className="tech-row"><span>Uptime:</span> <strong>{stats.system.uptime}</strong></div>
                            <div className="tech-row"><span>Zapytania API:</span> <strong>{stats.system.apiRequests}</strong></div>
                            <div className="tech-row"><span>W bazie:</span> <strong>{stats.system.totalStations} stacji</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}