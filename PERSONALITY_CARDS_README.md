# Asset Personality Cards - Implementation Summary

## Overview
A scrollytelling visualization that presents five financial assets (Bitcoin, Gold, Oil, S&P 500, USD Index) as "personality cards" with real data-driven metrics and smooth transitions.

## What Was Implemented

### 1. Data Processing Module (`js/helpers/asset_analytics.js`)
**Features:**
- Parses CSV files for all 5 assets
- Computes key metrics:
  - **Annualized Volatility**: Standard deviation of daily returns × √365
  - **Volatility Classification**: Low (<10%), Medium (10-25%), High (25-80%), Extreme (>80%)
  - **Best/Worst Years**: Sorted yearly returns
  - **Maximum Drawdowns**: Top 3 worst peak-to-trough declines
  - **Safe Haven Score**: Average performance during crisis periods (COVID-2020, Ukraine-2022, Q4-2018)
  - **Correlation to S&P 500**: Pearson correlation of daily returns
  - **Sparkline Data**: 100-point normalized weekly price series (0-100 scale)

**Key Functions:**
- `loadAllAssets()`: Loads and processes all CSV data asynchronously
- `computeAssetAnalytics()`: Calculates all metrics for a single asset
- `calculateVolatility()`: Annualized volatility from daily returns
- `createSparklineData()`: Normalized weekly price samples

### 2. Personality Cards Visualization (`js/sketches/viz/viz_personality_cards.js`)
**Features:**
- 5 unique card designs with personality-based descriptions
- Custom icons for each asset (Bitcoin symbol, Gold shield, Oil drop, S&P chart, USD dollar)
- Real-time data display showing:
  - Volatility classification and percentage
  - Best performing year with return %
  - Worst crash (drawdown %)
  - Safe haven score
  - S&P 500 correlation coefficient
  - Sparkline chart of historical prices
- Smooth fade transitions between cards (5% increment per frame)
- Responsive layout (max 500×700px cards, centered)

**Card Personalities:**
1. **Bitcoin**: "A rocket with no seatbelt" - Extreme volatility, massive gains/losses
2. **Gold**: "The steady grandma of finance" - Low volatility, safe haven
3. **Oil**: "The mood-swinging drama uncle" - Geopolitical sensitivity
4. **S&P 500**: "The dependable corporate workhorse" - Steady growth, crisis-sensitive
5. **USD Index**: "The global referee" - Ultimate safe haven

### 3. Integration with Scrollytelling Framework
**Changes:**
- Updated `index.html` to include:
  - `asset_analytics.js` script
  - `viz_personality_cards.js` script
  - 6 new sections (indices 4-9) for personality cards
- Modified `sketch_renderer.js` to:
  - Route indices 4-9 to personality cards visualization
  - Initialize cards on setup
  - Update remaining visualizations to new indices (10-12)

### 4. New HTML Sections
Added descriptive sections for each asset:
- Section 4: "Meet the Assets" (intro)
- Section 5: Bitcoin card
- Section 6: Gold card
- Section 7: Oil card
- Section 8: S&P 500 card
- Section 9: USD Index card

## Data Sources
Real historical data from CSV files (2013-2025):
- `Bitcoin Historical Data.csv`
- `Gold Futures Historical Data.csv`
- `Crude Oil WTI Futures Historical Data.csv`
- `S&P 500 Historical Data.csv`
- `US Dollar Index Historical Data.csv`

## Technical Details

### Volatility Calculation
```javascript
daily_return = (price_t / price_t-1) - 1
volatility_annualized = std_dev(daily_returns) × √365 × 100
```

### Drawdown Calculation
```javascript
drawdown = (trough - peak) / peak × 100
```

### Sparkline Normalization
```javascript
normalized = ((price - min) / (max - min)) × 100
```

## Usage
1. Scroll through the page to reach section 4
2. Continue scrolling to cycle through all 5 asset personality cards
3. Each card fades in/out smoothly with real calculated metrics
4. Sparklines show historical price trends from 2013-2025

## Commits Made
1. ✅ `3d656ac` - Add asset analytics module for computing volatility, returns, drawdowns, and correlations
2. ✅ `fc72525` - Add personality cards visualization with smooth transitions and data-driven metrics
3. ✅ `d28e93a` - Integrate personality cards into scrollytelling flow with new sections

## Future Enhancements
- Add crisis event markers on sparklines
- Interactive hover details on metrics
- Comparison mode showing multiple cards side-by-side
- Animated transitions for individual metrics
- Mobile-responsive card sizing
- Add more crisis periods for safe haven scoring

## Testing
Run local server:
```bash
python3 -m http.server 8000
```
Navigate to: `http://localhost:8000`

Scroll to sections 4-9 to see the personality cards in action.
