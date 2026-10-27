import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CloudSun, Droplets, Wind, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { WeatherData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WeatherWidgetProps {
  city?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ city = 'Nashik' }) => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/weather', { params: { city } });
      if (res.data?.weather) {
        setWeather(res.data.weather);
      }
    } catch (err) {
      console.warn('Weather fetch fallback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [city]);

  if (loading && !weather) {
    return (
      <div className="bg-emerald-900/10 border border-emerald-900/20 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-emerald-800/20 rounded w-1/3 mb-2" />
        <div className="h-6 bg-emerald-800/20 rounded w-2/3" />
      </div>
    );
  }

  if (!weather) return null;

  const isWarning = weather.harvestSafety === 'rain_warning';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-xs transition-all ${
        isWarning
          ? 'bg-amber-950/80 border-amber-600/40 text-amber-50'
          : 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 border-emerald-700/50 text-emerald-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-emerald-300">
            <CloudSun className="w-4 h-4 text-amber-300" />
            <span>{t('weatherHarvestTitle', 'Live Harvest Weather & Advisory')}</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-1">{weather.city}</h4>
        </div>
        <button
          onClick={fetchWeather}
          title="Refresh live weather"
          className="p-1 hover:bg-white/10 rounded-lg text-emerald-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 py-2 border-y border-white/10 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-extrabold text-white">{weather.temp}°C</span>
          <span className="text-[11px] text-emerald-200/90 leading-tight">{weather.condition}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-200">
          <Droplets className="w-3.5 h-3.5 text-sky-300 shrink-0" />
          <span>{weather.humidity}% {t('humidity', 'Humidity')}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-200">
          <Wind className="w-3.5 h-3.5 text-stone-300 shrink-0" />
          <span>{weather.windSpeed} km/h</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-start gap-2 text-xs">
        {isWarning ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <p className="text-emerald-100/90 leading-relaxed text-[11px]">
          <span className="font-bold text-white">Harvest Advisory: </span>
          {weather.advisory}
        </p>
      </div>
    </div>
  );
};
