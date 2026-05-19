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
    const [error, setError] = useState(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8080";
        axios.get(`${apiBase}/api/stats`)
            .then(res => setStats(res.data))
            .catch(err => setError(err.message || t.error_loading_stats));
    }, [t.error_loading_stats]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatLiveUptime = () => {
        if (!stats?.system) return '-';
        const start = stats.system.serverStartTimestamp ? Date.parse(stats.system.serverStartTimestamp) : NaN;
        if (!Number.isFinite(start)) return stats.system.uptime || '-';

        const diff = now - start;
        if (diff < 0) return stats.system.uptime || '-';

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${hours}h ${minutes}m ${String(seconds).padStart(2, '0')}s`;
    };

    if (error) return <div className="loader">{t.error_loading_stats}: {error}</div>;
    if (!stats) return <div className="loader">{t.subtitle}...</div>;

    const hourlyData = stats.hourlyTraffic && stats.hourlyTraffic.length > 0
        ? stats.hourlyTraffic
        : Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, count: 0 }));

    const majorCategories = ['IC', 'EIP', 'EIC', 'BUS', 'REGIO'];
    const normalizeCategory = (category) => {
        if (!category) return 'Other';
        const cat = String(category).toUpperCase();
        if (cat.includes('BUS') || cat === 'ZKA') return 'BUS';
        if (cat.startsWith('REG')) return 'REGIO';
        if (['IC', 'EIP', 'EIC'].includes(cat)) return cat;
        return 'Other';
    };

    const groupedCategories = Object.entries(stats.categoryBreakdown || {}).reduce((acc, [category, value]) => {
        const normalized = normalizeCategory(category);
        acc[normalized] = (acc[normalized] || 0) + value;
        return acc;
    }, {});

    const fleetCategories = majorCategories
        .map((name) => ({ name, value: groupedCategories[name] || 0 }))
        .filter((entry) => entry.value > 0);

    const otherValue = Object.entries(groupedCategories)
        .filter(([name]) => !majorCategories.includes(name))
        .reduce((sum, [, value]) => sum + value, 0);

    if (otherValue > 0) {
        fleetCategories.push({ name: 'Other', value: otherValue });
    }

    const stopBuckets = stats.routeStats?.stopBuckets || [];
    const durationBuckets = stats.routeStats?.durationBuckets || [];
    const topDestinations = stats.topDestinations || [];
    const topOrigins = stats.topOrigins || [];
    const delayBuckets = stats.traffic?.liveDelayBuckets || [];
    const topDelayedTrains = stats.topDelayedTrains || [];
    const routeStats = stats.routeStats || {};

    const formatDuration = (minutes) => {
        if (minutes === null || minutes === undefined) return '-';
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatCount = (value) => (value !== null && value !== undefined ? value : '-');

    const COLORS = ['#00ffd5', '#f39c12', '#ff4d4d', '#0088ff', '#8e44ad', '#f542dd'];

    return (
        <PageWrapper>
            <div className="stats-container">
                <header className="stats-header">
                    <h1>{t.title}</h1>
                    <p>{t.subtitle}</p>
                </header>

                <div className="stats-grid">
                    <div className="stats-card wide-card">
                        <h3>{t.hourly_departures}</h3>
                        <div style={{ width: '100%', height: 320, minHeight: 320 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                <LineChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="hour" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                        formatter={(value) => [value, t.tooltip_trains]}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#00ffd5" strokeWidth={3} dot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="stats-card">
                        <h3>{t.system_status}</h3>
                        <div className="metric-list">
                            <div className="metric-row"><span>{t.uptime}</span><strong>{formatLiveUptime()}</strong></div>
                            <div className="metric-row"><span>{t.api_calls}</span><strong>{stats.system.apiRequests}</strong></div>
                            <div className="metric-row"><span>{t.total_stations}</span><strong>{stats.system.totalStations}</strong></div>
                            <div className="metric-row"><span>{t.active_trains}</span><strong>{stats.system.activeTrains}</strong></div>
                            <div className="metric-row"><span>{t.unique_origins}</span><strong>{stats.traffic.origins}</strong></div>
                            <div className="metric-row"><span>{t.unique_destinations}</span><strong>{stats.traffic.destinations}</strong></div>
                        </div>
                    </div>

                    <div className="stats-card">
                        <h3>{t.global_punctuality}</h3>
                        <div className="big-value neon-green">{stats.traffic.punctuality}</div>
                        <p>{t.average_delay} <strong>{stats.traffic.averageDelay}</strong></p>
                        <div className="delay-record">
                            <div>
                                <span>{t.biggest_delay}</span>
                                <div className="delay-minutes">{stats.traffic.biggestDelay.value} min</div>
                                <div>{stats.traffic.biggestDelay.number}</div>
                            </div>
                        </div>
                        <div className="detail-list">
                            {delayBuckets.map((bucket) => (
                                <div className="detail-item" key={bucket.label}>
                                    <span>{bucket.label}</span>
                                    <strong>{bucket.count}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="stats-card">
                        <h3>{t.fleet_structure}</h3>
                        <div style={{ width: '100%', height: 220, minHeight: 220 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                <PieChart>
                                    <Pie data={fleetCategories} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={5}>
                                        {fleetCategories.map((entry, index) => (
                                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="detail-list scrollable">
                            {fleetCategories.map((item) => (
                                <div className="detail-item" key={item.name}>
                                    <span>{item.name}</span>
                                    <strong>{item.value}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="stats-card">
                        <h3>{t.route_statistics}</h3>
                        <div className="metric-list">
                            <div className="metric-row"><span>{t.average_stops}</span><strong>{formatCount(routeStats.averageStops)}</strong></div>
                            <div className="metric-row"><span>{t.median_stops}</span><strong>{formatCount(routeStats.medianStops)}</strong></div>
                            <div className="metric-row"><span>{t.min_stops}</span><strong>{formatCount(routeStats.minStops)}</strong></div>
                            <div className="metric-row"><span>{t.max_stops}</span><strong>{formatCount(routeStats.maxStops)}</strong></div>
                            <div className="metric-row"><span>{t.average_duration}</span><strong>{formatDuration(routeStats.averageDuration)}</strong></div>
                        </div>
                        <div style={{ width: '100%', height: 180, marginTop: 16, minHeight: 180 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                <BarChart data={stopBuckets} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="label" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                    <Bar dataKey="count" fill="#0088ff" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ width: '100%', height: 160, marginTop: 16, minHeight: 160 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                <BarChart data={durationBuckets} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="label" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                    <Bar dataKey="count" fill="#f39c12" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="stats-card wide-card">
                        <h3>{t.top_destinations}</h3>
                        <div className="detail-row-double">
                            <div>
                                <h4>{t.top_origins}</h4>
                                <div className="detail-list">
                                    {topOrigins.slice(0, 5).map((item) => (
                                        <div className="detail-item" key={item.name}>
                                            <span>{item.name}</span>
                                            <strong>{item.count}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4>{t.top_destinations}</h4>
                                <div className="detail-list">
                                    {topDestinations.slice(0, 5).map((item) => (
                                        <div className="detail-item" key={item.name}>
                                            <span>{item.name}</span>
                                            <strong>{item.count}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <h4 style={{ marginTop: 20 }}>{t.top_delayed_trains}</h4>
                        <div className="detail-list">
                            {topDelayedTrains.length > 0 ? topDelayedTrains.map((train, idx) => (
                                <div className="detail-item" key={`${train.number}-${idx}`}>
                                    <span>{`${train.number} (${train.category})`}</span>
                                    <strong>{train.delay} min</strong>
                                </div>
                            )) : (
                                <div className="detail-item">
                                    <span>{t.no_delay_data}</span>
                                    <strong>—</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}