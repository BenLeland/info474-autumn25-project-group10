// asset_analytics.js
// Computes personality metrics for financial assets: volatility, best years, worst crashes, correlations, sparklines

(function () {
    'use strict';

    /**
     * Parse CSV string into array of objects
     */
    function parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx];
            });
            data.push(row);
        }
        
        return data;
    }

    /**
     * Parse date in MM/DD/YYYY format
     */
    function parseDate(dateStr) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[0] - 1, parts[1]);
        }
        return new Date(dateStr);
    }

    /**
     * Clean price string (remove commas, convert to number)
     */
    function cleanPrice(priceStr) {
        if (!priceStr) return NaN;
        return parseFloat(priceStr.replace(/,/g, ''));
    }

    /**
     * Process raw CSV data into time series
     */
    function processTimeSeries(rawData) {
        const series = [];
        
        for (let i = rawData.length - 1; i >= 0; i--) {
            const row = rawData[i];
            const date = parseDate(row.Date);
            const price = cleanPrice(row.Price);
            
            if (!isNaN(price) && date) {
                series.push({
                    date: date,
                    price: price,
                    year: date.getFullYear()
                });
            }
        }
        
        return series;
    }

    /**
     * Calculate daily returns
     */
    function calculateReturns(series) {
        const returns = [];
        for (let i = 1; i < series.length; i++) {
            const ret = (series[i].price / series[i - 1].price) - 1;
            returns.push({
                date: series[i].date,
                return: ret
            });
        }
        return returns;
    }

    /**
     * Calculate standard deviation
     */
    function stdDev(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    /**
     * Calculate annualized volatility
     */
    function calculateVolatility(returns) {
        const returnValues = returns.map(r => r.return);
        const dailyVol = stdDev(returnValues);
        const annualizedVol = dailyVol * Math.sqrt(365);
        return annualizedVol * 100; // Convert to percentage
    }

    /**
     * Classify volatility
     */
    function classifyVolatility(vol) {
        if (vol < 10) return 'Low';
        if (vol < 25) return 'Medium';
        if (vol < 80) return 'High';
        return 'Extreme';
    }

    /**
     * Calculate yearly returns
     */
    function calculateYearlyReturns(series) {
        const yearlyData = {};
        
        series.forEach(point => {
            const year = point.year;
            if (!yearlyData[year]) {
                yearlyData[year] = { start: point.price, end: point.price };
            }
            yearlyData[year].end = point.price;
        });
        
        const yearlyReturns = [];
        for (const year in yearlyData) {
            const data = yearlyData[year];
            const ret = (data.end / data.start - 1) * 100;
            yearlyReturns.push({ year: parseInt(year), return: ret });
        }
        
        return yearlyReturns.sort((a, b) => b.return - a.return);
    }

    /**
     * Calculate maximum drawdown
     */
    function calculateDrawdowns(series) {
        const drawdowns = [];
        let peak = series[0].price;
        let peakDate = series[0].date;
        
        for (let i = 1; i < series.length; i++) {
            if (series[i].price > peak) {
                peak = series[i].price;
                peakDate = series[i].date;
            } else {
                const drawdown = (series[i].price - peak) / peak * 100;
                if (drawdown < -5) { // Only track significant drawdowns
                    drawdowns.push({
                        peak: peak,
                        trough: series[i].price,
                        drawdown: drawdown,
                        peakDate: peakDate,
                        troughDate: series[i].date
                    });
                }
            }
        }
        
        // Return top 3 worst drawdowns
        return drawdowns.sort((a, b) => a.drawdown - b.drawdown).slice(0, 3);
    }

    /**
     * Calculate correlation between two return series
     */
    function calculateCorrelation(returns1, returns2) {
        // Align dates
        const map1 = new Map(returns1.map(r => [r.date.toISOString().split('T')[0], r.return]));
        const map2 = new Map(returns2.map(r => [r.date.toISOString().split('T')[0], r.return]));
        
        const aligned = [];
        map1.forEach((ret1, date) => {
            if (map2.has(date)) {
                aligned.push({ x: ret1, y: map2.get(date) });
            }
        });
        
        if (aligned.length < 2) return 0;
        
        const meanX = aligned.reduce((sum, p) => sum + p.x, 0) / aligned.length;
        const meanY = aligned.reduce((sum, p) => sum + p.y, 0) / aligned.length;
        
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        
        aligned.forEach(p => {
            const dx = p.x - meanX;
            const dy = p.y - meanY;
            numerator += dx * dy;
            denomX += dx * dx;
            denomY += dy * dy;
        });
        
        return numerator / Math.sqrt(denomX * denomY);
    }

    /**
     * Create normalized sparkline data (weekly sampling)
     */
    function createSparklineData(series, weeksCount = 52) {
        if (series.length === 0) return [];
        
        // Sample weekly (every 7 data points approximately)
        const step = Math.max(1, Math.floor(series.length / weeksCount));
        const sampled = [];
        
        for (let i = 0; i < series.length; i += step) {
            sampled.push(series[i].price);
        }
        
        // Normalize 0-100
        const min = Math.min(...sampled);
        const max = Math.max(...sampled);
        const range = max - min;
        
        return sampled.map(price => {
            if (range === 0) return 50;
            return ((price - min) / range) * 100;
        });
    }

    /**
     * Calculate safe haven score (performance during crisis periods)
     * Higher positive returns during known crisis periods = better safe haven
     */
    function calculateSafeHavenScore(series) {
        // Define crisis windows
        const crises = [
            { start: new Date(2020, 2, 1), end: new Date(2020, 3, 30), name: 'COVID-2020' },
            { start: new Date(2022, 1, 1), end: new Date(2022, 2, 31), name: 'Ukraine-2022' },
            { start: new Date(2018, 9, 1), end: new Date(2018, 11, 31), name: 'Q4-2018' }
        ];
        
        let totalCrisisReturn = 0;
        let crisisCount = 0;
        
        crises.forEach(crisis => {
            const crisisData = series.filter(p => p.date >= crisis.start && p.date <= crisis.end);
            if (crisisData.length > 1) {
                const ret = (crisisData[crisisData.length - 1].price / crisisData[0].price - 1) * 100;
                totalCrisisReturn += ret;
                crisisCount++;
            }
        });
        
        return crisisCount > 0 ? totalCrisisReturn / crisisCount : 0;
    }

    /**
     * Compute all analytics for an asset
     */
    function computeAssetAnalytics(rawData, name, sp500Returns = null) {
        const series = processTimeSeries(rawData);
        if (series.length === 0) {
            return null;
        }
        
        const returns = calculateReturns(series);
        const volatility = calculateVolatility(returns);
        const yearlyReturns = calculateYearlyReturns(series);
        const drawdowns = calculateDrawdowns(series);
        const sparkline = createSparklineData(series, 100);
        const safeHavenScore = calculateSafeHavenScore(series);
        
        let correlation = null;
        if (sp500Returns) {
            correlation = calculateCorrelation(returns, sp500Returns);
        }
        
        return {
            name: name,
            volatility: volatility,
            volatilityClass: classifyVolatility(volatility),
            bestYears: yearlyReturns.slice(0, 3),
            worstYears: yearlyReturns.slice(-3).reverse(),
            drawdowns: drawdowns,
            sparkline: sparkline,
            safeHavenScore: safeHavenScore,
            correlation: correlation
        };
    }

    /**
     * Load and process all assets
     */
    async function loadAllAssets() {
        const assets = [
            { file: 'Bitcoin Historical Data.csv', name: 'Bitcoin' },
            { file: 'Gold Futures Historical Data.csv', name: 'Gold' },
            { file: 'Crude Oil WTI Futures Historical Data.csv', name: 'Oil' },
            { file: 'S&P 500 Historical Data.csv', name: 'S&P 500' },
            { file: 'US Dollar Index Historical Data.csv', name: 'USD Index' }
        ];
        
        const results = {};
        
        // Load all CSV files
        const dataPromises = assets.map(asset => 
            fetch(`data/${asset.file}`)
                .then(r => r.text())
                .then(text => ({ name: asset.name, data: parseCSV(text) }))
        );
        
        const loadedData = await Promise.all(dataPromises);
        
        // Process S&P 500 first to get returns for correlation
        const sp500Data = loadedData.find(d => d.name === 'S&P 500');
        const sp500Series = processTimeSeries(sp500Data.data);
        const sp500Returns = calculateReturns(sp500Series);
        
        // Process all assets
        loadedData.forEach(({ name, data }) => {
            const analytics = computeAssetAnalytics(
                data, 
                name, 
                name !== 'S&P 500' ? sp500Returns : null
            );
            results[name] = analytics;
        });
        
        return results;
    }

    // Export to window
    window.AssetAnalytics = {
        loadAllAssets: loadAllAssets,
        computeAssetAnalytics: computeAssetAnalytics,
        parseCSV: parseCSV
    };

})();
