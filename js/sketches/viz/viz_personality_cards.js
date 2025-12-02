// viz_personality_cards.js
// Scrollytelling visualization showing "Asset Personality Cards" with real data-driven metrics

(function () {
    'use strict';

    // Card definitions with personality descriptions
    const CARDS = [
        {
            id: 'bitcoin',
            title: 'Bitcoin',
            subtitle: 'A rocket with no seatbelt.',
            description: 'Bitcoin is explosive, unpredictable, and reactive—capable of extreme booms and catastrophic crashes within days.',
            color: '#F7931A',
            icon: 'crypto'
        },
        {
            id: 'gold',
            title: 'Gold',
            subtitle: 'The steady grandma of finance.',
            description: 'Gold is calm. When panic spreads, it stabilizes portfolios and moves gently upward.',
            color: '#FFD700',
            icon: 'shield'
        },
        {
            id: 'oil',
            title: 'Oil',
            subtitle: 'The mood-swinging drama uncle.',
            description: 'Oil reacts to war, supply cuts, and global demand. It can skyrocket or collapse depending on geopolitics.',
            color: '#2C2C2C',
            icon: 'drop'
        },
        {
            id: 'sp500',
            title: 'S&P 500',
            subtitle: 'The dependable corporate workhorse.',
            description: 'S&P 500 reflects human economic activity. It grows in good times, falls in global uncertainty.',
            color: '#4169E1',
            icon: 'chart'
        },
        {
            id: 'usd',
            title: 'USD Index',
            subtitle: 'The global referee.',
            description: 'The U.S. dollar is the world\'s safe haven. When everything breaks, people run to the dollar.',
            color: '#2ECC71',
            icon: 'dollar'
        }
    ];

    // Map asset names from analytics to card IDs
    const ASSET_NAME_MAP = {
        'Bitcoin': 'bitcoin',
        'Gold': 'gold',
        'Oil': 'oil',
        'S&P 500': 'sp500',
        'USD Index': 'usd'
    };

    let analyticsData = null;
    let isLoading = true;
    let currentCardIndex = 0;
    let fadeProgress = 0;
    let nextCardIndex = 0;
    let isTransitioning = false;

    /**
     * Load analytics data on initialization
     */
    function initData() {
        if (typeof window.AssetAnalytics === 'undefined') {
            console.error('AssetAnalytics module not loaded');
            return;
        }

        window.AssetAnalytics.loadAllAssets()
            .then(data => {
                analyticsData = data;
                isLoading = false;
                console.log('Asset analytics loaded:', analyticsData);
            })
            .catch(err => {
                console.error('Failed to load asset analytics:', err);
                isLoading = false;
            });
    }

    /**
     * Draw an icon for each asset type
     */
    function drawIcon(p, x, y, size, iconType, color) {
        p.push();
        p.translate(x, y);
        p.noFill();
        p.stroke(color);
        p.strokeWeight(3);

        switch (iconType) {
            case 'crypto': // Bitcoin symbol
                p.circle(0, 0, size);
                p.line(0, -size * 0.35, 0, size * 0.35);
                p.line(-size * 0.25, -size * 0.15, size * 0.25, -size * 0.15);
                p.line(-size * 0.25, size * 0.15, size * 0.25, size * 0.15);
                break;

            case 'shield': // Gold shield
                p.beginShape();
                p.vertex(0, -size * 0.4);
                p.vertex(size * 0.35, -size * 0.2);
                p.vertex(size * 0.35, size * 0.1);
                p.vertex(0, size * 0.4);
                p.vertex(-size * 0.35, size * 0.1);
                p.vertex(-size * 0.35, -size * 0.2);
                p.endShape(p.CLOSE);
                break;

            case 'drop': // Oil drop
                p.beginShape();
                p.vertex(0, -size * 0.4);
                p.bezierVertex(size * 0.3, -size * 0.2, size * 0.3, size * 0.2, 0, size * 0.4);
                p.bezierVertex(-size * 0.3, size * 0.2, -size * 0.3, -size * 0.2, 0, -size * 0.4);
                p.endShape(p.CLOSE);
                break;

            case 'chart': // S&P 500 rising chart
                p.beginShape();
                p.vertex(-size * 0.4, size * 0.2);
                p.vertex(-size * 0.2, 0);
                p.vertex(0, size * 0.1);
                p.vertex(size * 0.2, -size * 0.2);
                p.vertex(size * 0.4, -size * 0.3);
                p.endShape();
                break;

            case 'dollar': // USD dollar sign
                p.line(0, -size * 0.4, 0, size * 0.4);
                p.noFill();
                p.arc(0, -size * 0.15, size * 0.4, size * 0.3, p.PI, p.TWO_PI);
                p.arc(0, size * 0.15, size * 0.4, size * 0.3, 0, p.PI);
                break;
        }

        p.pop();
    }

    /**
     * Draw sparkline chart
     */
    function drawSparkline(p, x, y, width, height, data, color) {
        if (!data || data.length < 2) return;

        p.push();
        p.noFill();
        p.stroke(color);
        p.strokeWeight(2);

        p.beginShape();
        for (let i = 0; i < data.length; i++) {
            const px = x + (i / (data.length - 1)) * width;
            const py = y + height - (data[i] / 100) * height;
            p.vertex(px, py);
        }
        p.endShape();

        p.pop();
    }

    /**
     * Format percentage
     */
    function formatPercent(value) {
        const sign = value >= 0 ? '+' : '';
        return sign + value.toFixed(1) + '%';
    }

    /**
     * Draw a single personality card
     */
    function drawCard(p, cardIndex, alpha, offsetX, offsetY, cardWidth, cardHeight) {
        if (cardIndex < 0 || cardIndex >= CARDS.length) return;

        const card = CARDS[cardIndex];
        const analytics = analyticsData ? analyticsData[card.title] : null;

        p.push();
        p.translate(offsetX, offsetY);

        // Card background
        p.fill(255, 255, 255, alpha);
        p.noStroke();
        p.rect(0, 0, cardWidth, cardHeight, 12);

        // Border
        p.noFill();
        p.stroke(card.color + Math.floor(alpha).toString(16).padStart(2, '0'));
        p.strokeWeight(3);
        p.rect(0, 0, cardWidth, cardHeight, 12);

        // Set text alpha
        const textAlpha = alpha;

        // Icon
        const iconSize = 80;
        const iconX = cardWidth / 2;
        const iconY = 100;
        const iconColor = p.color(card.color);
        iconColor.setAlpha(textAlpha);
        drawIcon(p, iconX, iconY, iconSize, card.icon, iconColor);

        // Title
        p.fill(50, 50, 50, textAlpha);
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(36);
        p.textStyle(p.BOLD);
        p.text(card.title, cardWidth / 2, 170);

        // Subtitle
        p.textSize(18);
        p.textStyle(p.ITALIC);
        p.fill(100, 100, 100, textAlpha);
        p.text(card.subtitle, cardWidth / 2, 215);

        // Description
        p.textSize(14);
        p.textStyle(p.NORMAL);
        p.fill(80, 80, 80, textAlpha);
        p.textAlign(p.LEFT, p.TOP);
        const descPadding = 40;
        const descY = 260;
        const words = card.description.split(' ');
        let line = '';
        let lineY = descY;
        const lineHeight = 20;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const testWidth = p.textWidth(testLine);
            if (testWidth > cardWidth - descPadding * 2 && i > 0) {
                p.text(line, descPadding, lineY);
                line = words[i] + ' ';
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }
        p.text(line, descPadding, lineY);

        // Metrics section
        if (analytics) {
            const metricsY = 350; // Moved up from 370
            const metricX = 40;
            const metricSpacing = 70;

            p.textAlign(p.LEFT, p.TOP);
            p.textSize(12);
            p.textStyle(p.BOLD);
            p.fill(120, 120, 120, textAlpha);

            let currentY = metricsY;

            // Volatility
            p.text('Volatility:', metricX, currentY);
            p.textStyle(p.NORMAL);
            p.fill(50, 50, 50, textAlpha);
            p.text(analytics.volatilityClass + ' (' + analytics.volatility.toFixed(1) + '%)', metricX + 80, currentY);

            currentY += 25;

            // Best year
            if (analytics.bestYears && analytics.bestYears.length > 0) {
                p.textStyle(p.BOLD);
                p.fill(120, 120, 120, textAlpha);
                p.text('Best Year:', metricX, currentY);
                p.textStyle(p.NORMAL);
                p.fill(50, 50, 50, textAlpha);
                const best = analytics.bestYears[0];
                p.text(best.year + ' (' + formatPercent(best.return) + ')', metricX + 80, currentY);
            }

            currentY += 25;

            // Worst crash
            if (analytics.drawdowns && analytics.drawdowns.length > 0) {
                p.textStyle(p.BOLD);
                p.fill(120, 120, 120, textAlpha);
                p.text('Worst Crash:', metricX, currentY);
                p.textStyle(p.NORMAL);
                p.fill(50, 50, 50, textAlpha);
                const worst = analytics.drawdowns[0];
                p.text(formatPercent(worst.drawdown), metricX + 90, currentY);
            }

            currentY += 25;

            // Safe haven score
            p.textStyle(p.BOLD);
            p.fill(120, 120, 120, textAlpha);
            p.text('Safe Haven:', metricX, currentY);
            p.textStyle(p.NORMAL);
            p.fill(50, 50, 50, textAlpha);
            const safeHavenText = analytics.safeHavenScore > 5 ? 'High' : 
                                 analytics.safeHavenScore > 0 ? 'Medium' : 'Low';
            p.text(safeHavenText, metricX + 90, currentY);

            currentY += 25;

            // Correlation to S&P 500
            if (analytics.correlation !== null) {
                p.textStyle(p.BOLD);
                p.fill(120, 120, 120, textAlpha);
                p.text('S&P Correlation:', metricX, currentY);
                p.textStyle(p.NORMAL);
                p.fill(50, 50, 50, textAlpha);
                p.text(analytics.correlation.toFixed(2), metricX + 110, currentY);
            }
        } else if (!isLoading) {
            // Show "Loading..." message
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.textStyle(p.ITALIC);
            p.fill(120, 120, 120, textAlpha);
            p.text('Loading data...', cardWidth / 2, 450);
        }

        p.pop();
    }

    /**
     * Main draw function
     */
    window.VizPersonalityCards = {
        setup: function (p) {
            // Initialize data loading
            initData();
        },

        draw: function (p, manager, activeIndex, progress) {
            // Only show cards for indices 5-9
            // activeIndex 5 = Bitcoin (card 0)
            // activeIndex 6 = Gold (card 1)
            // activeIndex 7 = Oil (card 2)
            // activeIndex 8 = S&P 500 (card 3)
            // activeIndex 9 = USD Index (card 4)
            
            // Don't render anything if not in range
            if (activeIndex < 5 || activeIndex > 9) {
                return;
            }
            
            let mappedIndex = activeIndex - 5; // Map 5->0, 6->1, 7->2, 8->3, 9->4
            mappedIndex = Math.max(0, Math.min(CARDS.length - 1, mappedIndex));

            // Handle transitions
            if (mappedIndex !== currentCardIndex && !isTransitioning) {
                isTransitioning = true;
                nextCardIndex = mappedIndex;
                fadeProgress = 0;
            }


            if (isTransitioning) {
                fadeProgress += 0.05;
                if (fadeProgress >= 1) {
                    fadeProgress = 1;
                    currentCardIndex = nextCardIndex;
                    isTransitioning = false;
                }
            }

            // Calculate card dimensions and position
            const maxWidth = 500;
            const maxHeight = 750; // Increased from 700 to fit all content
            const cardWidth = Math.min(maxWidth, manager.width * 0.8);
            const cardHeight = Math.min(maxHeight, manager.height * 0.95);

            const offsetX = (manager.offsetX || 0) + (manager.width - cardWidth) / 2;
            const offsetY = (manager.offsetY || 0) + (manager.height - cardHeight) / 2;

            // Draw cards with fade effect
            if (isTransitioning) {
                // Fade out old card
                const oldAlpha = 255 * (1 - fadeProgress);
                drawCard(p, currentCardIndex, oldAlpha, offsetX, offsetY, cardWidth, cardHeight);

                // Fade in new card
                const newAlpha = 255 * fadeProgress;
                drawCard(p, nextCardIndex, newAlpha, offsetX, offsetY, cardWidth, cardHeight);
            } else {
                // Just draw current card
                drawCard(p, currentCardIndex, 255, offsetX, offsetY, cardWidth, cardHeight);
            }
        }
    };

})();
